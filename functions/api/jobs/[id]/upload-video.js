/**
 * POST /api/jobs/:id/upload-video
 * Called by the external video worker after it builds the real MP4.
 * Body: raw MP4 bytes. Header: Authorization: Bearer <WEBHOOK_SECRET>
 * Writes to R2 at jobs/{id}/final.mp4 and marks job completed.
 */
import { getJobById, updateJob } from '../../../lib/db.js';

const JOBS_PREFIX = 'jobs';

export async function onRequestPost(context) {
  const { env, params, request } = context;
  const id = params.id;
  const secret = env.WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: 'Upload not configured' }, { status: 503 });

  const auth = request.headers.get('Authorization');
  if (auth !== `Bearer ${secret}`) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { job } = await getJobById(env, id);
  if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });
  if (job.status === 'completed') return Response.json({ message: 'Already completed' }, { status: 200 });

  const bucket = env.BUCKET;
  if (!bucket) return Response.json({ error: 'R2 not configured' }, { status: 503 });

  const body = await request.arrayBuffer();
  if (!body || body.byteLength === 0) return Response.json({ error: 'Empty body' }, { status: 400 });

  const prefix = `${JOBS_PREFIX}/${id}`;
  await bucket.put(`${prefix}/final.mp4`, body, { httpMetadata: { contentType: 'video/mp4' } });
  await updateJob(env, id, {
    status: 'completed',
    output_final_mp4: `${prefix}/final.mp4`,
    error: null,
  });

  return Response.json({ ok: true, jobId: id });
}
