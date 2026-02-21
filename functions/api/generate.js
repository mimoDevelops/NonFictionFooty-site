import { getDb } from '../lib/db.js';
import { insertJob } from '../lib/db.js';

const MAX_TOPIC_LEN = 300;
const MAX_BODY_BYTES = 2048;
const RATE_LIMIT_WINDOW_MINUTES = 1;
const RATE_LIMIT_MAX_JOBS = 15;

export async function onRequestPost(context) {
  const { env, request } = context;
  if (!env.DB) return Response.json({ error: 'D1 not configured' }, { status: 503 });

  if (request.headers.get('Content-Type')?.toLowerCase().includes('application/json') === false) {
    return Response.json({ error: 'Content-Type must be application/json' }, { status: 400 });
  }
  const contentLength = request.headers.get('Content-Length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return Response.json({ error: 'Request body too large' }, { status: 413 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const db = getDb(env);
  const recent = await db.prepare(
    `SELECT COUNT(*) as n FROM jobs WHERE created_at > datetime('now', ?)`
  ).bind(`-${RATE_LIMIT_WINDOW_MINUTES} minutes`).first();
  if (recent && Number(recent.n) >= RATE_LIMIT_MAX_JOBS) {
    return Response.json({ error: 'Too many jobs created recently. Try again in a minute.' }, { status: 429 });
  }

  const {
    topic,
    teamOrPlayer,
    eraOrMatch,
    tone,
    durationSec,
    stylePreset,
    category,
    context,
  } = body;

  const topicStr = topic != null ? String(topic).trim().slice(0, MAX_TOPIC_LEN) : null;
  if (!topicStr) return Response.json({ error: 'topic is required' }, { status: 400 });

  const duration = durationSec != null ? Math.min(120, Math.max(30, Number(durationSec) || 45)) : 45;
  const contextJson = context != null ? (typeof context === 'string' ? context : JSON.stringify(context)) : null;

  const jobId = crypto.randomUUID();
  const job = {
    id: jobId,
    status: 'pending',
    topic: topicStr,
    team_or_player: teamOrPlayer != null ? String(teamOrPlayer).slice(0, 200) : null,
    era_or_match: eraOrMatch != null ? String(eraOrMatch).slice(0, 200) : null,
    tone: tone != null ? String(tone).slice(0, 50) : null,
    duration_sec: duration,
    style_preset: stylePreset != null ? String(stylePreset).slice(0, 50) : null,
    category: category != null ? String(category).slice(0, 50) : null,
    context_json: contextJson != null ? contextJson.slice(0, 2000) : null,
  };
  await insertJob(env, job);
  return Response.json({ jobId });
}
