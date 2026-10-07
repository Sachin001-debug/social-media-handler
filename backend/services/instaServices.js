import crypto from "crypto";
import db from "../models/index.js";

const GRAPH = "https://graph.facebook.com/v21.0";
const DIALOG = "https://www.facebook.com/v21.0/dialog/oauth";

export const getMissingInstaEnv = () =>
  ["FB_APP_ID", "FB_APP_SECRET", "IG_REDIRECT_URI", "FRONTEND_URL"].filter(
    (key) => !process.env[key],
  );

const getConfig = () => ({
  FB_APP_ID: process.env.FB_APP_ID,
  FB_APP_SECRET: process.env.FB_APP_SECRET,
  IG_REDIRECT_URI: process.env.IG_REDIRECT_URI,
  IG_LOGIN_CONFIG_ID: process.env.IG_LOGIN_CONFIG_ID,
});

const graph = async (path, params) => {
  const url = new URL(`${GRAPH}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url);
  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(`Instagram returned an invalid response (${response.status})`);
  }

  if (!response.ok || data.error) {
    const e = data.error || {};
    throw new Error(
      `Instagram API ${path} failed: [${e.code ?? response.status}/${
        e.error_subcode ?? "-"}] ${e.message || "unknown error"} (trace ${
        e.fbtrace_id || "n/a"})`,
    );
  }

  return data;
};

export const getInstagramLoginUrl = () => {
  const { FB_APP_ID, IG_REDIRECT_URI, IG_LOGIN_CONFIG_ID } = getConfig();
  const url = new URL(DIALOG);

  const params = new URLSearchParams({
    client_id: FB_APP_ID,
    redirect_uri: IG_REDIRECT_URI,
    state: crypto.randomBytes(32).toString("hex"),
  });
  if (IG_LOGIN_CONFIG_ID) {
    params.set("config_id", IG_LOGIN_CONFIG_ID);
    params.set("response_type", "code");
    params.set("override_default_response_type", "true");
  } else {
    params.set("response_type", "code");
    params.set(
      "scope",
      "public_profile,pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish",
    );
  }
  url.search = params;

  return { url: url.toString(), state: url.searchParams.get("state") };
};

// Explain *why* a token cannot see any Pages: which user it belongs to,
// which permissions it actually carries, and whether they are granular
// (targeted at specific Page/IG ids) — the usual cause of an empty
// /me/accounts response.
const logTokenDiagnostics = async (accessToken) => {
  try {
    const appToken = `${process.env.FB_APP_ID}|${process.env.FB_APP_SECRET}`;
    const debug = await fetch(
      `${GRAPH}/debug_token?input_token=${encodeURIComponent(
        accessToken,
      )}&access_token=${encodeURIComponent(appToken)}`,
    ).then((r) => r.json());

    const me = await fetch(
      `${GRAPH}/me?fields=id,name&access_token=${encodeURIComponent(accessToken)}`,
    ).then((r) => r.json());

    const d = debug.data || {};
    console.log("[IG] authorized user:", me.id || me.error?.message, me.name || "");
    console.log("[IG] token valid:", d.is_valid, "type:", d.type || "-", "app:", d.application || "-");
    console.log("[IG] scopes:", (d.scopes || []).join(",") || "(none)");
    console.log(
      "[IG] granular:",
      JSON.stringify(
        (d.granular_scopes || []).map((g) => ({
          scope: g.scope,
          targets: g.target_ids,
        })),
      ),
    );
  } catch (error) {
    console.log("[IG] diagnostics failed:", error.message);
  }
};

export const getInstagramAccounts = async (code, userId) => {
  if (!code || typeof code !== "string" || !code.trim()) {
    throw new Error("Authorization code is missing");
  }

  const { FB_APP_ID, FB_APP_SECRET, IG_REDIRECT_URI } = getConfig();
  const token = await graph("/oauth/access_token", {
    client_id: FB_APP_ID,
    client_secret: FB_APP_SECRET,
    redirect_uri: IG_REDIRECT_URI,
    code,
  });

  if (!token.access_token) {
    throw new Error("Instagram did not return an access token");
  }

  const extendedToken = await graph("/oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: FB_APP_ID,
    client_secret: FB_APP_SECRET,
    fb_exchange_token: token.access_token,
  });

  if (!extendedToken.access_token) {
    throw new Error("Instagram did not return a long-lived access token");
  }

  await logTokenDiagnostics(extendedToken.access_token);

  // `connected_instagram_account` is only used to explain why a personal
  // account could not be connected. If Meta rejects it for this token the
  // whole field list fails, so retry without it rather than losing the flow.
  const fields =
    "id,name,access_token,instagram_business_account{id,username,profile_picture_url},connected_instagram_account{id,username,profile_picture_url}";
  const minimalFields =
    "id,name,access_token,instagram_business_account{id,username,profile_picture_url}";

  let pageData;
  try {
    pageData = await graph("/me/accounts", {
      fields,
      limit: "100",
      access_token: extendedToken.access_token,
    });
  } catch (primaryError) {
    console.log("[IG] full field query failed, retrying minimal:", primaryError.message);
    pageData = await graph("/me/accounts", {
      fields: minimalFields,
      limit: "100",
      access_token: extendedToken.access_token,
    });
  }

  const pages = Array.isArray(pageData.data) ? pageData.data : [];
  console.log(
    `[IG] /me/accounts pages=${pages.length} withIg=${pages.filter(
      (p) => p.instagram_business_account?.id,
    ).length}`,
  );

  // The freshly-issued token can come back with no Pages (granular /
  // Facebook Login for Business scopes are granted per-target). The user has
  // already connected Facebook, so those stored Page tokens are a valid
  // second source for the same Page, Instagram link.
  let resolvedPages = pages;
  if (resolvedPages.length === 0 && userId) {
    resolvedPages = await pagesFromStoredFbTokens(userId);
    console.log(`[IG] fallback from stored FB page tokens: ${resolvedPages.length}`);
  }

  const accounts = resolvedPages.flatMap((page) => {
    const account = page.instagram_business_account;
    if (!account?.id || !page.access_token) return [];

    return [{
      igUserId: account.id,
      username: account.username || null,
      profilePictureUrl: account.profile_picture_url || null,
      pageId: page.id,
      pageName: page.name || null,
      pageAccessToken: page.access_token,
    }];
  });

  return {
    accounts,
    pages: resolvedPages.length,
    hasConnectedPersonalAccount: resolvedPages.some(
      (page) =>
        !page.instagram_business_account?.id &&
        page.connected_instagram_account?.id,
    ),
  };
};

// Read the Instagram professional account linked to each Facebook Page this
// user already connected. Uses the stored Page tokens, which carry
// instagram_basic for the linked Instagram account.
export const pagesFromStoredFbTokens = async (userId) => {
  const rows = await db.FbAccount.findAll({
    where: { userId, isPage: true },
    attributes: ["fbUserId", "name", "accessToken"],
  });

  const pages = [];
  for (const row of rows) {
    if (!row.accessToken) continue;

    try {
      const page = await graph(`/${row.fbUserId}`, {
        fields:
          "id,name,instagram_business_account{id,username,profile_picture_url},connected_instagram_account{id,username,profile_picture_url}",
        access_token: row.accessToken,
      });

      pages.push({
        id: page.id,
        name: page.name || row.name,
        access_token: row.accessToken,
        instagram_business_account: page.instagram_business_account,
        connected_instagram_account: page.connected_instagram_account,
      });
    } catch (error) {
      console.log(`[IG] stored token failed for page ${row.fbUserId}:`, error.message);
    }
  }

  return pages;
};
