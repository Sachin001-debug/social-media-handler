import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  disconnectFbAccount,
  getFbAccounts,
  login,
  logout,
  me,
  register,
} from "../controller/authController.js";

const router = express.Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth/me", me);
router.post("/auth/logout", logout);

router.get("/facebook/accounts", requireAuth, getFbAccounts);
router.delete("/facebook/accounts/:id", requireAuth, disconnectFbAccount);

export default router;