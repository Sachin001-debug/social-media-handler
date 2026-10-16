# Messenger

Facebook Page Messenger inbox, manual replies, and automatic AI replies.

## Files

| File | What it does |
| --- | --- |
| `frontend/src/pages/Messenger.jsx` | UI: Page picker, conversation list, thread, reply box. |
| `frontend/src/api/client.js` | `messengerApi` fetch calls to the backend. |
| `backend/routes/fbMessengerRoutes.js` | Routes for inbox / thread / send (needs login). |
| `backend/controller/fbMessengerController.js` | Reads request params, calls the service, sends JSON/errors. |
| `backend/services/fbMessengerService.js` | Talks to the Facebook Graph API (conversations, messages, send). |
| `backend/services/fbAccountService.js` | Loads the stored Page + access token for a user. |
| `backend/controller/OrderController.js` | Validates authenticated order API requests and calls the order service. |
| `backend/services/OrderServices.js` | Validates products and saves orders using the shared database model. |
| `backend/models/Orders.js` | Sequelize order model registered with the app database. |
| `backend/routes/webhookRoutes.js` | Receives inbound messages from Meta, triggers the AI. |
| `backend/ai/ai.js` | Ollama call + system prompt; builds the AI reply. |
| `backend/ai/bot.js` | `sendAsPage` — posts the AI reply via the Send API. |

## Routes

| Method | Path | Auth | Controller |
| --- | --- | --- | --- |
| GET | `/api/messenger/conversations?accountId=` | session | `listConversationsController` |
| GET | `/api/messenger/conversations/:conversationId/messages?accountId=` | session | `listMessagesController` |
| POST | `/api/messenger/conversations/:conversationId/messages` | session | `sendMessageController` |
| POST | `/api/orders` | session | `saveOrderController` |
| GET | `/webhook` | none | Meta verify (`hub.mode` + `VERIFY_TOKEN`) |
| POST | `/webhook` | none | Inbound messages → auto AI reply |

## Functions

### Inbox (conversations)
- `messengerApi.conversations` (`client.js`) → `GET /api/messenger/conversations`
- `listConversationsController` (`fbMessengerController.js`) → `listConversations`
- `loadPageAccount` (`fbMessengerService.js`) → finds `FbAccount` by `id + userId + isPage:true`, requires `accessToken`
- Graph `GET /{pageId}/conversations?platform=messenger&fields=…`; picks the non-Page participant as `participant`

### Read thread
- `messengerApi.messages` (`client.js`) → `GET /api/messenger/conversations/:id/messages`
- `listMessagesController` → `getConversationMessages` (`fbMessengerService.js`)
- Graph `GET /{conversationId}/messages?fields=id,created_time,from,message,attachments`; `reverse()` to oldest→newest

### Send (manual reply)
- `Messenger.jsx` `handleSend` → `messengerApi.sendMessage` → `POST /api/messenger/conversations/:id/messages`
- Text-only replies use JSON; replies with an image use multipart form data parsed by `uploadMessageFile`.
- `sendMessageController` → `sendConversationMessage` (`fbMessengerService.js`); images are uploaded to Facebook to get an `attachment_id`.
- Graph Send API `POST /{pageId}/messages` with `recipient.id`, `messaging_type: RESPONSE`, message text and/or image attachment, and Page token

### Auto AI reply (inbound)
- Meta → `POST /webhook` (`webhookRoutes.js`); responds `200` first, then processes
- Filters echoes/non-text; `alreadySeen(mid)` (`ai.js`) dedupes Meta retries
- `findFbAccountByFbUserId(entry.id)` → stored Page token
- `getReply(senderId, text)` (`ai.js`) → Ollama `/api/chat` with `SYSTEM` prompt, 6-message memory per user
- A valid submitted order form is validated and persisted with its quantity, calculated total, and unique generated order number before the bot confirms it and shares the order number with the customer. Quantity defaults to one.
- On valid order submissions, the Page token is used to load the sender's Messenger display name and profile picture; these are saved as `fb_username` and `fb_image` (the sender ID is used as the name fallback).
- Orders save the form's `Name` as `client_name` and the receiving Page's internal `fb_account_id`; the authenticated orders endpoint and Orders page filter by the selected Page and current user.
- `sendAsPage(pageId, pageToken, senderId, reply)` (`bot.js`) → Graph `POST /{pageId}/messages`

## Notes
- Sending needs the Page access token saved at connect time (`fb_accounts.access_token`).
- The Page must be subscribed to `messages` (`subscribePageToMessaging` in `fbServices.js`).
- On server start, `registerMessengerWebhook` (`fbServices.js`) re-points Meta's callback URL to `PUBLIC_API_URL`, so tunnel URL changes don't break inbound messages.
- "Bad Gateway" (502) comes from cloudflared when the tunnel can't reach the backend, not from this code.
- AI replies are slow on the first (cold) Ollama request (~60s), fast after (~4s).
