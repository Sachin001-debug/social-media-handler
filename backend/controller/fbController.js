import {
  getFacebookLoginUrl,
  getFacebookUser,
  getConfig,
} from "../services/fbServices.js";
import {
  findFbAccountByFbUserId,
  listFbAccounts,
  upsertFbAccount,
} from "../services/fbAccountService.js";

const redirectToFrontend = (path, query = {}) => {
  const { FRONTEND_URL } = getConfig();
  const search = new URLSearchParams(query).toString();

  return `${FRONTEND_URL}/${path}${search ? `?${search}` : ""}`;
};

// Login
export const facebookLogin = (req, res) => {
  try {
    // Facebook sends the authorization response back to the redirect URI
    // registered in the Meta dashboard. If that URI is this route instead of
    // /facebook/callback, the handshake has to be finished here, otherwise we
    // would bounce straight back to the dialog and loop forever.
    if (req.query.code || req.query.error) {
      return facebookCallback(req, res);
    }

    const { url, state } = getFacebookLoginUrl();

    // Save state in session for CSRF validation on callback
    req.session.oauthState = state;

    res.redirect(url);
  } catch (error) {
    console.error("Facebook login error:", error.message);

    res.status(500).json({
      message: "Facebook login failed",
    });
  }
};

// Callback
export const facebookCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // User denied Facebook login
    if (error) {
      return res.redirect(redirectToFrontend("facebook", { error: "denied" }));
    }

    // Check OAuth state (CSRF)
    if (!state || !req.session.oauthState || state !== req.session.oauthState) {
      return res.redirect(redirectToFrontend("facebook", { error: "invalid_state" }));
    }

    delete req.session.oauthState;

    if (!code) {
      return res.redirect(redirectToFrontend("facebook", { error: "missing_code" }));
    }

    // Session can expire between the redirect and the callback
    if (!req.session.userId) {
      return res.redirect(redirectToFrontend("login", { error: "session_expired" }));
    }

    // Get Facebook user
    const user = await getFacebookUser(code);

    // A Facebook account may only be linked to one Socially user
    const existing = await findFbAccountByFbUserId(user.id);

    if (existing && existing.user_id !== req.session.userId) {
      return res.redirect(
        redirectToFrontend("facebook", { error: "account_in_use" })
      );
    }

    await upsertFbAccount({
      userId: req.session.userId,
      fbUserId: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      accessToken: user.accessToken,
    });

    res.redirect(
      redirectToFrontend("facebook", {
        connected: "true",
        fbId: String(user.id),
        name: user.name || "",
      })
    );
  } catch (error) {
    console.error("Facebook callback error:", error.message);

    res.redirect(redirectToFrontend("facebook", { error: "login_failed" }));
  }
};

// Connection status, read by the frontend after redirect
export const facebookStatus = async (req, res) => {
  try {
    const fbAccounts = await listFbAccounts(req.session.userId);

    res.status(200).json({
      connected: fbAccounts.length > 0,
      count: fbAccounts.length,
      fbAccounts,
    });
  } catch (error) {
    console.error("Facebook status error:", error.message);
    res.status(500).json({ message: "Could not load Facebook accounts" });
  }
};