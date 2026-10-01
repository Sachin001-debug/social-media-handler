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
    scope: "public_profile",
  });

  return {
    url: url.toString(),
    state,
  };
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

  const user = await graph("/me", {
    fields: "id,name,email,picture",
    access_token: token.access_token,
  });

  if (!user.id) {
    throw new Error("Facebook did not return a user id");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email || null,
    picture: user?.picture?.data?.url || null,
    accessToken: token.access_token,
  };
};