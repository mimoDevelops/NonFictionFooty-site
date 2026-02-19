/**
 * Serve R2 object at /media/<path> (e.g. /media/draftId/0.jpg).
 * Serve R2 objects at /media/* (e.g. for job assets or legacy paths).
 */

const DEFAULT_CONTENT_TYPE = 'image/jpeg';

export async function onRequestGet(context) {
  const { env, params } = context;
  const pathSegments = params.path;
  const key = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;
  if (!key || key.includes('..')) return new Response('Not Found', { status: 404 });
  const bucket = env.BUCKET;
  if (!bucket) return new Response('Service Unavailable', { status: 503 });
  const object = await bucket.get(key);
  if (!object) return new Response('Not Found', { status: 404 });
  const contentType = object.httpMetadata?.contentType || DEFAULT_CONTENT_TYPE;
  return new Response(object.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
