import { getAuthorizeUrl } from '../../lib/tiktok.js';

export async function onRequestGet(context) {
  const { env } = context;
  const { url } = getAuthorizeUrl(env);
  return Response.redirect(url, 302);
}
