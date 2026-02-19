import { getJobById } from '../../../../lib/db.js';

const KEY_MAP = { captions: 'output_captions_json', srt: 'output_subtitles_srt', cover: 'output_cover_png' };
const CONTENT_TYPES = { captions: 'application/json', srt: 'application/x-subrip', cover: 'image/png' };

export async function onRequestGet(context) {
  const { env, params } = context;
  const type = params.type;
  const key = KEY_MAP[type];
  if (!key) return Response.json({ error: 'Invalid type' }, { status: 400 });
  const { job } = await getJobById(env, params.id);
  if (!job || job.status !== 'completed' || !job[key]) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  const bucket = env.BUCKET;
  if (!bucket) return Response.json({ error: 'R2 not configured' }, { status: 503 });
  const obj = await bucket.get(job[key]);
  if (!obj) return Response.json({ error: 'File not found' }, { status: 404 });
  const disposition = type === 'cover' ? `attachment; filename="cover-${params.id}.png"` : (type === 'srt' ? `attachment; filename="subtitles-${params.id}.srt"` : 'inline');
  return new Response(obj.body, {
    headers: {
      'Content-Type': CONTENT_TYPES[type],
      'Content-Disposition': disposition,
    },
  });
}
