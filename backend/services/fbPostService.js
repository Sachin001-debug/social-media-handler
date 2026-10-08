import fs from "fs/promises";
import db from "../models/index.js";

const GRAPH_URL = "https://graph.facebook.com/v21.0";
const BATCH_SIZE = 20;
let schedulerTimer;
let schedulerRunning = false;

const graphPost = async (pageId, endpoint, accessToken, fields, file) => {
  const url = `${GRAPH_URL}/${encodeURIComponent(pageId)}/${endpoint}`;
  //https://graph.facebook.com/v21.0/123456789/feed example 
  let body;

  //if file exists
 if (file) {
  // Read the file
  const fileData = await fs.readFile(file.path);

  //  Create a form to send file + other data
  const formData = new FormData();

  // Convert file data into a Blob
  const fileBlob = new Blob([fileData], {
    type: file.mimeType || "application/octet-stream",
  });

  // Add the file
  formData.append("source", fileBlob, file.name);

  //Add Facebook access token
  formData.append("access_token", accessToken);

  // Add other fields like message/title/description
  for (const key in fields) {
    formData.append(key, fields[key]);
  }

  body = formData;
} else {
  // No file, so just send normal form data
  body = new URLSearchParams();

  body.append("access_token", accessToken);

  for (const key in fields) {
    body.append(key, fields[key]);
  }
}

  const response = await fetch(url, { method: "POST", body });
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(`Facebook returned an invalid response (${response.status})`);
    }

  if (!response.ok || data.error) {
    const message = data?.error?.message || `Facebook API request failed (${response.status})`;
    throw new Error(message);
  }

  const postId = data.post_id || data.id;
  if (!postId) {
    throw new Error("Facebook did not return a post ID");
  }
  return String(postId);
};

const publishPost = async (post, account) => {
  if (!account?.isPage || !account.accessToken) {
    throw new Error("The selected Facebook Page is disconnected or unavailable");
  }

  const message = [post.message, post.link].filter(Boolean).join("\n");
  const fields = {};

  if (post.mediaType === "none") {
    if (post.message) fields.message = post.message;
    if (post.link) fields.link = post.link;
    return graphPost(account.fbUserId, "feed", account.accessToken, fields);
  }

  if (!post.mediaPath) {
    throw new Error("The scheduled media file is missing");
  }

  const file = {
    path: post.mediaPath,
    name: post.mediaOriginalName || "upload",
    mimeType: post.mediaMimeType
  };

  if (post.mediaType === "image") {
    if (message) fields.message = message;
    return graphPost(account.fbUserId, "photos", account.accessToken, fields, file);
  }

  if (post.mediaType === "video") {
    if (message) fields.description = message;
    fields.title = post.mediaOriginalName || "Facebook video";
    return graphPost(account.fbUserId, "videos", account.accessToken, fields, file);
  }

  throw new Error(`Facebook Page publishing does not support ${post.mediaType} uploads`);
};

const loadPost = (id) =>
  db.FbScheduledPost.findByPk(id, {
    include: [{ model: db.FbAccount, as: "fbAccount" }],
  });

const markFailed = async (postId, error) => {
  await db.FbScheduledPost.update(
    { status: "failed", errorMessage: error.message || "Facebook publishing failed" },
    { where: { id: postId, status: "processing" } }
  );
};

const publishClaimedPost = async (postId) => {
  const post = await loadPost(postId);
  if (!post) throw new Error("Scheduled post no longer exists");

  const fbPostId = await publishPost(post, post.fbAccount);
  await post.update({
    status: "published",
    fbPostId,
    errorMessage: null,
    publishedAt: new Date(),
  });
  return fbPostId;
};

const claimPost = async (postId) => {
  const [claimed] = await db.FbScheduledPost.update(
    { status: "processing", errorMessage: null },
    { where: { id: postId, status: "pending" } }
  );
  return claimed === 1;
};

export const publishFbScheduledPostById = async (postId, userId) => {
  const post = await db.FbScheduledPost.findOne({
    where: { id: postId, userId },
  });
  if (!post) {
    const error = new Error("Scheduled post not found");
    error.status = 404;
    throw error;
  }

  const isDue = post.mode === "now" ||
    (post.scheduledAt && new Date(post.scheduledAt).getTime() <= Date.now());
  if (!isDue) {
    const error = new Error("This post is not due yet");
    error.status = 409;
    throw error;
  }

  if (!(await claimPost(post.id))) {
    const error = new Error("This post is already being processed or has already finished");
    error.status = 409;
    throw error;
  }

  try {
    return await publishClaimedPost(post.id);
  } catch (error) {
    await markFailed(post.id, error);
    throw error;
  }
};

export const publishDueFbPosts = async () => {
  if (schedulerRunning) return;
  schedulerRunning = true;

  try {
    const now = new Date();
    const duePosts = await db.FbScheduledPost.findAll({
      attributes: ["id"],
      where: {
        status: "pending",
        [db.Sequelize.Op.or]: [
          { mode: "now" },
          { mode: "schedule", scheduledAt: { [db.Sequelize.Op.lte]: now } },
        ],
      },
      order: [["scheduledAt", "ASC"], ["createdAt", "ASC"]],
      limit: BATCH_SIZE,
    });

    for (const { id } of duePosts) {
      if (!(await claimPost(id))) continue;
      try {
        await publishClaimedPost(id);
      } catch (error) {
        console.error(`Facebook scheduled post ${id} failed:`, error.message);
        await markFailed(id, error);
      }
    }
  } catch (error) {
    console.error("Facebook scheduled-post worker failed:", error);
  } finally {
    schedulerRunning = false;
  }
};

export const startFbPostScheduler = (intervalMs = 30_000) => {
  if (schedulerTimer) return;
  publishDueFbPosts();
  schedulerTimer = setInterval(publishDueFbPosts, intervalMs);
  schedulerTimer.unref?.();
};
