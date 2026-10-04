import fs from "fs/promises";
import db from "../models/index.js";

const GRAPH_URL = "https://graph.facebook.com/v21.0";
const BATCH_SIZE = 20; // max posts handled per scheduler run
const { Op } = db.Sequelize;

let schedulerTimer = null;
let isWorkerRunning = false; // prevents two scheduler runs overlapping

/* -------------------------------------------------------------------------- */
/* 1. Talking to Facebook                                                     */
/* -------------------------------------------------------------------------- */

// Builds the request body. Uses FormData when uploading a file,
// otherwise plain URL-encoded form data.
const buildRequestBody = async (accessToken, fields, file) => {
  if (!file) {
    return new URLSearchParams({ access_token: accessToken, ...fields });
  }

  const fileData = await fs.readFile(file.path);
  const blob = new Blob([fileData], {
    type: file.mimeType || "application/octet-stream",
  });

  const formData = new FormData();
  formData.append("source", blob, file.name);
  formData.append("access_token", accessToken);
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }
  return formData;
};

// Sends one POST to the Graph API and returns the new Facebook post ID.
// Example URL: https://graph.facebook.com/v21.0/123456789/feed
const callFacebook = async ({ pageId, endpoint, accessToken, fields, file }) => {
  const url = `${GRAPH_URL}/${encodeURIComponent(pageId)}/${endpoint}`;
  const body = await buildRequestBody(accessToken, fields, file);

  const response = await fetch(url, { method: "POST", body });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Facebook returned an invalid response (${response.status})`);
  }

  if (!response.ok || data.error) {
    throw new Error(
      data?.error?.message || `Facebook API request failed (${response.status})`
    );
  }

  const fbPostId = data.post_id || data.id;
  if (!fbPostId) throw new Error("Facebook did not return a post ID");

  return String(fbPostId);
};

/* -------------------------------------------------------------------------- */
/* 2. Deciding WHAT to publish (text, image or video)                         */
/* -------------------------------------------------------------------------- */

const publishPost = async (post, account) => {
  if (!account?.isPage || !account.accessToken) {
    throw new Error("The selected Facebook Page is disconnected or unavailable");
  }

  const request = {
    pageId: account.fbUserId,
    accessToken: account.accessToken,
    fields: {},
  };

  // Text-only post -> /feed
  if (post.mediaType === "none") {
    if (post.message) request.fields.message = post.message;
    if (post.link) request.fields.link = post.link;
    return callFacebook({ ...request, endpoint: "feed" });
  }

  // Everything below needs a media file
  if (!post.mediaPath) {
    throw new Error("The scheduled media file is missing");
  }

  const file = {
    path: post.mediaPath,
    name: post.mediaOriginalName || "upload",
    mimeType: post.mediaMimeType,
  };
  const text = [post.message, post.link].filter(Boolean).join("\n");

  // Image post -> /photos
  if (post.mediaType === "image") {
    if (text) request.fields.message = text;
    return callFacebook({ ...request, endpoint: "photos", file });
  }

  // Video post -> /videos
  if (post.mediaType === "video") {
    if (text) request.fields.description = text;
    request.fields.title = post.mediaOriginalName || "Facebook video";
    return callFacebook({ ...request, endpoint: "videos", file });
  }

  throw new Error(`Facebook Page publishing does not support ${post.mediaType} uploads`);
};

/* -------------------------------------------------------------------------- */
/* 3. Database status handling: pending -> processing -> published / failed   */
/* -------------------------------------------------------------------------- */

// "Claim" a post: only succeeds if it is still pending.
// This stops two workers (or a manual click + the scheduler) from posting twice.
const claimPost = async (postId) => {
  const [updatedRows] = await db.FbScheduledPost.update(
    { status: "processing", errorMessage: null },
    { where: { id: postId, status: "pending" } }
  );
  return updatedRows === 1;
};

const markFailed = async (postId, error) => {
  await db.FbScheduledPost.update(
    { status: "failed", errorMessage: error.message || "Facebook publishing failed" },
    { where: { id: postId, status: "processing" } }
  );
};

// Loads the post, publishes it, and saves the result.
const publishClaimedPost = async (postId) => {
  const post = await db.FbScheduledPost.findByPk(postId, {
    include: [{ model: db.FbAccount, as: "fbAccount" }],
  });
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

const httpError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/* -------------------------------------------------------------------------- */
/* 4. Public functions                                                        */
/* -------------------------------------------------------------------------- */

// Publish one specific post right now (e.g. user clicks "Publish").
export const publishFbScheduledPostById = async (postId, userId) => {
  const post = await db.FbScheduledPost.findOne({ where: { id: postId, userId } });
  if (!post) throw httpError("Scheduled post not found", 404);

  const isDue =
    post.mode === "now" ||
    (post.scheduledAt && new Date(post.scheduledAt).getTime() <= Date.now());
  if (!isDue) throw httpError("This post is not due yet", 409);

  if (!(await claimPost(post.id))) {
    throw httpError("This post is already being processed or has already finished", 409);
  }

  try {
    return await publishClaimedPost(post.id);
  } catch (error) {
    await markFailed(post.id, error);
    throw error;
  }
};

// Finds all pending posts that are due and publishes them one by one.
export const publishDueFbPosts = async () => {
  if (isWorkerRunning) return;
  isWorkerRunning = true;

  try {
    const duePosts = await db.FbScheduledPost.findAll({
      attributes: ["id"],
      where: {
        status: "pending",
        [Op.or]: [
          { mode: "now" },
          { mode: "schedule", scheduledAt: { [Op.lte]: new Date() } },
        ],
      },
      order: [["scheduledAt", "ASC"], ["createdAt", "ASC"]],
      limit: BATCH_SIZE,
    });

    for (const { id } of duePosts) {
      if (!(await claimPost(id))) continue; // someone else took it

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
    isWorkerRunning = false;
  }
};

// Starts the background timer (runs once immediately, then every 30 seconds).
export const startFbPostScheduler = (intervalMs = 30_000) => {
  if (schedulerTimer) return; // already started

  publishDueFbPosts();
  schedulerTimer = setInterval(publishDueFbPosts, intervalMs);
  schedulerTimer.unref?.(); // don't keep the process alive just for this timer
};