import { listDrafts, insertDraft } from '../../lib/db.js';
import { generateStoryDraft } from '../../lib/story.js';
import { getImageCandidates } from '../../lib/images.js';
import { chooseSlideCount } from '../../lib/tiktok.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || undefined;
  const { drafts } = await listDrafts(env, { status });
  return Response.json({ drafts });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  if (!env.DB) return Response.json({ error: 'D1 not configured' }, { status: 503 });
  if (!env.BUCKET) return Response.json({ error: 'R2 not configured' }, { status: 503 });
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { niche_seed, min_slides = 3, max_slides = 10, tone = 'factual' } = body;
  const minSlides = Math.min(35, Math.max(1, min_slides));
  const maxSlides = Math.min(35, Math.max(minSlides, max_slides));
  const draftId = crypto.randomUUID();
  const story = generateStoryDraft(niche_seed || 'soccer', tone, minSlides, maxSlides);
  const chosenSlideCount = chooseSlideCount(minSlides, maxSlides);
  const headline = story.headline;
  const imageCandidates = await getImageCandidates(env, headline, Math.max(chosenSlideCount + 2, 10), !!env.UNSPLASH_ACCESS_KEY);
  const draft = {
    id: draftId,
    status: 'DRAFT',
    headline: story.headline,
    story_json: story.story_json,
    sources_json: story.sources_json,
    min_slides: minSlides,
    max_slides: maxSlides,
    chosen_slide_count: chosenSlideCount,
    caption: headline,
    hashtags: '#soccer #football #NonFictionFooty #story',
    image_candidates_json: JSON.stringify(imageCandidates),
    chosen_images_json: null,
    tiktok_publish_id: null,
    error: null,
  };
  await insertDraft(env, draft);
  return Response.json({ draft });
}
