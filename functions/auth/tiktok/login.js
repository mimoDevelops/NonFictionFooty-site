import { getAuthorizeUrl } from '../../lib/tiktok.js';

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const { url } = getAuthorizeUrl(env);
    return Response.redirect(url, 302);
  } catch (err) {
    const message = err.message || 'TikTok auth configuration error';
    return new Response(
      `TikTok login failed: ${message}. Check Cloudflare Pages → Settings → Environment variables and set TIKTOK_CLIENT_KEY (and TIKTOK_CLIENT_SECRET, TIKTOK_REDIRECT_URI).`,
      { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }
}
