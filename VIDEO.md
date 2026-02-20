# Real story video in this project

The app can generate **real** story videos (script → TTS → FFmpeg → MP4) when you add an ElevenLabs API key and deploy the optional **video worker**.

---

## What’s implemented

1. **Script + caption + hashtags** — Generated in the job processor (real content).
2. **TTS (ElevenLabs)** — If `ELEVENLABS_API_KEY` is set, the processor turns the script into audio and stores it in R2 at `jobs/{jobId}/audio.mp3`.
3. **Upload endpoint** — `POST /api/jobs/:id/upload-video` accepts a raw MP4 body and writes it to R2 at `jobs/{jobId}/final.mp4`, then marks the job completed. Secured with `Authorization: Bearer <WEBHOOK_SECRET>`.
4. **External video worker** — A small Node app in `video-worker/` that:
   - Receives `{ jobId, audioUrl, uploadUrl, webhookSecret }` from the Cloudflare processor,
   - Downloads audio from `audioUrl`,
   - Runs FFmpeg (static image + audio → MP4),
   - POSTs the MP4 to `uploadUrl` with the secret.
5. When **both** the video worker URL and webhook secret are set, the processor **does not** write the placeholder MP4; it calls the video worker and leaves the job in **processing** until the worker uploads the real MP4.

---

## Enable real video (steps)

### 1. Cloudflare Pages env vars

In **Cloudflare Dashboard** → **Pages** → your project → **Settings** → **Environment variables** (Production and Preview if you want):

| Variable | Required | Description |
|----------|----------|-------------|
| `ELEVENLABS_API_KEY` | Yes (for real video) | Your [ElevenLabs](https://elevenlabs.io) API key. |
| `ELEVENLABS_VOICE_ID` | No | Voice ID (default: Rachel). Find in ElevenLabs dashboard. |
| `WEBHOOK_SECRET` | Yes (for real video) | A long random string (e.g. `openssl rand -hex 32`). Used to secure the upload endpoint. |
| `EXTERNAL_VIDEO_WORKER_URL` | Yes (for real video) | Full URL of your video worker, e.g. `https://your-app.up.railway.app` (no trailing slash). |

### 2. Deploy the video worker

The worker lives in **`video-worker/`** in this repo.

- **Railway:** New project → deploy from this repo, set **Root Directory** to `video-worker`, use the **Dockerfile** in `video-worker/Dockerfile` so FFmpeg is installed. Copy the public URL.
- **Render:** New Web Service → root `video-worker`, build `npm install`, start `npm start`. Use a **Docker** runtime with the provided Dockerfile so FFmpeg is available. Copy the service URL.
- **Docker (any host):** `cd video-worker && docker build -t video-worker . && docker run -p 3000:3000 video-worker`

See **`video-worker/README.md`** for detailed deploy steps.

### 3. Set the worker URL and secret in Cloudflare

- `EXTERNAL_VIDEO_WORKER_URL` = the URL you got above (e.g. `https://xxx.up.railway.app`).
- `WEBHOOK_SECRET` = the same secret you’ll pass to the worker (the processor sends it in the POST body; the worker uses it when calling the upload endpoint). So pick one secret and set it in Cloudflare; the worker receives it in the payload and uses it for `Authorization: Bearer <secret>`.

Redeploy the Cloudflare app (or trigger a new build) so the new env vars are applied.

### 4. Test

Create a new job from the app. The job should go to **processing**, then (after the video worker runs) to **completed**. Open the Export page: you should see and download the real MP4 (audio + static image).

---

## Flow summary

1. User creates a job → processor runs.
2. Processor generates script, then:
   - If `ELEVENLABS_API_KEY` is set: calls ElevenLabs TTS, stores audio at `jobs/{id}/audio.mp3`.
   - If `EXTERNAL_VIDEO_WORKER_URL` and `WEBHOOK_SECRET` are set **and** audio was stored: does **not** write the placeholder MP4; updates job with caption/SRT/cover; POSTs to the video worker with `jobId`, `audioUrl`, `uploadUrl`, `webhookSecret`; returns (job stays **processing**).
   - Else: writes the placeholder MP4 and marks job **completed** (current behaviour).
3. Video worker: downloads audio from `audioUrl`, runs FFmpeg, POSTs MP4 to `uploadUrl` with `Authorization: Bearer webhookSecret`.
4. Upload endpoint: writes MP4 to R2, marks job **completed**.
5. Frontend keeps polling `GET /api/jobs/:id` and shows the video when status is **completed**.

---

## Placeholder-only (no real video)

If you **don’t** set `ELEVENLABS_API_KEY` and/or `EXTERNAL_VIDEO_WORKER_URL`, the app keeps generating only the **placeholder** MP4 (one black frame) so the flow still works end-to-end.

---

## Why no video appears (checklist)

1. **Deploy via Git** so Cloudflare deploys both frontend and **Functions**.
2. **Create a new job** after deploying; old jobs keep their existing R2 files.
3. For **real** video: set all four env vars and deploy the video worker; ensure the worker URL is reachable from the internet and has FFmpeg (use the Dockerfile).
4. Check R2: bucket `nonfictionfooty-media`, prefix `jobs/{jobId}/`. You should see `final.mp4` (and `audio.mp3` if TTS ran).
5. Check the download request in DevTools (Network): `/api/jobs/:id/download` should return 200 and `Content-Type: video/mp4`.
