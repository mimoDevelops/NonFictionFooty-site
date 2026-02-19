const getBase = () => (import.meta.env.DEV ? '' : '');

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
  generate: () => '/api/generate',
  jobs: () => '/api/jobs',
  job: (id) => `/api/jobs/${id}`,
  jobDownload: (id) => `/api/jobs/${id}/download`,
  jobAsset: (id, type) => `/api/jobs/${id}/asset/${type}`,
};
