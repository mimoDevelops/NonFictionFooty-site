import { getDraftById } from '../../_lib/db.js';

export async function onRequestGet(context) {
  const { env, params } = context;
  const id = params.id;
  const { draft } = await getDraftById(env, id);
  if (!draft) return Response.json({ error: 'Draft not found' }, { status: 404 });
  return Response.json({ draft });
}
