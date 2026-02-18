/**
 * TikTok OAuth and Content Posting API.
 * - OAuth: authorize URL, token exchange, refresh.
 * - Content: POST /v2/post/publish/content/init/ with PULL_FROM_URL, PHOTO.
 */

const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/oauth/authorize/';
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const TIKTOK_REFRESH_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const TIKTOK_CONTENT_INIT_URL = 'https://open.tiktokapis.com/v2/post/publish/content/init/';
const MAX_SLIDES = 35;

export function getAuthorizeUrl(env) {
  const clientKey = env.TIKTOK_CLIENT_KEY;
  const redirectUri = env.TIKTOK_REDIRECT_URI || 'https://nonfictionfooty-site.pages.dev/auth/tiktok/callback';
  if (!clientKey) throw new Error('TIKTOK_CLIENT_KEY not set');
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_key: clientKey,
    scope: 'user.info.basic,video.upload,video.publish',
    response_type: 'code',
    redirect_uri: redirectUri,
    state,
  });
  return { url: `${TIKTOK_AUTH_URL}?${params.toString()}`, state };
}

export async function exchangeCodeForTokens(env, code) {
  const clientKey = env.TIKTOK_CLIENT_KEY;
  const clientSecret = env.TIKTOK_CLIENT_SECRET;
  const redirectUri = env.TIKTOK_REDIRECT_URI || 'https://nonfictionfooty-site.pages.dev/auth/tiktok/callback';
  if (!clientKey || !clientSecret) throw new Error('TikTok credentials not set');
  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  const expiresAt = new Date(Date.now() + (data.expires_in * 1000)).toISOString();
  return {
    open_id: data.data.open_id,
    access_token: data.data.access_token,
    refresh_token: data.data.refresh_token,
    expires_at: expiresAt,
  };
}

export async function refreshAccessToken(env, refreshToken) {
  const clientKey = env.TIKTOK_CLIENT_KEY;
  const clientSecret = env.TIKTOK_CLIENT_SECRET;
  const res = await fetch(TIKTOK_REFRESH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  const expiresAt = new Date(Date.now() + (data.data.expires_in * 1000)).toISOString();
  return {
    access_token: data.data.access_token,
    refresh_token: data.data.refresh_token ?? refreshToken,
    expires_at: expiresAt,
  };
}

export async function getValidAccessToken(env, authRow) {
  if (!authRow) return null;
  const expiresAt = new Date(authRow.expires_at).getTime();
  if (expiresAt > Date.now() + 60 * 1000) return authRow.access_token;
  const refreshed = await refreshAccessToken(env, authRow.refresh_token);
  const { upsertTikTokAuth } = await import('./db.js');
  await upsertTikTokAuth(env, { open_id: authRow.open_id, ...refreshed });
  return refreshed.access_token;
}

/**
 * Clamp N to min_slides..max_slides and <= 35.
 */
export function chooseSlideCount(minSlides, maxSlides) {
  const min = Math.max(1, Math.min(minSlides, MAX_SLIDES));
  const max = Math.min(MAX_SLIDES, Math.max(min, maxSlides));
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Create TikTok PHOTO draft via PULL_FROM_URL.
 * photoUrls: array of HTTPS URLs under verified prefix (e.g. https://nonfictionfooty-site.pages.dev/media/xxx)
 * caption, privacy_level, etc.
 */
export async function createTikTokPhotoDraft(env, { photoUrls, caption, accessToken }) {
  if (!photoUrls || photoUrls.length === 0) throw new Error('At least one photo URL required');
  if (photoUrls.length > MAX_SLIDES) throw new Error(`At most ${MAX_SLIDES} slides allowed`);
  const body = {
    post_info: {
      title: caption || 'NonFictionFooty',
      description: caption || '',
    },
    source_info: {
      source: 'PULL_FROM_URL',
      photo_images: photoUrls,
      photo_cover_index: 0,
    },
    post_mode: 'MEDIA_UPLOAD',
    media_type: 'PHOTO',
  };
  const res = await fetch(TIKTOK_CONTENT_INIT_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.message?.message || data.error?.message || JSON.stringify(data.error));
  const publishId = data.data?.publish_id;
  if (!publishId) throw new Error('No publish_id in response');
  return { publish_id: publishId };
}
