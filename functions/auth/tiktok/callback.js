import { exchangeCodeForTokens } from '../../lib/tiktok.js';
import { upsertTikTokAuth } from '../../lib/db.js';

const FRONTEND_ORIGIN = 'https://nonfictionfooty-site.pages.dev';

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  if (error) {
    return Response.redirect(`${FRONTEND_ORIGIN}/?auth_error=${encodeURIComponent(error)}`, 302);
  }
  if (!code) {
    return Response.redirect(`${FRONTEND_ORIGIN}/?auth_error=no_code`, 302);
  }
  try {
    const tokens = await exchangeCodeForTokens(env, code);
    await upsertTikTokAuth(env, tokens);
    return Response.redirect(`${FRONTEND_ORIGIN}/?auth=success`, 302);
  } catch (err) {
    return Response.redirect(`${FRONTEND_ORIGIN}/?auth_error=${encodeURIComponent(err.message)}`, 302);
  }
}
