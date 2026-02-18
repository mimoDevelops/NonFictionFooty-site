import { getDraftById, updateDraft, getTikTokAuth } from '../../../_lib/db.js';
import { getValidAccessToken, createTikTokPhotoDraft } from '../../../_lib/tiktok.js';
import { uploadImageFromUrl, makeMediaKey } from '../../../_lib/r2.js';

const BASE_MEDIA_URL = 'https://nonfictionfooty-site.pages.dev/media';

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
    const result = await createTikTokPhotoDraft(env, {
      photoUrls: uploadedUrls,
      caption: draft.caption || draft.headline,
      accessToken,
    });
    publishId = result.publish_id;
  } catch (err) {
    await updateDraft(env, id, { status: 'NEEDS_FIX', error: err.message });
    return Response.json({ error: err.message }, { status: 502 });
  }
  const chosenImagesJson = JSON.stringify(chosenImages.slice(0, n));
  await updateDraft(env, id, {
    status: 'UPLOADED_DRAFT',
    chosen_images_json: chosenImagesJson,
    tiktok_publish_id: publishId,
    error: null,
  });
  return Response.json({
    draft: { ...draft, status: 'UPLOADED_DRAFT', tiktok_publish_id: publishId, chosen_images_json: chosenImagesJson },
    publish_id: publishId,
  });
}
