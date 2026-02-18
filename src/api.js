const getBase = () => {
  if (import.meta.env.DEV) return '';
  return ''; // same origin on Pages
};

export const api = {
  async get(path) {
    const r = await fetch(getBase() + path, { credentials: 'include' });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.statusText);
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(getBase() + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.statusText);
    return r.json();
  },
};

export const routes = {
  health: () => '/api/health',
  drafts: () => '/api/drafts',
  draft: (id) => `/api/drafts/${id}`,
  approve: (id) => `/api/drafts/${id}/approve`,
  regenerateImages: (id) => `/api/drafts/${id}/regenerate-images`,
  upload: (id) => `/api/drafts/${id}/upload`,
  authStatus: () => '/api/auth/status',
  tiktokLogin: () => '/auth/tiktok/login',
  media: (key) => `/media/${key}`,
};
