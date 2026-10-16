const GRAPH_URL = "https://graph.facebook.com/v21.0";


export async function sendAsPage(pageId, pageToken, recipientId, text) {
  const body = new URLSearchParams({
    recipient: JSON.stringify({ id: recipientId }),
    messaging_type: "RESPONSE",
    message: JSON.stringify({ text }),
    access_token: pageToken,
  });

  const response = await fetch(`${GRAPH_URL}/${encodeURIComponent(pageId)}/messages`, {
    method: "POST",
    body,
  });

  const text_body = await response.text();

  if (!response.ok) {
    console.error("Messenger send failed:", response.status, text_body);
    return false;
  }

  console.log("Messenger reply sent to", recipientId, "via Page", pageId);
  return true;
}

export async function sendImageAsPage(pageId, pageToken, recipientId, imageUrl) {
  const body = new URLSearchParams({
    recipient: JSON.stringify({ id: recipientId }),
    messaging_type: "RESPONSE",
    message: JSON.stringify({
      attachment: {
        type: "image",
        payload: { url: imageUrl, is_reusable: true },
      },
    }),
    access_token: pageToken,
  });

  const response = await fetch(`${GRAPH_URL}/${encodeURIComponent(pageId)}/messages`, {
    method: "POST",
    body,
  });

  const responseBody = await response.text();

  if (!response.ok) {
    console.error("Messenger image send failed:", response.status, responseBody);
    return false;
  }

  console.log("Messenger image sent to", recipientId, "via Page", pageId);
  return true;
}