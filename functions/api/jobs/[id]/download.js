import { getJobById } from '../../../lib/db.js';

export async function onRequestGet(context) {
  const { env, params, request } = context;
  const id = params.id;
  const { job } = await getJobById(env, id);
  if (!job || job.status !== 'completed' || !job.output_final_mp4) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  const bucket = env.BUCKET;
  if (!bucket) return Response.json({ error: 'R2 not configured' }, { status: 503 });
  const obj = await bucket.get(job.output_final_mp4);
  if (!obj) return Response.json({ error: 'File not found' }, { status: 404 });

  const headers = {
    'Content-Type': 'video/mp4',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=3600',
    'Content-Disposition': `inline; filename="nonfictionfooty-${id}.mp4"`,
  };

  const range = request.headers.get('Range');
  if (range && range.startsWith('bytes=')) {
    const buffer = await obj.arrayBuffer();
    const size = buffer.byteLength;
    const [, start, end] = range.replace('bytes=', '').split('-').map((n) => (n === '' ? undefined : parseInt(n, 10)));
    const startByte = Math.min(start ?? 0, Math.max(0, size - 1));
    const endByte = Math.min(end ?? size - 1, size - 1);
    if (startByte <= endByte) {
      const slice = buffer.slice(startByte, endByte + 1);
      headers['Content-Range'] = `bytes ${startByte}-${endByte}/${size}`;
      headers['Content-Length'] = String(slice.byteLength);
      return new Response(slice, { status: 206, headers });
    }
  }

  return new Response(obj.body, { headers });
}
