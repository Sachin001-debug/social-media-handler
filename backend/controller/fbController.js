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

    if (user.pages.length === 0) {
      return res.redirect(redirectToFrontend("facebook", { error: "no_pages" }));
    }

    for (const page of user.pages) {
      if (!page.id || !page.access_token) {
        throw new Error("Facebook returned a Page without an id or access token");
      }

      const existing = await findFbAccountByFbUserId(page.id);
      if (existing && Number(existing.userId) !== Number(req.session.userId)) {
        return res.redirect(
          redirectToFrontend("facebook", { error: "account_in_use" })
        );
      }

      await upsertFbAccount({
        userId: req.session.userId,
        fbUserId: page.id,
        name: page.name,
        picture: page.picture?.data?.url || null,
        accessToken: page.access_token,
      });
    }

    res.redirect(
      redirectToFrontend("facebook", {
        connected: "true",
        fbId: String(user.pages[0].id),
        name: user.pages[0].name || "",
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
    res.status(500).json({ message: "Could not load Facebook Pages" });
  }
};