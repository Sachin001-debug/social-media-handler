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