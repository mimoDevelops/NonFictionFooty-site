# NonFictionFooty video worker

Small Node service that builds a real MP4 from audio + a static image using FFmpeg, then uploads it to your Cloudflare app.

Deploy to **Railway**, **Render**, or any host with Node 18+ and FFmpeg.

## What it does

1. Receives `POST /` with `{ jobId, audioUrl, uploadUrl, webhookSecret }` (sent by your Cloudflare job processor).
2. Downloads audio from `audioUrl`.
3. Runs FFmpeg: static image + audio → MP4.
4. POSTs the MP4 to `uploadUrl` with `Authorization: Bearer <webhookSecret>`.

Your app then marks the job completed and serves the video.

## Deploy

### Railway

1. Create a new project, connect this repo (or the `video-worker` folder).
2. Root directory: `video-worker` (or deploy from inside `video-worker`).
3. Add **FFmpeg**: in Railway, add a **Nixpacks** config or use the Dockerfile. Easiest: use the **Dockerfile** and set **Dockerfile path** to `video-worker/Dockerfile` if deploying from repo root.
4. Set `PORT` if needed (Railway sets it automatically).
5. Copy the public URL (e.g. `https://xxx.up.railway.app`).

### Render

1. New **Web Service**, connect repo.
2. Root directory: `video-worker`.
3. Build: `npm install`.
4. Start: `npm start`.
5. Add **FFmpeg**: in **Build Command** use a script that installs FFmpeg, or use a **Docker** environment and the provided Dockerfile.
6. Copy the service URL.

### Docker (local or any host)

```bash
cd video-worker
docker build -t video-worker .
docker run -p 3000:3000 video-worker
```

## Cloudflare env vars

In **Cloudflare Pages** → your project → **Settings** → **Environment variables**, set:

| Variable | Description |
|----------|-------------|
| `ELEVENLABS_API_KEY` | Your ElevenLabs API key (for TTS). |
| `ELEVENLABS_VOICE_ID` | (Optional) Voice ID; default is Rachel. |
| `WEBHOOK_SECRET` | A long random string; same value used by the video worker when calling upload. |
| `EXTERNAL_VIDEO_WORKER_URL` | Full URL of this worker, e.g. `https://xxx.up.railway.app` (no trailing slash). |

When all four are set, new jobs will: generate script → TTS → store audio → call this worker → worker builds MP4 and uploads → job completes with real video.
