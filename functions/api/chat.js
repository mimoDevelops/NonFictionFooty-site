const MAX_MESSAGES = 20;
const MAX_TOTAL_CHARS = 8000;
const OPENAI_MODEL = 'gpt-4o-mini';

function getTotalChars(messages) {
  if (!Array.isArray(messages)) return 0;
  return messages.reduce((sum, m) => sum + (String(m?.content ?? '').length), 0);
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey || typeof apiKey !== 'string') {
    return Response.json(
      { error: 'OPENAI_API_KEY is not set. Add it in Cloudflare Pages → Settings → Environment variables.' },
      { status: 500 }
    );
  }

  const contentType = request.headers.get('Content-Type')?.toLowerCase();
  if (!contentType?.includes('application/json')) {
    return Response.json({ error: 'Content-Type must be application/json' }, { status: 400 });
  }

  const contentLength = request.headers.get('Content-Length');
  if (contentLength && parseInt(contentLength, 10) > 100_000) {
    return Response.json({ error: 'Request body too large' }, { status: 413 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const messages = body?.messages;
  if (!Array.isArray(messages)) {
    return Response.json({ error: 'Body must include messages array' }, { status: 400 });
  }

  if (messages.length > MAX_MESSAGES) {
    return Response.json(
      { error: `Too many messages (max ${MAX_MESSAGES})` },
      { status: 400 }
    );
  }

  const totalChars = getTotalChars(messages);
  if (totalChars > MAX_TOTAL_CHARS) {
    return Response.json(
      { error: `Total message content too long (max ${MAX_TOTAL_CHARS} characters)` },
      { status: 400 }
    );
  }

  const openaiMessages = messages.map((m) => ({
    role: m?.role === 'assistant' ? 'assistant' : 'user',
    content: String(m?.content ?? ''),
  }));

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: openaiMessages,
        max_tokens: 1024,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = data?.error?.message ?? data?.error ?? res.statusText ?? 'OpenAI request failed';
      return Response.json(
        { error: errMsg },
        { status: res.status >= 400 && res.status < 600 ? res.status : 502 }
      );
    }

    const reply = data?.choices?.[0]?.message?.content ?? '';
    return Response.json({ reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'OpenAI request failed';
    return Response.json({ error: msg }, { status: 502 });
  }
}
