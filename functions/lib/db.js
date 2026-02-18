/**
 * D1 helpers for drafts and TikTok auth.
 * Uses env.DB (D1). If DB is missing, we could fall back to KV (not implemented here for MVP).
 */

const DRAFT_STATUSES = ['DRAFT', 'APPROVED', 'UPLOADED_DRAFT', 'NEEDS_FIX'];

export function getDb(env) {
  return env.DB || null;
}

export async function listDrafts(env, { status } = {}) {
  const db = getDb(env);
  if (!db) return { drafts: [], fallback: true };
  let q = 'SELECT * FROM drafts ORDER BY created_at DESC';
  const params = [];
  if (status) {
    q = 'SELECT * FROM drafts WHERE status = ? ORDER BY created_at DESC';
    params.push(status);
  }
  const { results } = await db.prepare(q).bind(...params).all();
  return { drafts: results.map(rowToDraft), fallback: false };
}

export async function getDraftById(env, id) {
  const db = getDb(env);
  if (!db) return { draft: null, fallback: true };
  const row = await db.prepare('SELECT * FROM drafts WHERE id = ?').bind(id).first();
  return { draft: row ? rowToDraft(row) : null, fallback: false };
}

export async function insertDraft(env, draft) {
  const db = getDb(env);
  if (!db) throw new Error('D1 not configured');
  await db.prepare(
    `INSERT INTO drafts (id, created_at, status, headline, story_json, sources_json, min_slides, max_slides, chosen_slide_count, caption, hashtags, image_candidates_json, chosen_images_json, tiktok_publish_id, error)
     VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    draft.id,
    draft.status || 'DRAFT',
    draft.headline ?? null,
    draft.story_json ?? null,
    draft.sources_json ?? null,
    draft.min_slides ?? 3,
    draft.max_slides ?? 10,
    draft.chosen_slide_count ?? null,
    draft.caption ?? null,
    draft.hashtags ?? null,
    draft.image_candidates_json ?? null,
    draft.chosen_images_json ?? null,
    draft.tiktok_publish_id ?? null,
    draft.error ?? null
  ).run();
  return draft;
}

export async function updateDraft(env, id, updates) {
  const db = getDb(env);
  if (!db) throw new Error('D1 not configured');
  const allowed = ['status', 'headline', 'story_json', 'sources_json', 'chosen_slide_count', 'caption', 'hashtags', 'image_candidates_json', 'chosen_images_json', 'tiktok_publish_id', 'error'];
  const set = [];
  const values = [];
  for (const [k, v] of Object.entries(updates)) {
    if (!allowed.includes(k)) continue;
    set.push(`${k} = ?`);
    values.push(v === undefined ? null : (typeof v === 'object' ? JSON.stringify(v) : v));
  }
  if (set.length === 0) return;
  values.push(id);
  await db.prepare(`UPDATE drafts SET ${set.join(', ')} WHERE id = ?`).bind(...values).run();
}

export async function getTikTokAuth(env) {
  const db = getDb(env);
  if (!db) return null;
  const row = await db.prepare('SELECT * FROM tiktok_auth LIMIT 1').first();
  return row ? { open_id: row.open_id, access_token: row.access_token, refresh_token: row.refresh_token, expires_at: row.expires_at } : null;
}

export async function upsertTikTokAuth(env, { open_id, access_token, refresh_token, expires_at }) {
  const db = getDb(env);
  if (!db) throw new Error('D1 not configured');
  await db.prepare(
    `INSERT INTO tiktok_auth (open_id, access_token, refresh_token, expires_at, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(open_id) DO UPDATE SET access_token = excluded.access_token, refresh_token = excluded.refresh_token, expires_at = excluded.expires_at, updated_at = datetime('now')`
  ).bind(open_id, access_token, refresh_token, expires_at).run();
}

function rowToDraft(row) {
  return {
    id: row.id,
    created_at: row.created_at,
    status: row.status,
    headline: row.headline,
    story_json: row.story_json,
    sources_json: row.sources_json,
    min_slides: row.min_slides,
    max_slides: row.max_slides,
    chosen_slide_count: row.chosen_slide_count,
    caption: row.caption,
    hashtags: row.hashtags,
    image_candidates_json: row.image_candidates_json,
    chosen_images_json: row.chosen_images_json,
    tiktok_publish_id: row.tiktok_publish_id,
    error: row.error,
  };
}

export { DRAFT_STATUSES };
