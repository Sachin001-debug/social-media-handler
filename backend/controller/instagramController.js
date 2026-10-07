import {
  getInstagramLoginUrl,
  getInstagramAccounts,
  getMissingInstaEnv,
} from "../services/instaServices.js";
import { getConfig } from "../services/fbServices.js";
import {
  deleteInstaAccount,
  listInstaAccounts,
  upsertInstaAccount,
} from "../services/instaAccountService.js";

const redirectToFrontend = (query) => {
  const { FRONTEND_URL } = getConfig();
  return `${FRONTEND_URL}/instagram?${query}`;
};

// GET /api/instagram
export const login = (req, res) => {
  try {
    const missing = getMissingInstaEnv();
    if (missing.length) {
      console.error("Missing Instagram env vars:", missing.join(", "));
      return res.redirect(redirectToFrontend("error=login_failed"));
    }

    const { url, state } = getInstagramLoginUrl();

    // Save state in session for CSRF validation on callback
    req.session.igOauthState = state;

    res.redirect(url);
  } catch (error) {
    console.error("Instagram login error:", error.message);
    res.redirect(redirectToFrontend("error=login_failed"));
  }
};

// GET /api/instagram/callback
export const callback = async (req, res) => {
  const { code, state, error } = req.query;

  console.log(
    `[IG callback] err=${error || "-"} hasCode=${Boolean(code)} ` +
      `stateMatch=${Boolean(state && req.session.igOauthState === state)} ` +
      `sessionUser=${req.session.userId || "-"}`,
  );

  if (error) return res.redirect(redirectToFrontend("error=denied"));

  if (!state || !req.session.igOauthState || state !== req.session.igOauthState) {
    return res.redirect(redirectToFrontend("error=invalid_state"));
  }

  delete req.session.igOauthState;

  if (!code) return res.redirect(redirectToFrontend("error=missing_code"));

  // Session can expire between the redirect and the callback
  if (!req.session.userId) {
    return res.redirect(redirectToFrontend("error=session_expired"));
  }

  try {
    const { accounts, hasConnectedPersonalAccount, pages } =
      await getInstagramAccounts(code, req.session.userId);

    console.log(
      `[IG callback] pages=${pages} linkedIg=${accounts.length} ` +
        `user=${req.session.userId} userIgIds=${accounts.map((a) => a.igUserId).join(",")}`,
    );

    if (accounts.length === 0) {
      const reason = hasConnectedPersonalAccount
        ? "professional_required"
        : "no_instagram";
      return res.redirect(redirectToFrontend(`error=${reason}`));
    }

    for (const account of accounts) {
      await upsertInstaAccount({
        userId: req.session.userId,
        ...account,
      });
    }

    return res.redirect(
      redirectToFrontend(`connected=true&igId=${accounts[0].igUserId}`),
    );
  } catch (err) {
    console.error("Instagram callback failed:", err.message);
    if (err.status === 409) {
      return res.redirect(redirectToFrontend("error=account_in_use"));
    }
    // Pass the upstream reason through so the UI can show what actually broke
    const reason = encodeURIComponent(String(err.message).slice(0, 300));
    return res.redirect(redirectToFrontend(`error=login_failed&reason=${reason}`));
  }
};

// GET /api/instagram/accounts
export const list = async (req, res) => {
  try {
    const accounts = await listInstaAccounts(req.session.userId);
    res.json({ accounts });
  } catch (err) {
    console.error("Instagram accounts error:", err.message);
    res.status(500).json({ message: "Could not load Instagram accounts." });
  }
};

// DELETE /api/instagram/accounts/:id
export const disconnect = async (req, res) => {
  try {
    const removed = await deleteInstaAccount(req.session.userId, req.params.id);

    if (!removed) return res.status(404).json({ message: "Account not found." });
    res.json({ success: true });
  } catch (err) {
    console.error("Instagram disconnect error:", err.message);
    res.status(500).json({ message: "Could not disconnect account." });
  }
};
