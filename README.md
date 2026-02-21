# NonFictionFooty

Cloudflare Pages app: **general short-video generator** (any topic — soccer, finance, history, motivation, tech, etc.). Produces export packages (MP4, caption, hashtags, SRT, cover) for **manual upload**. No TikTok or Instagram APIs; you download and post yourself.

**Live:** https://nonfictionfooty-site.pages.dev/

---

## Manual upload workflow

1. **Create** — On `/create`, enter **topic** (required), **category** (Soccer, Motivation, History, Finance, Tech, Custom), optional context fields, tone, duration (30–120s), style. Submit to start a job; you are redirected to `/export/:jobId`.
2. **Processing** — Resumable pipeline: **generate_content** (LLM or rule-based) → **tts** (optional) → **render** (external worker or placeholder). Export page shows step progress; polling continues until `completed`.
3. **Export** — On `/export/:jobId`: video preview, **Download MP4**, **Copy caption**, **Copy hashtags**, **Download SRT**, **Download cover**, posting checklist.
4. **Upload** — Use the downloaded assets to post manually on your chosen platform (TikTok, Instagram, etc.).

---

## How video is created (pipeline)

- **Content:** With `LLM_API_KEY` set, an LLM generates script, beats, caption, hashtags. Otherwise a rule-based fallback is used (soccer-friendly templates).
- **TTS (optional):** With `ELEVENLABS_API_KEY`, voiceover is generated and stored as `audio.mp3`.
- **Render:** If `EXTERNAL_VIDEO_WORKER_URL` is set and audio exists, the external worker (Node + FFmpeg) builds the MP4 and uploads via `POST /api/jobs/:id/upload-video`. Otherwise a **placeholder MP4** (single frame) is written so Export and “Download MP4” still work.

**To get full videos:** Set `PUBLIC_BASE_URL`, `LLM_API_KEY`, `ELEVENLABS_API_KEY`, `WEBHOOK_SECRET`, `EXTERNAL_VIDEO_WORKER_URL` (see `.env.example` and VIDEO.md). Deploy the **video-worker** in `video-worker/` (e.g. Railway or Render). See **VIDEO.md** and **video-worker/README.md**.

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

## Environment (see .env.example)

| Variable | Purpose |
|----------|---------|
| `PUBLIC_BASE_URL` | Base URL for webhooks/worker callbacks (default used if unset) |
| `LLM_API_KEY` | OpenAI-compatible API key for script/beats/caption/hashtags; optional `LLM_API_BASE`, `LLM_MODEL` |
| `ELEVENLABS_API_KEY` | TTS; if unset, no audio |
| `WEBHOOK_SECRET` | Protects `POST /api/jobs/:id/upload-video` |
| `EXTERNAL_VIDEO_WORKER_URL` | External renderer; if unset, placeholder MP4 |

---

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/generate` | Create job; body: `topic` (required), `category`, `teamOrPlayer`, `eraOrMatch`, `tone`, `durationSec`, `stylePreset`, optional `context`; returns `{ jobId }` |
| GET | `/api/jobs` | List jobs |
| GET | `/api/jobs/:id` | Job status, `steps`, metadata, download URLs (triggers processing if pending) |
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
