/**
 * LLM-driven content generation (v1). Topic-agnostic.
 * Expects env.LLM_API_KEY (OpenAI-compatible API key).
 * Returns { script, caption, hashtags } for jobProcessor. On failure, caller should fall back to rule-based story.js.
 */

const DEFAULT_MODEL = 'gpt-4o-mini';

/**
 * @param {object} env - Cloudflare env (LLM_API_KEY, optional LLM_API_BASE)
 * @param {object} opts - { topic, context (JSON string), tone, durationSec }
 * @returns {Promise<{ script: object, caption: string, hashtags: string }>}
 */
export async function generateContentWithLLM(env, opts) {
  const apiKey = env.LLM_API_KEY;
  if (!apiKey) return null;

  const topic = String(opts.topic || 'general').slice(0, 200);
  const tone = String(opts.tone || 'factual').slice(0, 50);
  const durationSec = Math.min(120, Math.max(30, Number(opts.durationSec) || 45));
  let contextStr = '';
  if (opts.context) {
    try {
      const ctx = typeof opts.context === 'string' ? JSON.parse(opts.context) : opts.context;
      contextStr = typeof ctx === 'object' ? JSON.stringify(ctx) : '';
    } catch {
      contextStr = '';
    }
  }

  const systemPrompt = `You are a short-video script writer. Output valid JSON only, no markdown.
Schema:
{
  "hook": "one gripping opening sentence",
  "script": "full narration text, 2-4 sentences, suitable for ${durationSec}s voiceover",
  "beats": [ { "index": 1, "text": "sentence or phrase", "visual": "brief visual suggestion" } ],
  "title": "short title",
  "caption": "platform caption, 1-2 sentences",
  "hashtags": "space-separated hashtags, 3-6 tags"
}
Be concise. Topic-agnostic (finance, history, motivation, sport, etc.).`;

  const userPrompt = `Topic: ${topic}${contextStr ? `\nContext: ${contextStr}` : ''}\nTone: ${tone}. Duration target: ~${durationSec}s.`;

  const baseUrl = (env.LLM_API_BASE || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = env.LLM_MODEL || DEFAULT_MODEL;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM: ${res.status} ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('LLM: empty response');

  const raw = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('LLM: invalid JSON');
  }

  const hook = parsed.hook || parsed.title || '';
  const scriptText = parsed.script || hook;
  const beats = Array.isArray(parsed.beats) ? parsed.beats : [{ index: 1, text: scriptText, visual: 'default' }];
  const slides = beats.map((b) => ({ index: b.index, text: b.text || '', visual: b.visual || '' }));
  const script = {
    hook: parsed.hook || '',
    script: scriptText,
    beats,
    slides,
    durationSec,
    title: parsed.title || '',
  };
  const caption = parsed.caption || parsed.title || scriptText.slice(0, 150);
  const hashtags = (parsed.hashtags || '#shortvideo #story #viral').replace(/,/g, ' ').trim().slice(0, 200);

  return { script, caption, hashtags };
}
