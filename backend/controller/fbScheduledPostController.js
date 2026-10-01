import {
  getFbScheduledPosts,
  saveFbScheduledPost,
} from "../services/fbScheduledPostServices.js";
import fs from "fs/promises";

export const listFbScheduledPostsController = async (req, res) => {
  try {
    const posts = await getFbScheduledPosts(req.session.userId);
    return res.json({ posts });
  } catch (error) {
    console.error("listFbScheduledPostsController error:", error);
    return res.status(500).json({ message: "Failed to load saved posts" });
  }
};

export const saveFbScheduledPostController = async (req, res) => {
  try {
    const { pageId, message, link, mediaType, mode, scheduledAt } = req.body;

    const post = await saveFbScheduledPost({
      userId: req.session.userId,
      fbAccountId: Number(pageId),
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
          console.error("Could not remove rejected Facebook post upload:", cleanupError);
        }
      }
    }

    console.error("saveFbScheduledPostController error:", err);
    return res.status(err.status || 500).json({
      message: err.message || "Failed to save post",
    });
  }
};