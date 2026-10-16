import multer from "multer";
import {
  getConversationMessages,
  listConversations,
  sendConversationMessage,
} from "../services/fbMessengerService.js";

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      return callback(new Error("Only image files are allowed"));
    }
    callback(null, true);
  },
});

export const uploadMessageFile = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (!error) return next();

    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({ message: error.message });
  });
};

const parseAccountId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

export const listConversationsController = async (req, res) => {
  const accountId = parseAccountId(req.query.accountId);

  if (!accountId) {
    return res.status(400).json({ message: "A valid Facebook Page is required" });
  }

  try {
    const data = await listConversations(req.session.userId, accountId);
    return res.json(data);
  } catch (error) {
    console.error("listConversationsController error:", error.message);
    return res.status(error.status || 500).json({
      message: error.status ? error.message : "Could not load Messenger conversations",
    });
  }
};

export const listMessagesController = async (req, res) => {
  const accountId = parseAccountId(req.query.accountId);
  const { conversationId } = req.params;

  if (!accountId) {
    return res.status(400).json({ message: "A valid Facebook Page is required" });
  }

  try {
    const data = await getConversationMessages(
      req.session.userId,
      accountId,
      conversationId
    );
    return res.json(data);
  } catch (error) {
    console.error("listMessagesController error:", error.message);
    return res.status(error.status || 500).json({
      message: error.status ? error.message : "Could not load messages",
    });
  }
};

export const sendMessageController = async (req, res) => {
  const accountId = parseAccountId(req.body.accountId);
  const { conversationId } = req.params;
  const recipientId = req.body.recipientId;

  if (!accountId) {
    return res.status(400).json({ message: "A valid Facebook Page is required" });
  }

  // Convert multer's in-memory buffer into a Blob that the service
  // can pass into FormData for Facebook's message_attachments endpoint.
  let fileBlob = null;
  if (req.file) {
    fileBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
    fileBlob.name = req.file.originalname;
  }

  try {
    const data = await sendConversationMessage(
      req.session.userId,
      accountId,
      recipientId,
      req.body.message,
      fileBlob
    );
    return res
      .status(201)
      .json({ message: "Message sent", sent: data, conversationId });
  } catch (error) {
    console.error("sendMessageController error:", error.message);
    return res.status(error.status || 500).json({
      message: error.status ? error.message : "Could not send message",
    });
  }
};