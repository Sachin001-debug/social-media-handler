import express from "express";
import { getReply, alreadySeen } from "../ai/ai.js";
import { sendAsPage, sendImageAsPage } from "../ai/bot.js";
import { findFbAccountByFbUserId } from "../services/fbAccountService.js";
import { getMessengerUserProfile } from "../services/fbServices.js";

const router = express.Router();

// Meta verifies  webhook URL here
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

const handleIncomingMessage = async ({ senderId, pageId, text, mid }) => {
  console.log(`Webhook: message from ${senderId} to Page ${pageId}: ${JSON.stringify(text)}`);

  // Ignore Meta's retries of the same message
  if (alreadySeen(mid)) {
    console.log(`Webhook: duplicate message ${mid}, skipping`);
    return;
  }

  // The recipient Page ID maps to the Page token stored at connect time
  const account = await findFbAccountByFbUserId(pageId);
  if (!account?.accessToken) {
    console.warn(`Webhook: no connected Page found for recipient ${pageId}`);
    return;
  }

  const reply = await getReply(senderId, text, {
    fbAccountId: account.id,
    loadFacebookProfile: () =>
      getMessengerUserProfile(senderId, account.accessToken),
  });
  const message = typeof reply === "string" ? { text: reply } : reply || {};
  const { text: replyText, imageUrl } = message;
  console.log(`Webhook: AI reply -> ${JSON.stringify(message)}`);

  if (replyText) {
    await sendAsPage(account.fbUserId, account.accessToken, senderId, replyText);
  }
  if (imageUrl) {
    await sendImageAsPage(account.fbUserId, account.accessToken, senderId, imageUrl);
  }
};

// Incoming messages auto-reply using the local Ollama assistant
router.post("/", (req, res) => {
  res.sendStatus(200);

  const entries = Array.isArray(req.body?.entry) ? req.body.entry : [];

  for (const entry of entries) {
    const pageId = entry?.id;
    const events = Array.isArray(entry?.messaging) ? entry.messaging : [];

    for (const event of events) {
      const message = event?.message;

  
      if (!message || message.is_echo || !message.text) continue;

      const senderId = event?.sender?.id;
      if (!senderId) continue;

      handleIncomingMessage({
        senderId,
        pageId,
        text: message.text,
        mid: message.mid,
      }).catch((error) =>
        console.error("Messenger auto-reply failed:", error.message)
      );
    }
  }
});

export default router;
