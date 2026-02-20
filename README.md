# NonFictionFooty

Cloudflare Pages app that generates short football story videos and export packages (MP4, caption, hashtags, SRT, cover) for **manual upload**. No TikTok or other platform APIs; you download and post yourself.

**Live:** https://nonfictionfooty-site.pages.dev/

---

## Manual upload workflow

1. **Create** — On `/create`, enter topic, team/player, era/match, tone, duration (30–120s), style. Submit to start a job. You are redirected to `/export/:jobId`.
2. **Processing** — The job runs (script, caption, hashtags, placeholder voiceover/subtitles, placeholder MP4 and cover). Polling or refresh shows status until `completed`.
3. **Export** — On `/export/:jobId` you get:
   - Video preview and **Download MP4**
   - **Copy caption** and **Copy hashtags**
   - **Download SRT** and **Download cover**
   - A short posting checklist
4. **Upload** — Use the downloaded files and caption/hashtags to post manually on your chosen platform (TikTok, Instagram, etc.).

---

## How video is created (current vs real)

**Right now** the app does **not** generate real story videos. For each job it:

- Generates **script, caption, and hashtags** (real content).
- Writes a **placeholder MP4** (~1 KB, single black frame) and a placeholder cover/SRT to R2 so the Export page and “Download MP4” work.

So you get a **working pipeline** (create → process → export → download), but the **MP4 is only a placeholder**, not a narrated story clip.

**To get real story videos** (optional):

1. Set **Cloudflare env vars**: `ELEVENLABS_API_KEY`, `WEBHOOK_SECRET`, `EXTERNAL_VIDEO_WORKER_URL` (see VIDEO.md).
2. Deploy the **video worker** in `video-worker/` to Railway or Render (Node + FFmpeg). It receives audio from your app, builds an MP4, and uploads it via `POST /api/jobs/:id/upload-video`.

Then new jobs will use TTS + the external worker and produce a real MP4 (audio + static image). See **VIDEO.md** and **video-worker/README.md** for step-by-step setup.

---

## Architecture

| Layer | Technology |
|-------|------------|
| Frontend | Vite + React, build → `dist/` |
| Backend | Cloudflare Pages Functions in `/functions` |
| Storage | R2 for job outputs (`jobs/{jobId}/final.mp4`, etc.) |
| Persistence | D1 (jobs table) |

---

## Setup

1. **Clone and install:** `npm install`
2. **D1:** `npx wrangler d1 create nonfictionfooty-db` then apply `schema.sql` (see wrangler.toml for database_id).
3. **R2:** `npx wrangler r2 bucket create nonfictionfooty-media`
4. **Bindings:** In `wrangler.toml`, set D1 `database_id` and ensure R2 bucket name matches.
5. **Build command (Cloudflare Pages):** `npm run build`; output directory: `dist`.

---

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/generate` | Create job; body: `topic`, `teamOrPlayer`, `eraOrMatch`, `tone`, `durationSec`, `stylePreset`; returns `{ jobId }` |
| GET | `/api/jobs` | List jobs |
| GET | `/api/jobs/:id` | Job status + metadata + download URLs (triggers processing if pending) |
| GET | `/api/jobs/:id/download` | Stream MP4 (attachment) |
| GET | `/api/jobs/:id/asset/captions` | captions.json |
| GET | `/api/jobs/:id/asset/srt` | subtitles.srt |
| GET | `/api/jobs/:id/asset/cover` | cover.png |

---

## Smoke test

From the repo root (replace origin with your deployed URL):

```bash
BASE=https://nonfictionfooty-site.pages.dev
# Create job
JOB_ID=$(curl -s -X POST "$BASE/api/generate" -H "Content-Type: application/json" -d '{"topic":"test"}' | jq -r .jobId)
echo "Job: $JOB_ID"
# Poll until completed
while true; do
  STATUS=$(curl -s "$BASE/api/jobs/$JOB_ID" | jq -r .status)
  echo "Status: $STATUS"
  [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ] && break
  sleep 2
done
# Download MP4 and check non-empty
curl -s -o /tmp/out.mp4 "$BASE/api/jobs/$JOB_ID/download"
test -s /tmp/out.mp4 && echo "MP4 OK (non-empty)" || echo "MP4 empty or missing"
# Terms/Privacy 200
curl -s -o /dev/null -w "%{http_code}" "$BASE/terms" && echo " terms"
curl -s -o /dev/null -w "%{http_code}" "$BASE/privacy" && echo " privacy"
```

---

## License

MIT.
