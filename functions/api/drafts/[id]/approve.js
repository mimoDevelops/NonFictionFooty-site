// Inlined DB helpers (no _lib import) so Cloudflare build resolves
function rowToDraft(row) {
  return {
    id: row.id, created_at: row.created_at, status: row.status, headline: row.headline,
    story_json: row.story_json, sources_json: row.sources_json, min_slides: row.min_slides, max_slides: row.max_slides,
    chosen_slide_count: row.chosen_slide_count, caption: row.caption, hashtags: row.hashtags,
    image_candidates_json: row.image_candidates_json, chosen_images_json: row.chosen_images_json,
    tiktok_publish_id: row.tiktok_publish_id, error: row.error,
  };
}
async function getDraftById(env, id) {
  if (!env.DB) return { draft: null };
  const row = await env.DB.prepare('SELECT * FROM drafts WHERE id = ?').bind(id).first();
  return { draft: row ? rowToDraft(row) : null };
}
async function updateDraft(env, id, updates) {
  if (!env.DB) return;
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
  await env.DB.prepare(`UPDATE drafts SET ${set.join(', ')} WHERE id = ?`).bind(...values).run();
}

export async function onRequestPost(context) {
  const { env, params } = context;
  const id = params.id;
  const { draft } = await getDraftById(env, id);
  if (!draft) return Response.json({ error: 'Draft not found' }, { status: 404 });
  await updateDraft(env, id, { status: 'APPROVED' });
  return Response.json({ draft: { ...draft, status: 'APPROVED' } });
}
