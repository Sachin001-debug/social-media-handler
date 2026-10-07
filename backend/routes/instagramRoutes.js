import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  login as instagramLogin,
  callback as instagramCallback,
  list as instagramAccounts,
  disconnect as instagramDisconnect,
} from "../controller/instagramController.js";
import { getMissingInstaEnv } from "../services/instaServices.js";

const instaRoutes = express.Router();

// Validate the Instagram OAuth env config before touching any route
const requireIgConfig = (req, res, next) => {
  const missing = getMissingInstaEnv();

  if (missing.length === 0) {
    return next();
  }

  console.error(`Instagram OAuth env missing: ${missing.join(", ")}`);

  // A browser navigation should land back in the app, not on a JSON error
  if (String(req.get("accept") || "").includes("text/html")) {
    const frontendUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "");

    if (frontendUrl) {
      return res.redirect(`${frontendUrl}/instagram?error=login_failed`);
    }
  }

  return res.status(503).json({
    message: "Instagram login is not configured",
    missing,
  });
};

// Connecting requires a signed-in user, since accounts are stored per user
instaRoutes.get("/instagram", requireAuth, requireIgConfig, instagramLogin);

// No requireAuth here, same as Facebook: the user comes back from Meta
instaRoutes.get("/instagram/callback", requireIgConfig, instagramCallback);

instaRoutes.get("/instagram/accounts", requireAuth, instagramAccounts);
instaRoutes.delete("/instagram/accounts/:id", requireAuth, instagramDisconnect);

export default instaRoutes;