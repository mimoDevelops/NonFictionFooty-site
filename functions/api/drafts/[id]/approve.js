import { getDraftById, updateDraft } from '../../_lib/db.js';

export async function onRequestPost(context) {
  const { env, params } = context;
  const id = params.id;
  const { draft } = await getDraftById(env, id);
  if (!draft) return Response.json({ error: 'Draft not found' }, { status: 404 });
  await updateDraft(env, id, { status: 'APPROVED' });
  return Response.json({ draft: { ...draft, status: 'APPROVED' } });
}
