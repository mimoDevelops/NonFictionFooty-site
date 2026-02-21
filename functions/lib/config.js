/**
 * Env-driven config. Cloudflare Pages injects env from dashboard and wrangler bindings.
 */
const DEFAULT_BASE_URL = 'https://nonfictionfooty-site.pages.dev';

/**
 * Public origin for absolute URLs (download links, webhook callbacks).
 * Set PUBLIC_BASE_URL in Cloudflare Pages → Settings → Environment variables.
 */
export function getBaseUrl(env) {
  const url = env.PUBLIC_BASE_URL || env.BASE_URL || DEFAULT_BASE_URL;
  return String(url).replace(/\/$/, '');
}
