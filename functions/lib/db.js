/**
 * D1 helpers for jobs (generate → export workflow).
 */

export function getDb(env) {
  return env.DB || null;
}

function rowToJob(row) {
  return {
    id: row.id,
    created_at: row.created_at,
    status: row.status,
    topic: row.topic,
    team_or_player: row.team_or_player,
    era_or_match: row.era_or_match,
    tone: row.tone,
    duration_sec: row.duration_sec,
    style_preset: row.style_preset,
    script_json: row.script_json,
    caption: row.caption,
    hashtags: row.hashtags,
    output_final_mp4: row.output_final_mp4,
    output_captions_json: row.output_captions_json,
    output_subtitles_srt: row.output_subtitles_srt,
    output_cover_png: row.output_cover_png,
    error: row.error,
  };
}

export async function listJobs(env, { limit = 50 } = {}) {
  const db = getDb(env);
  if (!db) return { jobs: [], fallback: true };
  const { results } = await db.prepare('SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?').bind(limit).all();
  return { jobs: results.map(rowToJob), fallback: false };
}

export async function getJobById(env, id) {
  const db = getDb(env);
  if (!db) return { job: null, fallback: true };
  const row = await db.prepare('SELECT * FROM jobs WHERE id = ?').bind(id).first();
  return { job: row ? rowToJob(row) : null, fallback: false };
}

export async function insertJob(env, job) {
  const db = getDb(env);
  if (!db) throw new Error('D1 not configured');
  await db.prepare(
    `INSERT INTO jobs (id, created_at, status, topic, team_or_player, era_or_match, tone, duration_sec, style_preset, script_json, caption, hashtags, output_final_mp4, output_captions_json, output_subtitles_srt, output_cover_png, error)
     VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    job.id,
    job.status ?? 'pending',
    job.topic ?? null,
    job.team_or_player ?? null,
    job.era_or_match ?? null,
    job.tone ?? null,
    job.duration_sec ?? null,
    job.style_preset ?? null,
    job.script_json ?? null,
    job.caption ?? null,
    job.hashtags ?? null,
    job.output_final_mp4 ?? null,
    job.output_captions_json ?? null,
    job.output_subtitles_srt ?? null,
    job.output_cover_png ?? null,
    job.error ?? null
  ).run();
  return job;
}

export async function updateJob(env, id, updates) {
  const db = getDb(env);
  if (!db) throw new Error('D1 not configured');
  const allowed = ['status', 'script_json', 'caption', 'hashtags', 'output_final_mp4', 'output_captions_json', 'output_subtitles_srt', 'output_cover_png', 'error'];
  const set = [];
  const values = [];
  for (const [k, v] of Object.entries(updates)) {
    if (!allowed.includes(k)) continue;
    set.push(`${k} = ?`);
    values.push(v === undefined ? null : (typeof v === 'object' ? JSON.stringify(v) : v));
  }
  if (set.length === 0) return;
  values.push(id);
  await db.prepare(`UPDATE jobs SET ${set.join(', ')} WHERE id = ?`).bind(...values).run();
}
