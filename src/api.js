/**
 * Minimal API helper. All AI calls go through the server; no API keys in client.
 */
export async function postChat(messages) {
  const r = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    credentials: 'include',
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = body?.error != null ? String(body.error) : r.statusText || 'Request failed';
    throw new Error(msg);
  }
  return body;
}
