import crypto from "crypto";

const GRAPH = "https://graph.facebook.com/v21.0";
const DIALOG = "https://www.facebook.com/v21.0/dialog/oauth";

export const REQUIRED_ENV = [
  "FB_APP_ID",
  "FB_APP_SECRET",
  "FB_REDIRECT_URI",
  "FRONTEND_URL",
];

// Read env lazily: ESM evaluates imports before dotenv.config() runs
export const getConfig = () => ({
  FB_APP_ID: process.env.FB_APP_ID,
  FB_APP_SECRET: process.env.FB_APP_SECRET,
  FB_REDIRECT_URI: process.env.FB_REDIRECT_URI,
  FRONTEND_URL: (process.env.FRONTEND_URL || "").replace(/\/$/, ""),
});

export const getMissingEnv = () =>
  REQUIRED_ENV.filter((key) => !process.env[key]);

const graph = async (path, params) => {
  const url = new URL(GRAPH + path);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Facebook API request failed (${response.status})`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || "Facebook API error");
  }

  return data;
};

export const getMessengerUserProfile = async (senderId, pageAccessToken) => {
  const profile = await graph(`/${encodeURIComponent(senderId)}`, {
    fields: "first_name,last_name,profile_pic",
    access_token: pageAccessToken,
  });
  const name = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    username: name || String(senderId),
    image: profile.profile_pic || null,
  };
};

// Generate Facebook login URL
export const getFacebookLoginUrl = () => {
  const { FB_APP_ID, FB_REDIRECT_URI } = getConfig();

  const state = crypto.randomBytes(32).toString("hex");

  const url = new URL(DIALOG);

  url.search = new URLSearchParams({
    client_id: FB_APP_ID,
    redirect_uri: FB_REDIRECT_URI,
    state,
    response_type: "code",
    scope:
      "public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_metadata,pages_messaging,business_management",
  });

  return {
    url: url.toString(),
    state,
  };
};

// Pages the user manages.
// `/me/accounts` omits Pages owned by a Business portfolio unless the token
// also has business_management. When that happens we fall back to the Pages
// assigned to the user through a Business and resolve their tokens one by one.
const getManagedPages = async (userId, accessToken) => {
  const accounts = await graph(`/${userId}/accounts`, {
    fields: "id,name,access_token,picture,tasks",
    limit: "100",
    access_token: accessToken,
  });

  if (Array.isArray(accounts.data) && accounts.data.length > 0) {
    return accounts.data;
  }

  let assigned;
  try {
    assigned = await graph(`/${userId}/assigned_pages`, {
      fields: "id,name,tasks",
      limit: "100",
      access_token: accessToken,
    });
  } catch (error) {
    console.warn("Facebook assigned_pages lookup failed:", error.message);
    return [];
  }

  const pages = [];
  for (const page of assigned.data || []) {
    if (!page?.id) continue;
    try {
      const detail = await graph(`/${page.id}`, {
        fields: "id,name,access_token,picture",
        access_token: accessToken,
      });
      if (detail.access_token) {
        pages.push({ ...page, ...detail });
      } else {
        console.warn(`Facebook Page ${page.id} has no usable access token`);
      }
    } catch (error) {
      console.warn(`Could not load Facebook Page ${page.id}:`, error.message);
    }
  }

  return pages;
};

// Exchange Facebook code for access token
export const getFacebookUser = async (code) => {
  const { FB_APP_ID, FB_APP_SECRET, FB_REDIRECT_URI } = getConfig();

  if (!code || typeof code !== "string" || !code.trim()) {
    throw new Error("Authorization code is missing");
  }

  const token = await graph("/oauth/access_token", {
    client_id: FB_APP_ID,
    client_secret: FB_APP_SECRET,
    redirect_uri: FB_REDIRECT_URI,
    code,
  });

  if (!token.access_token) {
    throw new Error("Facebook did not return an access token");
  }

  const extendedToken = await graph("/oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: FB_APP_ID,
    client_secret: FB_APP_SECRET,
    fb_exchange_token: token.access_token,
  });
  if (!extendedToken.access_token) {
    throw new Error("Facebook did not return a long-lived access token");
  }

  const user = await graph("/me", {
    fields: "id,name,email,picture",
    access_token: extendedToken.access_token,
  });

  if (!user.id) {
    throw new Error("Facebook did not return a user id");
  }

  const pages = await getManagedPages(user.id, extendedToken.access_token);

  if (pages.length === 0) {
    console.warn(
      "Facebook returned no managed Pages. Check that the app has pages_show_list and business_management access, that you picked the Page in the login dialog, and that your Meta user has a role on the Page."
    );
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email || null,
    picture: user?.picture?.data?.url || null,
    accessToken: extendedToken.access_token,
    pages,
  };
};

// Point the app's webhook at the current public origin so Meta keeps delivering
// Messenger events after a tunnel restart. Quick tunnels (trycloudflare/ngrok)
// get a new random URL each run, so this is re-applied on every server start.
export const registerMessengerWebhook = async () => {
  const { FB_APP_ID, FB_APP_SECRET } = getConfig();
  const callbackUrl = (process.env.PUBLIC_API_URL || "").replace(/\/$/, "");
  const verifyToken = process.env.VERIFY_TOKEN;

  if (!FB_APP_ID || !FB_APP_SECRET || !callbackUrl || !verifyToken) {
    console.warn(
      "Messenger webhook auto-registration skipped: set FB_APP_ID, FB_APP_SECRET, PUBLIC_API_URL and VERIFY_TOKEN."
    );
    return false;
  }

  const body = new URLSearchParams({
    object: "page",
    callback_url: `${callbackUrl}/webhook`,
    verify_token: verifyToken,
    fields: "messages,messaging_postbacks,message_reactions",
    access_token: `${FB_APP_ID}|${FB_APP_SECRET}`,
  });

  try {
    const response = await fetch(`${GRAPH}/${FB_APP_ID}/subscriptions`, {
      method: "POST",
      body,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.error) {
      console.warn(
        "Could not register Messenger webhook:",
        data?.error?.message || response.status
      );
      return false;
    }

    console.log(`Messenger webhook registered -> ${callbackUrl}/webhook`);
    return true;
  } catch (error) {
    console.warn("Could not register Messenger webhook:", error.message);
    return false;
  }
};

// Subscribe a Page to the app's Messenger webhooks so incoming messages are
// delivered to /webhook. Best-effort: a failure must not block connecting.
export const subscribePageToMessaging = async (pageId, pageAccessToken) => {
  const fields = "messages,messaging_postbacks,message_reactions";

  try {
    const url = new URL(
      `${GRAPH}/${encodeURIComponent(pageId)}/subscribed_apps`
    );
    url.searchParams.set("subscribed_fields", fields);
    url.searchParams.set("access_token", pageAccessToken);

    const response = await fetch(url, { method: "POST" });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.error) {
      console.warn(
        `Could not subscribe Page ${pageId} to Messenger webhooks:`,
        data?.error?.message || response.status
      );
      return false;
    }

    return true;
  } catch (error) {
    console.warn(
      `Could not subscribe Page ${pageId} to Messenger webhooks:`,
      error.message
    );
    return false;
  }
};