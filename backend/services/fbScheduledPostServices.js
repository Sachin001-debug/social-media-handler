

import db from "../models/index.js";

export const saveFbScheduledPost = async ({
  userId,
  fbAccountId,
  message = "",
  link = null,
  mediaType = "none",
  file = null,
  mode = "schedule",
  scheduledAt = null,
}) => {
  const account = await db.FbAccount.findOne({
    where: { id: fbAccountId, userId },
  });
  if (!account) {
    const error = new Error("Facebook account not found");
    error.status = 404;
    throw error;
  }

  if (typeof message !== "string" || (!message.trim() && !file)) {
    const error = new Error("Write something or add media");
    error.status = 400;
    throw error;
  }

  if (!["now", "schedule"].includes(mode)) {
    const error = new Error("Invalid post mode");
    error.status = 400;
    throw error;
  }

  if (!["none", "image", "video", "audio"].includes(mediaType)) {
    const error = new Error("Invalid media type");
    error.status = 400;
    throw error;
  }

  if (file && (!file.mimetype.startsWith(`${mediaType}/`) || mediaType === "none")) {
    const error = new Error("Uploaded file does not match the selected media type");
    error.status = 400;
    throw error;
  }

  let when = null;
  if (mode === "schedule") {
    when = new Date(scheduledAt);
    if (!scheduledAt || Number.isNaN(when.getTime())) {
      const error = new Error("Invalid schedule date");
      error.status = 400;
      throw error;
    }
    const diff = when.getTime() - Date.now();
    if (diff < 10 * 60 * 1000 || diff > 30 * 86400 * 1000) {
      const error = new Error("Schedule must be between 10 minutes and 30 days from now");
      error.status = 400;
      throw error;
    }
  }

  if (link && link.length > 2048) {
    const error = new Error("Link must be 2048 characters or fewer");
    error.status = 400;
    throw error;
  }

  return db.FbScheduledPost.create({
    userId,
    fbAccountId,
    message: message.trim(),
    link: link || null,
    mediaType,
    mediaPath: file ? file.path : null,
    mediaOriginalName: file ? file.originalname : null,
    mediaMimeType: file ? file.mimetype : null,
    mediaSize: file ? file.size : null,
    mode,
    scheduledAt: when,
    status: "pending",
  });
};


export const getFbScheduledPosts = async (userId) =>
  db.FbScheduledPost.findAll({
    where: { userId },
    attributes: [
      "id",
      "fbAccountId",
      "message",
      "link",
      "mediaType",
      "mediaOriginalName",
      "mode",
      "scheduledAt",
      "status",
      "fbPostId",
      "errorMessage",
      "publishedAt",
      "createdAt",
    ],
    include: [
      {
        model: db.FbAccount,
        as: "fbAccount",
        attributes: ["id", "name", "fbUserId"],
        required: false,
      },
    ],
    order: [
      ["scheduledAt", "ASC"],
      ["createdAt", "DESC"],
    ],
  });