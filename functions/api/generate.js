import { insertJob } from '../lib/db.js';

export async function onRequestPost(context) {
  const { env, request } = context;
  if (!env.DB) return Response.json({ error: 'D1 not configured' }, { status: 503 });
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const {
    topic,
    teamOrPlayer,
    eraOrMatch,
    tone,
    durationSec,
    stylePreset,
  } = body;
  const jobId = crypto.randomUUID();
  const job = {
    id: jobId,
    status: 'pending',
    topic: topic ?? null,
    team_or_player: teamOrPlayer ?? null,
    era_or_match: eraOrMatch ?? null,
    tone: tone ?? null,
    duration_sec: durationSec ?? 45,
    style_preset: stylePreset ?? null,
  };
  await insertJob(env, job);
  return Response.json({ jobId });
}
