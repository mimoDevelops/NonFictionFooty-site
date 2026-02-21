# NonFictionFooty — Project context for rejuvenation

Use this document as full context when giving a “rejuvenate this project” or similar prompt to an AI or team.

---

## 1. What the project is

**Name:** NonFictionFooty  
**Live URL:** https://nonfictionfooty-site.pages.dev/

**Purpose:** A web app that helps users create **short football/soccer story videos** for **manual upload** to social platforms (TikTok, Instagram, etc.). There is **no TikTok (or other) API integration** — users download the video, caption, hashtags, SRT, and cover image, then post manually.

**One-line pitch:** Create a job with a topic → get a story script, caption, hashtags, and an MP4 (plus SRT and cover) → export and upload elsewhere yourself.

---

## 2. Current status (what works vs what’s placeholder)

**Working end-to-end:**
- User flow: Create → Processing → Export (with polling).
- **Script + caption + hashtags** are generated (rule-based, not LLM).
- **Placeholder assets** are written to R2: minimal playable MP4 (~1 KB, one black frame), minimal PNG cover, SRT, captions.json.
- Export page: video preview, Download MP4, Copy caption/hashtags, Download SRT/cover, checklist.
- Library lists all jobs with links to Export.
- Policy pages: Terms, Privacy, About, App Review. Footer with these links on all pages.
- Deploy: Cloudflare Pages (Git push → build `npm run build` → output `dist` + Functions from `/functions`).

**Optional / not required for basic flow:**
- **Real video pipeline:** If env vars are set (`ELEVENLABS_API_KEY`, `WEBHOOK_SECRET`, `EXTERNAL_VIDEO_WORKER_URL`), the app can call ElevenLabs TTS, store audio in R2, and invoke an **external video worker** (Node + FFmpeg in `video-worker/`) that builds a real MP4 (audio + static image) and POSTs it to `POST /api/jobs/:id/upload-video`. Without these, every job gets the placeholder MP4 only.
- **Story content:** Currently **rule-based** in `functions/lib/story.js` (templates + slide count). No LLM; slides are generic “Part 1, Part 2…” placeholder text. README and VIDEO.md say “replace with LLM later.”

**Known limitations / tech constraints:**
- Cloudflare Workers **cannot run FFmpeg**. Real video assembly must happen in the optional `video-worker` (Railway/Render) or another external service.
- BASE_URL is hardcoded in `functions/api/jobs/[id].js` and `functions/lib/jobProcessor.js` as `https://nonfictionfooty-site.pages.dev` (affects download URLs and webhook URLs when using the video worker).

---

## 3. Tech stack and hosting

| Layer        | Technology |
|-------------|------------|
| Frontend    | Vite 5, React 18, React Router 6. Build → `dist/`. |
| Backend     | Cloudflare Pages Functions in `/functions` (serverless). |
| Database    | Cloudflare D1 (SQLite). Single table: `jobs`. |
| Storage     | Cloudflare R2. Prefix `jobs/{jobId}/` for each job’s assets. |
| Optional    | External Node service in `video-worker/` (Express, FFmpeg) for real MP4; deploy to Railway/Render. |

**Config files:**
- `wrangler.toml` — Pages build output dir `dist`, D1 binding `DB`, R2 binding `BUCKET`, compatibility_date 2024-01-01.
- `package.json` — Scripts: `dev`, `build`, `preview`, `cf-typegen`, `set-d1-id`. No backend in npm scripts; backend is entirely in `/functions`.

---

## 4. Repo structure (what’s what)

```
nonfictionfooty-site/
├── public/                    # Static assets (copied to dist)
│   ├── _headers               # CSP etc. for Cloudflare Pages
│   └── tiktokoYqResEQScW2wKbWiK9U0XDU8FCYHgxe.txt  # TikTok domain verification
├── src/                       # Frontend (Vite/React)
│   ├── App.jsx                # Routes: /, /create, /library, /export/:jobId, /terms, /privacy, /about, /app-review
│   ├── Layout.jsx             # Header (Home, Create, Library) + footer (Terms, Privacy, About, App Review)
│   ├── api.js                 # api.get/post + routes (generate, jobs, job(id), jobDownload, jobAsset)
│   ├── ToastContext.jsx       # Toasts (success/error)
│   ├── main.jsx, index.css
│   └── pages/
│       ├── Homepage.jsx        # Marketing + CTA to Create
│       ├── Create.jsx         # Form (topic, team/player, era/match, tone, duration, style) → POST /api/generate → navigate to /export/:jobId
│       ├── Library.jsx        # GET /api/jobs → list of jobs with links to /export/:id
│       ├── Export.jsx         # GET /api/jobs/:id (polling if pending), then video preview + Download MP4, Copy caption/hashtags, SRT, cover
│       ├── Terms.jsx, Privacy.jsx, About.jsx, AppReview.jsx
├── functions/                 # Cloudflare Pages Functions (backend)
│   ├── api/
│   │   ├── health.js
│   │   ├── generate.js        # POST: create job in D1, return { jobId }
│   │   ├── drafts/index.js   # GET: stub { drafts: [] } (legacy)
│   │   ├── jobs/
│   │   │   ├── index.js       # GET: list jobs
│   │   │   └── [id].js        # GET: job by id; if pending, runs runJob() then returns formatted job
│   │   │   ├── download.js   # GET: stream final.mp4 from R2 (with Range support)
│   │   │   ├── upload-video.js # POST: body = MP4 bytes, Auth Bearer WEBHOOK_SECRET; write R2, mark job completed
│   │   │   └── asset/[type].js # GET: serve captions, srt, cover, or audio from R2
│   ├── lib/
│   │   ├── db.js              # D1: getDb, listJobs, getJobById, insertJob, updateJob; rowToJob
│   │   ├── jobProcessor.js    # runJob: story draft → caption/hashtags/script, R2 writes (captions.json, srt, cover, audio if TTS, placeholder or external video)
│   │   ├── story.js           # generateStoryDraft(topic, tone, minSlides, maxSlides) — rule-based, no LLM
│   │   ├── r2.js, images.js   # Helpers (media/r2)
│   ├── media/[[path]].js      # Media route (if used)
├── video-worker/              # Optional external service (Node + FFmpeg)
│   ├── server.js              # POST /: receives jobId, audioUrl, uploadUrl, webhookSecret; fetch audio, ffmpeg image+audio→mp4, POST mp4 to uploadUrl
│   ├── package.json, Dockerfile, README.md
├── schema.sql                 # D1: jobs table (id, created_at, status, topic, team_or_player, era_or_match, tone, duration_sec, style_preset, script_json, caption, hashtags, output_*, error)
├── wrangler.toml
├── index.html, vite.config.js
├── README.md, VIDEO.md, NEXT_STEPS.md, DEPLOY-STEPS.md
└── PROJECT-CONTEXT.md         # This file
```

---

## 5. Data model

**D1 — single table `jobs`:**
- `id` (TEXT PK), `created_at`, `status` (pending | processing | completed | failed)
- Inputs: `topic`, `team_or_player`, `era_or_match`, `tone`, `duration_sec`, `style_preset`
- Outputs (paths in R2): `output_final_mp4`, `output_captions_json`, `output_subtitles_srt`, `output_cover_png`
- Content: `script_json`, `caption`, `hashtags`, `error`

**R2 — prefix `jobs/{jobId}/`:**
- `final.mp4` — video (placeholder or real)
- `captions.json`, `subtitles.srt`, `cover.png`
- `audio.mp3` — only if TTS ran (ElevenLabs)

---

## 6. API (summary)

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| POST | /api/generate | Body: topic, teamOrPlayer, eraOrMatch, tone, durationSec, stylePreset. Returns { jobId }. |
| GET | /api/jobs | List jobs (for Library). |
| GET | /api/jobs/:id | Get job; if status pending, runs job processor then returns. Returns jobId, status, downloadUrls (when completed), caption, hashtags, etc. |
| GET | /api/jobs/:id/download | Stream MP4 from R2 (Range supported). |
| GET | /api/jobs/:id/asset/:type | type = captions | srt | cover | audio. Serves file from R2. |
| POST | /api/jobs/:id/upload-video | Body: raw MP4. Header: Authorization: Bearer &lt;WEBHOOK_SECRET&gt;. Writes to R2, sets job completed. |

---

## 7. Environment variables (Cloudflare Pages)

- **DB / BUCKET** — Bound via wrangler.toml (D1 database_id, R2 bucket_name).
- **Optional for real video:**  
  `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` (optional), `WEBHOOK_SECRET`, `EXTERNAL_VIDEO_WORKER_URL` (full URL of video-worker, no trailing slash).

---

## 8. User flows (concrete)

1. **Create a video**
   - User opens `/create`, fills form (topic required; team/player, era/match, tone, duration 30–120s, style).
   - Submit → `POST /api/generate` → response `{ jobId }` → redirect to `/export/:jobId`.
   - Toast: “Job started.”

2. **Export page**
   - `GET /api/jobs/:id`. If job is pending, the handler runs the job processor (sync), then returns.
   - If status is `completed`: show video preview (src = download URL), Download MP4, Copy caption, Copy hashtags, Download SRT, Download cover, checklist.
   - If status is `processing`: show “Processing…” and poll every 2s until completed/failed.
   - If failed or error: show error message.

3. **Library**
   - `GET /api/jobs` → list of jobs; each row links to `/export/:id` and shows topic, status, created_at.

4. **Real video (when configured)**
   - Processor generates script → ElevenLabs TTS → audio saved to R2 → POST to external video worker with jobId, audioUrl, uploadUrl, webhookSecret.
   - Job left in `processing`. Video worker builds MP4, POSTs to `/api/jobs/:id/upload-video` with Bearer secret.
   - Upload handler writes MP4 to R2, sets job `completed`. Frontend polling sees completion and shows real video.

---

## 9. What’s intentionally minimal or placeholder

- **Script/story:** Rule-based templates in `story.js`; no LLM. Slides are “Part 1”, “Part 2” style placeholders.
- **Default video:** Placeholder MP4 (single black frame) so the pipeline and Export UI work without any external service.
- **Visuals:** No stock footage or dynamic images; video worker uses a single static black image + audio.
- **Auth:** No user accounts; jobs are public by ID (anyone with link can view export).
- **TikTok:** Only a verification file in `public/` for domain verification; no OAuth or posting API.

---

## 10. Deployment and ops

- **Cloudflare:** Connect GitHub repo to Pages; build command `npm run build`, output `dist`. Functions are auto-deployed from `/functions`. D1 and R2 bound per wrangler.toml (and/or dashboard).
- **Video worker:** Deploy `video-worker/` separately (e.g. Railway/Render) with Dockerfile (Node + FFmpeg); set `EXTERNAL_VIDEO_WORKER_URL` and `WEBHOOK_SECRET` in Cloudflare.
- **Docs:** README (overview, setup, API, smoke test), VIDEO.md (real video flow, env vars), DEPLOY-STEPS.md (Git + wrangler), NEXT_STEPS.md (schema, R2, verification file).

---

## 11. Good candidates for “rejuvenation”

- Replace rule-based **story.js** with an **LLM** (e.g. OpenAI/Anthropic) to generate real narrative script and slides from topic/team/era/tone.
- Improve **default video** when no external worker: e.g. static image + TTS-only (if ElevenLabs is set) and a minimal slideshow-style MP4 built in Workers (if possible) or keep placeholder but make it clearly “preview only.”
- **Custom domain:** Make BASE_URL configurable (env or wrangler) so download and webhook URLs work for custom domains.
- **UX:** Clearer “placeholder vs real video” messaging on Export; optional “Request real video” if only placeholder is available.
- **Video worker:** Support custom images per job, or simple templates (e.g. team colours, logo).
- **Security:** Optional auth or short-lived signed URLs for export links; rate limiting on `/api/generate`.
- **Monitoring:** Logging/alerting for failed jobs, TTS/worker errors; optional dead-letter or retry for upload-video.

---

*End of project context. Use this plus the codebase when giving your next “rejuvenate” or refactor prompt.*
