import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import db from "../models/index.js";

const GRAPH_URL = "https://graph.facebook.com/v21.0";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = path.resolve(__dirname, "..", "uploads");

const graphRequest = async (requestPath, { method = "POST", params = {} } = {}) => {
  const url = new URL(`${GRAPH_URL}${requestPath}`);

  let body;
  if (method === "POST") {
    body = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      body.append(key, String(value));
    }
  } else {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, { method, body });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Instagram returned an invalid response (${response.status})`);
  }

  if (!response.ok || data.error) {
    const message =
      data?.error?.message || `Instagram API request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
};

// Instagram never accepts file uploads directly: Meta downloads the media
// from a public URL, then publishes it to the account.
const publicMediaUrl = (mediaPath) => {
  const base = (process.env.PUBLIC_API_URL || "").replace(/\/$/, "");

  if (!base || /^https?:\/\/(localhost|127\.|0\.0\.0\.0)/i.test(base)) {
    throw new Error(
      "Instagram must be able to download the media from a public URL. " +
        "Set PUBLIC_API_URL in backend/.env to your publicly reachable backend origin " +
        "(a tunnel like ngrok/cloudflared, or your deployed server) and restart the server.",
    );
  }

  const relative = path.relative(UPLOADS_ROOT, mediaPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("The scheduled media file is missing");
  }

  return `${base}/uploads/${relative.split(path.sep).join("/")}`;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Instagram first builds a media container (image/video still being
// processed on Meta's side) and only media_publish makes it live.
const waitForContainer = async (igUserId, containerId, accessToken, timeoutMs) => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const data = await graphRequest(`/${containerId}`, {
      method: "GET",
      params: { fields: "status_code", access_token: accessToken },
    });

    if (data.status_code === "FINISHED") return;
    if (data.status_code === "ERROR" || data.status_code === "EXPIRED") {
      throw new Error(
        `Instagram could not process the media (status: ${data.status_code})`,
      );
    }

    await sleep(5000);
  }

  throw new Error("Instagram media processing timed out");
};

export const postInstaPost = async (post, account) => {
  if (!account?.igUserId || !account.pageAccessToken) {
    throw new Error("The selected Instagram account is disconnected or unavailable");
  }

  if (post.mediaType === "none") {
    throw new Error("Instagram posts need media");
  }

  if (!post.mediaPath) {
    throw new Error("The scheduled media file is missing");
  }

  const accessToken = account.pageAccessToken;
  const igUserId = account.igUserId;
  const caption = [post.caption, post.link].filter(Boolean).join("\n");
  const mediaUrl = publicMediaUrl(post.mediaPath);

  const createFields =
    post.mediaType === "image"
      ? { image_url: mediaUrl, ...(caption && { caption }) }
      : // videos go out as Reels
        { media_type: "REELS", video_url: mediaUrl, ...(caption && { caption }) };

  const container = await graphRequest(`/${igUserId}/media`, {
    params: { ...createFields, access_token: accessToken },
  });

  if (!container?.id) {
    throw new Error("Instagram did not create a media container");
  }

  await waitForContainer(
    igUserId,
    container.id,
    accessToken,
    post.mediaType === "video" ? 5 * 60 * 1000 : 60 * 1000,
  );

  const published = await graphRequest(`/${igUserId}/media_publish`, {
    params: { creation_id: container.id, access_token: accessToken },
  });

  if (!published?.id) {
    throw new Error("Instagram did not return a post ID");
  }

  return String(published.id);
};

const loadPost = (id) =>
  db.InstagramScheduledPost.findByPk(id, {
    include: [{ model: db.InstagramAccount, as: "instagramAccount" }],
  });

const markFailed = async (postId, error) => {
  await db.InstagramScheduledPost.update(
    {
      status: "failed",
      errorMessage: error.message || "Instagram publishing failed",
    },
    { where: { id: postId, status: "processing" } },
  );
};

const publishClaimedPost = async (postId) => {
  const post = await loadPost(postId);
  if (!post) throw new Error("Scheduled post no longer exists");

  const instaPostId = await postInstaPost(post, post.instagramAccount);
  await post.update({
    status: "published",
    instaPostId,
    errorMessage: null,
    publishedAt: new Date(),
  });
  return instaPostId;
};

const claimPost = async (postId) => {
  const [claimed] = await db.InstagramScheduledPost.update(
    { status: "processing", errorMessage: null },
    { where: { id: postId, status: "pending" } },
  );
  return claimed === 1;
};

// Publishing right away is only wired up for "post now" — scheduled posts
// get their own publisher later.
export const publishInstaPostById = async (postId, userId) => {
  const post = await db.InstagramScheduledPost.findOne({
    where: { id: postId, userId },
  });
  if (!post) {
    const error = new Error("Post not found");
    error.status = 404;
    throw error;
  }

  if (post.mode !== "now") {
    const error = new Error(
      "Scheduled posts are not published yet — that will be enabled later",
    );
    error.status = 409;
    throw error;
  }

  if (!(await claimPost(post.id))) {
    const error = new Error(
      "This post is already being processed or has already finished",
    );
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
