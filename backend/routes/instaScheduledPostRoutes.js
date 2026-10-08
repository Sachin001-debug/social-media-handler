import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth } from "../middleware/auth.js";
import {
  listInstaScheduledPostsController,
  saveInstaPostController,
} from "../controller/instaScheduledPostController.js";
import { publishInstaPostById } from "../services/instaPostService.js";

const router = express.Router();

const uploadDir = path.resolve("uploads", "instagram");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^(image|video)\//.test(file.mimetype);
    if (!ok) {
      return cb(new Error("Only image or video files are allowed"));
    }
    cb(null, true);
  },
});

const uploadPostFile = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (!error) return next();

    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({ message: error.message });
  });
};

router.get("/scheduled-posts", requireAuth, listInstaScheduledPostsController);

router.post(
  "/scheduled-posts",
  requireAuth,
  uploadPostFile,
  saveInstaPostController
);

router.post("/scheduled-posts/:id/publish", requireAuth, async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isSafeInteger(postId) || postId < 1) {
    return res.status(400).json({ message: "Invalid post ID" });
  }

  try {
    const instaPostId = await publishInstaPostById(postId, req.session.userId);
    return res.json({ message: "Instagram post published", instaPostId });
  } catch (error) {
    console.error("Instagram post publish error:", error.message);
    return res.status(error.status || 502).json({
      message: error.message || "Failed to publish Instagram post",
    });
  }
});

export default router;
