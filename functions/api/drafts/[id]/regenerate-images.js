import { getDraftById, updateDraft } from '../../_lib/db.js';
import { getImageCandidates } from '../../_lib/images.js';

export async function onRequestPost(context) {
  const { env, params } = context;
  const id = params.id;
  const { draft } = await getDraftById(env, id);
  if (!draft) return Response.json({ error: 'Draft not found' }, { status: 404 });
  const count = Math.max((draft.chosen_slide_count || 5) + 2, 10);
  const candidates = await getImageCandidates(env, draft.headline || 'soccer', count, !!env.UNSPLASH_ACCESS_KEY);
  await updateDraft(env, id, { image_candidates_json: JSON.stringify(candidates), chosen_images_json: null });
  const updated = { ...draft, image_candidates_json: JSON.stringify(candidates), chosen_images_json: null };
  return Response.json({ draft: updated });
}
