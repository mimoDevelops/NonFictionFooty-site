import { getJobById } from '../../../lib/db.js';

export async function onRequestGet(context) {
  const { env, params } = context;
  const id = params.id;
  const { job } = await getJobById(env, id);
  if (!job || job.status !== 'completed' || !job.output_final_mp4) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  const bucket = env.BUCKET;
  if (!bucket) return Response.json({ error: 'R2 not configured' }, { status: 503 });
  const obj = await bucket.get(job.output_final_mp4);
  if (!obj) return Response.json({ error: 'File not found' }, { status: 404 });
  return new Response(obj.body, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="nonfictionfooty-${id}.mp4"`,
    },
  });
}
