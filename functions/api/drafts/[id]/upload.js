// Inlined DB, TikTok, R2 (no _lib import) so Cloudflare build resolves
const TIKTOK_CONTENT_INIT_URL = 'https://open.tiktokapis.com/v2/post/publish/content/init/';
const BASE_MEDIA_URL = 'https://nonfictionfooty-site.pages.dev/media';

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
  const allowed = ['status', 'chosen_images_json', 'tiktok_publish_id', 'error'];
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
async function getTikTokAuth(env) {
  if (!env.DB) return null;
  const row = await env.DB.prepare('SELECT * FROM tiktok_auth LIMIT 1').first();
  return row ? { open_id: row.open_id, access_token: row.access_token, refresh_token: row.refresh_token, expires_at: row.expires_at } : null;
}
async function refreshAccessToken(env, refreshToken) {
  const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: env.TIKTOK_CLIENT_KEY,
      client_secret: env.TIKTOK_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  return { access_token: data.data.access_token, refresh_token: data.data.refresh_token ?? refreshToken, expires_at: new Date(Date.now() + data.data.expires_in * 1000).toISOString() };
}
async function getValidAccessToken(env, authRow) {
  if (!authRow) return null;
  if (new Date(authRow.expires_at).getTime() > Date.now() + 60000) return authRow.access_token;
  const refreshed = await refreshAccessToken(env, authRow.refresh_token);
  await env.DB.prepare(
    `INSERT INTO tiktok_auth (open_id, access_token, refresh_token, expires_at, updated_at) VALUES (?, ?, ?, ?, datetime('now')) ON CONFLICT(open_id) DO UPDATE SET access_token = excluded.access_token, refresh_token = excluded.refresh_token, expires_at = excluded.expires_at, updated_at = datetime('now')`
  ).bind(authRow.open_id, refreshed.access_token, refreshed.refresh_token, refreshed.expires_at).run();
  return refreshed.access_token;
}
async function createTikTokPhotoDraft(env, photoUrls, caption, accessToken) {
  const body = {
    post_info: { title: caption || 'NonFictionFooty', description: caption || '' },
    source_info: { source: 'PULL_FROM_URL', photo_images: photoUrls, photo_cover_index: 0 },
    post_mode: 'MEDIA_UPLOAD',
    media_type: 'PHOTO',
  };
  const res = await fetch(TIKTOK_CONTENT_INIT_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.message?.message || data.error?.message || JSON.stringify(data.error));
  const publishId = data.data?.publish_id;
  if (!publishId) throw new Error('No publish_id in response');
  return publishId;
}
function mimeToExt(mimeOrUrl) {
  if (!mimeOrUrl) return 'jpg';
  if (String(mimeOrUrl).startsWith('http')) {
    try {
      const path = new URL(mimeOrUrl).pathname;
      const match = path.match(/\.(jpe?g|png|gif|webp)$/i);
      return match ? match[1].toLowerCase() : 'jpg';
    } catch { return 'jpg'; }
  }
  const map = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' };
  return map[mimeOrUrl] || 'jpg';
}
function makeMediaKey(draftId, index, sourceUrl) {
  const ext = mimeToExt(sourceUrl) || 'jpg';
  return `${draftId}/${index}.${ext}`;
}
async function uploadImageFromUrl(env, sourceUrl, key) {
  if (!env.BUCKET) throw new Error('R2 bucket not configured');
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const blob = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  await env.BUCKET.put(key, blob, { httpMetadata: { contentType } });
  return key;
}

export async function onRequestPost(context) {
  const { env, params, request } = context;
  const id = params.id;
  if (!env.BUCKET) return Response.json({ error: 'R2 not configured' }, { status: 503 });
  const auth = await getTikTokAuth(env);
  const accessToken = auth ? await getValidAccessToken(env, auth) : null;
  if (!accessToken) return Response.json({ error: 'TikTok not connected' }, { status: 401 });
  const { draft } = await getDraftById(env, id);
  if (!draft) return Response.json({ error: 'Draft not found' }, { status: 404 });
  let chosenImages = [];
  try {
    const body = await request.json().catch(() => ({}));
    chosenImages = body.chosen_images || (draft.chosen_images_json ? JSON.parse(draft.chosen_images_json) : []);
  } catch {}
  if (!chosenImages.length && draft.image_candidates_json) {
    const candidates = JSON.parse(draft.image_candidates_json);
    chosenImages = candidates.slice(0, Math.min(draft.chosen_slide_count || 10, 35)).map(c => ({ url: c.url, license: c.license, attribution: c.attribution }));
  }
  if (chosenImages.length === 0) return Response.json({ error: 'No images chosen' }, { status: 400 });
  const n = Math.min(chosenImages.length, 35);
  const uploadedUrls = [];
  for (let i = 0; i < n; i++) {
    const cand = chosenImages[i];
    const sourceUrl = typeof cand === 'string' ? cand : cand.url;
    const key = makeMediaKey(id, i, sourceUrl);
    await uploadImageFromUrl(env, sourceUrl, key);
    uploadedUrls.push(`${BASE_MEDIA_URL}/${key}`);
  }
  let publishId;
  try {
    publishId = await createTikTokPhotoDraft(env, uploadedUrls, draft.caption || draft.headline, accessToken);
  } catch (err) {
    await updateDraft(env, id, { status: 'NEEDS_FIX', error: err.message });
    return Response.json({ error: err.message }, { status: 502 });
  }
  const chosenImagesJson = JSON.stringify(chosenImages.slice(0, n));
  await updateDraft(env, id, { status: 'UPLOADED_DRAFT', chosen_images_json: chosenImagesJson, tiktok_publish_id: publishId, error: null });
  return Response.json({
    draft: { ...draft, status: 'UPLOADED_DRAFT', tiktok_publish_id: publishId, chosen_images_json: chosenImagesJson },
    publish_id: publishId,
  });
}
