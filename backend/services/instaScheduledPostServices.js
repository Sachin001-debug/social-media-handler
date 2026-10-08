import db from "../models/index.js";

// Instagram caption hard limit
const MAX_CAPTION = 2200;

const saveInstaPostService = async ({
  userId,
  instagramAccountId,
  caption = "",
  message = null,
  link = null,
  mediaType = "none",
  file = null,
  mode = "schedule",
  scheduledAt = null,
}) => {
  const account = await db.InstagramAccount.findOne({
    where: { id: instagramAccountId, userId },
  });

  if (!account) {
    const error = new Error("Instagram account not found");
    error.status = 404;
    throw error;
  }

  // Frontends may send either `caption` (Instagram term) or `message`
  const text =
    typeof caption === "string" && caption.trim()
      ? caption
      : typeof message === "string"
        ? message
        : "";

  // message validation
  if (!text.trim() && !file) {
    const error = new Error("Write a caption or add media");
    error.status = 400;
    throw error;
  }

  if (text.length > MAX_CAPTION) {
    const error = new Error(`Caption must be ${MAX_CAPTION} characters or fewer`);
    error.status = 400;
    throw error;
  }

  // schedule part
  if (!["now", "schedule"].includes(mode)) {
    const error = new Error("Invalid post mode");
    error.status = 400;
    throw error;
  }

  if (!["none", "image", "video"].includes(mediaType)) {
    const error = new Error("Invalid media type");
    error.status = 400;
    throw error;
  }

  // file validation
  if (file && (!file.mimetype.startsWith(`${mediaType}/`) || mediaType === "none")) {
    const error = new Error("Uploaded file does not match the selected media type");
    error.status = 400;
    throw error;
  }

  // for schedule: save the schedule date
  let when = null;

  if (mode === "schedule") {
    when = new Date(scheduledAt);
    if (!scheduledAt || Number.isNaN(when.getTime())) {
      const error = new Error("Invalid schedule date");
      error.status = 400;
      throw error;
    }
    // the schedule date must be between 10 min from now and 30 days
    const diff = when.getTime() - Date.now();
    if (diff < 10 * 60 * 1000 || diff > 30 * 86400 * 1000) {
      const error = new Error("Schedule must be between 10 minutes and 30 days from now");
      error.status = 400;
      throw error;
    }
  }

  // link validation
  if (link && link.length > 2048) {
    const error = new Error("Link must be 2048 characters or fewer");
    error.status = 400;
    throw error;
  }

  return db.InstagramScheduledPost.create({
    userId,
    instagramAccountId,
    caption: text.trim(),
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

const getInstaScheduledPosts = async (userId) =>
  db.InstagramScheduledPost.findAll({
    where: { userId },
    attributes: [
      "id",
      "instagramAccountId",
      "caption",
      "link",
      "mediaType",
      "mediaOriginalName",
      "mode",
      "scheduledAt",
      "status",
      "instaPostId",
      "errorMessage",
      "publishedAt",
      "createdAt",
    ],
    include: [
      {
        model: db.InstagramAccount,
        as: "instagramAccount",
        attributes: ["id", "username", "igUserId"],
        required: false,
      },
    ],
    order: [
      ["scheduledAt", "ASC"],
      ["createdAt", "DESC"],
    ],
  });

export { saveInstaPostService, getInstaScheduledPosts };
