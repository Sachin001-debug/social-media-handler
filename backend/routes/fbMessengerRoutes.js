import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listConversationsController,
  listMessagesController,
  sendMessageController,
  uploadMessageFile,
} from "../controller/fbMessengerController.js";

const router = express.Router();

router.get("/conversations", requireAuth, listConversationsController);

router.get(
  "/conversations/:conversationId/messages",
  requireAuth,
  listMessagesController
);

router.post(
  "/conversations/:conversationId/messages",
  requireAuth,
  uploadMessageFile,
  sendMessageController
);

export default router;
