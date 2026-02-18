import { getTikTokAuth } from '../../_lib/db.js';
import { getValidAccessToken } from '../../_lib/tiktok.js';

export async function onRequestGet(context) {
  const { env } = context;
  const auth = await getTikTokAuth(env);
  const valid = auth && await getValidAccessToken(env, auth);
  return Response.json({ connected: !!valid, open_id: valid ? auth.open_id : null });
}
