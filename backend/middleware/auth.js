// Browsers send `text/html` when they navigate to a URL directly, fetch/XHR do
// not. OAuth entry points are full page navigations, so bouncing them to the
// login page keeps the user off a raw JSON screen.
const prefersLoginPage = (req) =>
  String(req.get("accept") || "").includes("text/html");

// Reject unauthenticated requests
export const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }

  const frontendUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "");

  if (prefersLoginPage(req) && frontendUrl) {
    return res.redirect(`${frontendUrl}/login?error=session_expired`);
  }

  return res.status(401).json({ message: "Please sign in to continue" });
};