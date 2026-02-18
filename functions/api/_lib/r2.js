/**
 * R2: upload image from URL, return public key for /media/<key>.
 */

/**
 * Upload a single image from sourceUrl to R2, return key (e.g. "abc123.jpg").
 */
export async function uploadImageFromUrl(env, sourceUrl, key) {
  const bucket = env.BUCKET;
  if (!bucket) throw new Error('R2 bucket not configured');
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const blob = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  await bucket.put(key, blob, { httpMetadata: { contentType } });
  return key;
}

/**
 * Generate a unique key for R2 (draftId + index + extension).
 */
export function makeMediaKey(draftId, index, mimeOrUrl) {
  const ext = mimeToExt(mimeOrUrl) || 'jpg';
  return `${draftId}/${index}.${ext}`;
}

function mimeToExt(mimeOrUrl) {
  if (!mimeOrUrl) return 'jpg';
  if (mimeOrUrl.startsWith('http')) {
    try {
      const path = new URL(mimeOrUrl).pathname;
      const match = path.match(/\.(jpe?g|png|gif|webp)$/i);
      return match ? match[1].toLowerCase() : 'jpg';
    } catch { return 'jpg'; }
  }
  const map = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' };
  return map[mimeOrUrl] || 'jpg';
}
