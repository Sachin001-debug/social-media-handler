import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  facebookCallback,
  facebookLogin,
  facebookStatus,
} from "../controller/fbController.js";
import { getMissingEnv } from "../services/fbServices.js";

const router = express.Router();

// Validate the Facebook OAuth env config before touching any route
const requireFbConfig = (req, res, next) => {
  const missing = getMissingEnv();

  if (missing.length === 0) {
    return next();
  }

  console.error(`Facebook OAuth env missing: ${missing.join(", ")}`);

  // A browser navigation should land back in the app, not on a JSON error
  if (String(req.get("accept") || "").includes("text/html")) {
    const frontendUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "");

    if (frontendUrl) {
      return res.redirect(`${frontendUrl}/facebook?error=login_failed`);
    }
  }

  return res.status(503).json({
    message: "Facebook login is not configured",
    missing,
  });
};

// Connecting requires a signed-in user, since accounts are stored per user
router.get("/facebook", requireAuth, requireFbConfig, facebookLogin);
router.get("/facebook/callback", requireFbConfig, facebookCallback);

router.get("/facebook/status", requireAuth, facebookStatus);

export default router;