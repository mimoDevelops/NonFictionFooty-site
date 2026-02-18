// Inlined DB + image fetch (no _lib import) so Cloudflare build resolves
const WIKIMEDIA_API = 'https://commons.wikimedia.org/w/api.php';

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
  const allowed = ['status', 'image_candidates_json', 'chosen_images_json'];
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

async function fetchWikimediaImages(query, count = 10) {
  const params = new URLSearchParams({ action: 'query', list: 'search', srsearch: query, srnamespace: '6', srlimit: String(count), format: 'json', origin: '*' });
  const res = await fetch(`${WIKIMEDIA_API}?${params}`);
  const data = await res.json();
  const titles = (data.query?.search || []).map(s => s.title);
  if (titles.length === 0) return [];
  const infoParams = new URLSearchParams({ action: 'query', titles: titles.join('|'), prop: 'imageinfo', iiprop: 'url|extmetadata', format: 'json', origin: '*' });
  const infoRes = await fetch(`${WIKIMEDIA_API}?${infoParams}`);
  const infoData = await infoRes.json();
  const pages = infoData.query?.pages || {};
  const results = [];
  for (const page of Object.values(pages)) {
    const ii = page.imageinfo?.[0];
    if (!ii?.url) continue;
    const ext = ii.extmetadata || {};
    const license = ext.LicenseShortName?.value || ext.License?.value || 'Unknown';
    const author = ext.Artist?.value || ext.Credit?.value || 'Unknown';
    results.push({ url: ii.url, license: String(license).replace(/<[^>]+>/g, '').trim(), attribution: String(author).replace(/<[^>]+>/g, '').trim(), source: 'wikimedia' });
  }
  return results;
}
async function fetchUnsplashImages(env, query, count = 5) {
  if (!env.UNSPLASH_ACCESS_KEY) return [];
  const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`, { headers: { 'Authorization': `Client-ID ${env.UNSPLASH_ACCESS_KEY}` } });
  const data = await res.json();
  return (data.results || []).map(r => ({ url: r.urls?.regular || r.urls?.full, license: 'Unsplash License', attribution: r.user?.name ? `Photo by ${r.user.name} on Unsplash` : 'Unsplash', source: 'unsplash' })).filter(x => x.url);
}
async function getImageCandidates(env, headlineOrQuery, count, useUnsplash) {
  const query = headlineOrQuery || 'soccer football';
  const wikimedia = await fetchWikimediaImages(query, count);
  let combined = wikimedia;
  if (useUnsplash && env.UNSPLASH_ACCESS_KEY) {
    const unsplash = await fetchUnsplashImages(env, query, 5);
    combined = [...wikimedia, ...unsplash].slice(0, count);
  }
  return combined;
}

export async function onRequestPost(context) {
  const { env, params } = context;
  const id = params.id;
  const { draft } = await getDraftById(env, id);
  if (!draft) return Response.json({ error: 'Draft not found' }, { status: 404 });
  const count = Math.max((draft.chosen_slide_count || 5) + 2, 10);
  const candidates = await getImageCandidates(env, draft.headline || 'soccer', count, !!env.UNSPLASH_ACCESS_KEY);
  await updateDraft(env, id, { image_candidates_json: JSON.stringify(candidates), chosen_images_json: null });
  return Response.json({ draft: { ...draft, image_candidates_json: JSON.stringify(candidates), chosen_images_json: null } });
}
