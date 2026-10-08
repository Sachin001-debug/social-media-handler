import fs from "fs/promises";
import {
  getInstaScheduledPosts,
  saveInstaPostService,
} from "../services/instaScheduledPostServices.js";

export const listInstaScheduledPostsController = async (req, res) => {
  try {
    const posts = await getInstaScheduledPosts(req.session.userId);
    return res.json({ posts });
  } catch (error) {
    console.error("listInstaScheduledPostsController error:", error);
    return res.status(500).json({ message: "Failed to load saved posts" });
  }
};

export const saveInstaPostController = async (req, res) => {
  try {
    const { instagramAccountId, caption, message, link, mediaType, mode, scheduledAt } =
      req.body;

    const post = await saveInstaPostService({
      userId: req.session.userId,
      instagramAccountId: Number(instagramAccountId),
      caption,
      message,
      link,
      mediaType,
      file: req.file,
      mode,
      scheduledAt,
    });

    return res.status(201).json({
      message: mode === "schedule" ? "Post scheduled" : "Post saved",
      post,
    });
  } catch (err) {
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        if (cleanupError.code !== "ENOENT") {
          console.error("Could not remove rejected Instagram post upload:", cleanupError);
        }
      }
    }

    console.error("saveInstaPostController error:", err);
    return res.status(err.status || 500).json({
      message: err.message || "Failed to save post",
    });
  }
};
