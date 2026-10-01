import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth } from "../middleware/auth.js";
import {
  listFbScheduledPostsController,
  saveFbScheduledPostController,
} from "../controller/fbScheduledPostController.js";

const router = express.Router();

const uploadDir = path.resolve("uploads", "fb");
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
    const ok = /^(image|video|audio)\//.test(file.mimetype);
    if (!ok) {
      return cb(new Error("Only image, video or audio files are allowed"));
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

router.get("/scheduled-posts", requireAuth, listFbScheduledPostsController);

router.post(
  "/scheduled-posts",
  requireAuth,
  uploadPostFile,
  saveFbScheduledPostController
);

export default router;