import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { publishFbScheduledPostById } from "../services/fbPostService.js";

const router = express.Router();

router.post("/scheduled-posts/:id/publish", requireAuth, async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isSafeInteger(postId) || postId < 1) {
    return res.status(400).json({ message: "Invalid scheduled post ID" });
  }

  try {
    const fbPostId = await publishFbScheduledPostById(postId, req.session.userId);
    return res.json({ message: "Facebook post published", fbPostId });
  } catch (error) {
    console.error("Facebook post route error:", error.message);
    return res.status(error.status || 502).json({
      message: error.message || "Failed to publish Facebook post",
    });
  }
});

export default router;
