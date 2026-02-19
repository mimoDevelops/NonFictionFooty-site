import { listJobs } from '../../lib/db.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10) || 50));
  const { jobs } = await listJobs(env, { limit });
  return Response.json({ jobs });
}
