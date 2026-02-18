/**
 * Fetch rights-cleared images: Wikimedia Commons first, optional Unsplash.
 * Returns array of { url, license, attribution, source }.
 */

const WIKIMEDIA_API = 'https://commons.wikimedia.org/w/api.php';

export async function fetchWikimediaImages(query, count = 10) {
  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: query,
    srnamespace: '6', // File namespace
    srlimit: String(count),
    format: 'json',
    origin: '*',
  });
  const res = await fetch(`${WIKIMEDIA_API}?${params}`);
  const data = await res.json();
  const titles = (data.query?.search || []).map(s => s.title);
  if (titles.length === 0) return [];
  const imageInfoParams = new URLSearchParams({
    action: 'query',
    titles: titles.join('|'),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    format: 'json',
    origin: '*',
  });
  const infoRes = await fetch(`${WIKIMEDIA_API}?${imageInfoParams}`);
  const infoData = await infoRes.json();
  const pages = infoData.query?.pages || {};
  const results = [];
  for (const page of Object.values(pages)) {
    const ii = page.imageinfo?.[0];
    if (!ii?.url) continue;
    const ext = ii.extmetadata || {};
    const license = ext.LicenseShortName?.value || ext.License?.value || 'Unknown';
    const author = ext.Artist?.value || ext.Credit?.value || 'Unknown';
    results.push({
      url: ii.url,
      license: license.replace(/<[^>]+>/g, '').trim(),
      attribution: author.replace(/<[^>]+>/g, '').trim(),
      source: 'wikimedia',
    });
  }
  return results;
}

export async function fetchUnsplashImages(env, query, count = 5) {
  const key = env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
    { headers: { 'Authorization': `Client-ID ${key}` } }
  );
  const data = await res.json();
  const results = (data.results || []).map(r => ({
    url: r.urls?.regular || r.urls?.full,
    license: 'Unsplash License',
    attribution: r.user?.name ? `Photo by ${r.user.name} on Unsplash` : 'Unsplash',
    source: 'unsplash',
  })).filter(x => x.url);
  return results;
}

/**
 * Get image candidates for a story: Wikimedia first, then optionally Unsplash.
 */
export async function getImageCandidates(env, headlineOrQuery, count = 10, useUnsplash = false) {
  const query = headlineOrQuery || 'soccer football';
  const wikimedia = await fetchWikimediaImages(query, count);
  let combined = wikimedia;
  if (useUnsplash && env.UNSPLASH_ACCESS_KEY) {
    const unsplash = await fetchUnsplashImages(env, query, 5);
    combined = [...wikimedia, ...unsplash].slice(0, count);
  }
  return combined;
}
