# Code paths and migration plan

## Step 1: Current code paths (job creation and processing)

### Create job
- **Frontend:** `Create.jsx` → `api.post(routes.generate(), { topic, teamOrPlayer, eraOrMatch, tone, durationSec, stylePreset })` → `navigate(/export/:jobId)`.
- **Backend:** `functions/api/generate.js` → `onRequestPost`: parse JSON body, `crypto.randomUUID()` for id, `insertJob(env, job)` with status `pending`. Returns `{ jobId }`. No validation/rate limit today.

### Process job (triggered by GET job)
- **Frontend:** `Export.jsx` → `api.get(routes.job(jobId))` (and polls every 2s if status `pending`).
- **Backend:** `functions/api/jobs/[id].js` → `onRequestGet`: `getJobById(env, id)`. If `job.status === 'pending'`, calls `runJob(env, id, job)` then `getJobById` again and `formatJobResponse(env, updated)`. Otherwise returns `formatJobResponse(env, job)`. `formatJobResponse` uses hardcoded `BASE_URL` to build download URLs.

### runJob (current)
- **File:** `functions/lib/jobProcessor.js`.
- **Flow:** Sets status `processing`; calls `generateStoryDraft(topic, tone, 3, 10)` from **story.js** (rule-based); writes captions.json, subtitles.srt, cover.png to R2; optionally TTS (ElevenLabs) → audio.mp3; if external worker configured, POSTs to worker and returns (job stays processing); else writes placeholder final.mp4 and sets status `completed` with all output_* fields.
- **story.js:** `generateStoryDraft(nicheSeed, tone, minSlides, maxSlides)` — templates + hash-based pick; returns `{ headline, story_json, sources_json }`. No LLM. Soccer-oriented subject slug.

### Data and R2
- **db.js:** `getDb(env)` → `env.DB`. `listJobs`, `getJobById`, `insertJob`, `updateJob`. `updateJob` allows only a fixed set of columns. `rowToJob` maps row to job object.
- **R2:** jobProcessor uses `env.BUCKET` directly. Prefix `jobs/{jobId}/`. Keys: captions.json, subtitles.srt, cover.png, audio.mp3, final.mp4.
- **r2.js:** Used for media upload from URL (e.g. images); not used by jobProcessor.

### Upload-video (external worker callback)
- **functions/api/jobs/[id]/upload-video.js:** POST, `Authorization: Bearer WEBHOOK_SECRET`; reads body to R2 `jobs/{id}/final.mp4`, `updateJob` status `completed` and `output_final_mp4`. No BASE_URL in this file.

### Hardcoded BASE_URL
- `functions/api/jobs/[id].js` line 4: `const BASE_URL = 'https://nonfictionfooty-site.pages.dev';` used in `formatJobResponse`.
- `functions/lib/jobProcessor.js` line 13: `const BASE_URL = 'https://nonfictionfooty-site.pages.dev';` used for audioUrl and uploadUrl when calling external worker.

### Env in Pages Functions
- Cloudflare Pages injects env from dashboard (Environment variables) and from wrangler.toml bindings. Functions receive `context.env`; e.g. `env.DB`, `env.BUCKET`, `env.ELEVENLABS_API_KEY`, `env.WEBHOOK_SECRET`, `env.EXTERNAL_VIDEO_WORKER_URL`. No PUBLIC_BASE_URL today.

---

## Step 2: D1 schema additions (minimal, backwards compatible)

**Principle:** Add new columns only; keep all existing columns and semantics so existing jobs continue to work.

**New columns on `jobs`:**
- `category` TEXT — optional (soccer, motivation, history, finance, custom). Nullable; existing rows stay null.
- `steps_json` TEXT — JSON array of step state: `[{ "name": "generate_content", "status": "completed"|"running"|"failed", "attempts": 1, "started_at": "ISO", "finished_at": "ISO"|null, "error": null|"..." }]`. Nullable; existing rows stay null (processor will treat null as empty steps).
- `context_json` TEXT — optional JSON for generic context (subjectA, subjectB, timeframe, etc.) for LLM. Nullable.

**No new tables for v1** — step state in `steps_json` keeps migration simple and queryable (status still on jobs; UI can show step progress from steps_json). Optional future: `job_assets` table for richer tracking.

**Migration SQL (run after schema.sql for existing DBs):**
See `migrations/001_step_state_and_category.sql`.

**Updated schema.sql:** Include new columns in CREATE TABLE so new installs get them; use defaults so existing INSERTs still work.
