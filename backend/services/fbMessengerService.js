import db from "../models/index.js";

const GRAPH_URL = "https://graph.facebook.com/v21.0";

// Load a connected Page for this user, including its access token
const loadPageAccount = async (userId, accountId) => {
  const account = await db.FbAccount.findOne({
    where: { id: accountId, userId, isPage: true },
  });

  if (!account) {
    const error = new Error("Facebook Page not found");
    error.status = 404;
    throw error;
  }

  if (!account.accessToken) {
    const error = new Error(
      "Reconnect Facebook to refresh this Page's messaging access"
    );
    error.status = 409;
    throw error;
  }

  return account;
};

const graphGet = async (path, params) => {
  const url = new URL(GRAPH_URL + path);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url);

  let data;
  try {
    data = await response.json();
  } catch {
    const error = new Error(
      `Facebook returned an invalid response (${response.status})`
    );
    error.status = 502;
    throw error;
  }

  if (!response.ok || data.error) {
    const error = new Error(
      data?.error?.message || `Facebook API request failed (${response.status})`
    );
    error.status = response.ok ? 502 : response.status;
    throw error;
  }

  return data;
};

const normalizeParticipant = (participant) => ({
  id: participant.id,
  name: participant.name || null,
  email: participant.email || null,
});

// Conversations (inbox) for a Page
export const listConversations = async (userId, accountId) => {
  const account = await loadPageAccount(userId, accountId);

  const data = await graphGet(
    `/${encodeURIComponent(account.fbUserId)}/conversations`,
    {
      platform: "messenger",
      fields:
        "id,updated_time,unread_count,snippet,message_count,participants{id,name,email}",
      limit: "50",
      access_token: account.accessToken,
    }
  );

  const conversations = (data.data || []).map((conversation) => {
    const participants = (conversation.participants?.data || []).map(
      normalizeParticipant
    );
    // The Page itself is a participant; the "other" side is who messaged us
    const other = participants.find(
      (participant) => String(participant.id) !== String(account.fbUserId)
    );

    return {
      id: conversation.id,
      snippet: conversation.snippet || "",
      updatedTime: conversation.updated_time || null,
      unreadCount: conversation.unread_count || 0,
      messageCount: conversation.message_count || 0,
      participant: other || participants[0] || null,
    };
  });

  return { pageId: account.fbUserId, pageName: account.name, conversations };
};

// Messages inside a single conversation
export const getConversationMessages = async (
  userId,
  accountId,
  conversationId
) => {
  const account = await loadPageAccount(userId, accountId);

  const data = await graphGet(
    `/${encodeURIComponent(conversationId)}/messages`,
    {
      fields: "id,created_time,from{id,name,email},message,attachments",
      limit: "100",
      access_token: account.accessToken,
    }
  );

  const messages = (data.data || []).map((message) => ({
    id: message.id,
    createdTime: message.created_time || null,
    message: message.message || "",
    from: message.from
      ? { id: message.from.id, name: message.from.name || null }
      : null,
    fromPage: message.from
      ? String(message.from.id) === String(account.fbUserId)
      : false,
    attachments: (message.attachments?.data || []).map((attachment) => ({
      id: attachment.id,
      mimeType: attachment.mime_type || null,
      imageUrl: attachment.image_data?.url || null,
      fileUrl: attachment.file_url || null,
    })),
  }));

  // Graph returns newest first; render oldest -> newest
  messages.reverse();

  return { messages };
};

// Upload a file to Facebook and return an attachment_id
const uploadMessageAttachment = async (pageId, accessToken, file) => {
  const url = `${GRAPH_URL}/${encodeURIComponent(pageId)}/message_attachments`;

  const form = new FormData();
  form.append("access_token", accessToken);
  form.append(
    "message",
    JSON.stringify({
      attachment: {
        type: "image",
        payload: { is_reusable: true },
      },
    })
  );
  form.append("filedata", file, file.name || "image");

  const response = await fetch(url, { method: "POST", body: form });

  let data;
  try {
    data = await response.json();
  } catch {
    const error = new Error(
      `Facebook returned an invalid response while uploading (${response.status})`
    );
    error.status = 502;
    throw error;
  }

  if (!response.ok || data.error) {
    const error = new Error(
      data?.error?.message ||
        `Facebook attachment upload failed (${response.status})`
    );
    error.status = response.ok ? 502 : response.status;
    throw error;
  }

  return data.attachment_id;
};

// Reply to a conversation using the Send API
export const sendConversationMessage = async (userId, accountId, recipientId, text, file) => {
  const message = typeof text === "string" ? text.trim() : "";

  if (!message && !file) {
    const error = new Error("Message text or an attachment is required");
    error.status = 400;
    throw error;
  }

  const account = await loadPageAccount(userId, accountId);

  // If a file was provided, upload it first to get an attachment_id
  let attachmentId = null;
  if (file) {
    attachmentId = await uploadMessageAttachment(
      account.fbUserId,
      account.accessToken,
      file
    );
  }

  const url = `${GRAPH_URL}/${encodeURIComponent(account.fbUserId)}/messages`;

  const messagePayload = {};
  if (message) messagePayload.text = message;
  if (attachmentId) {
    messagePayload.attachment = {
      type: "image",
      payload: { attachment_id: attachmentId },
    };
  }

  const body = new URLSearchParams({
    recipient: JSON.stringify({ id: recipientId }),
    messaging_type: "RESPONSE",
    message: JSON.stringify(messagePayload),
    access_token: account.accessToken,
  });

  const response = await fetch(url, { method: "POST", body });

  let data;
  try {
    data = await response.json();
  } catch {
    const error = new Error(
      `Facebook returned an invalid response (${response.status})`
    );
    error.status = 502;
    throw error;
  }

  if (!response.ok || data.error) {
    const error = new Error(
      data?.error?.message || `Facebook API request failed (${response.status})`
    );
    error.status = response.ok ? 502 : response.status;
    throw error;
  }

  return {
    id: data.message_id || null,
    recipientId: data.recipient_id || recipientId,
  };
};