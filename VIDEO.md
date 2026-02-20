# How to get real video in this project

The app currently only creates a **placeholder** MP4 (one black frame) so the flow works end-to-end. Here’s how to add **real** story videos.

---

## What exists today

- **Script + caption + hashtags** — Generated in `functions/lib/jobProcessor.js` (uses `story.js`). Real content.
- **Placeholder MP4** — A minimal valid MP4 (~1 KB) written to R2 so Export and “Download MP4” work. No real visuals or audio.
- **Placeholder SRT and cover** — So all export actions work.

---

## What you need for real video

1. **Voice (TTS)**  
   Turn the script into audio: e.g. ElevenLabs, Play.ht, Google TTS, or another API. Call it from your job processor (or from a separate worker that runs after the script is ready).

2. **Visuals**  
   Decide what appears on screen: e.g. stock clips, images per slide, or a simple template. You may need an image/asset API (e.g. Unsplash, or your own assets).

3. **Video assembly (FFmpeg or API)**  
   Combine audio + images/clips into one MP4.  
   - **Cloudflare Workers cannot run FFmpeg** (no binary, no filesystem).  
   - So you either:
     - Run **FFmpeg elsewhere**: a small server, a queue worker (e.g. on Railway, Render, or a VPS) that gets the job id, fetches script/audio/assets, runs FFmpeg, uploads the result to R2, and updates the job (e.g. via a Cloudflare Function that the worker calls), or  
     - Use a **video API** (e.g. Creatomate, Shotstack, Runway) that accepts script + assets and returns a video URL; then you download that and upload to R2 (or store the URL) and update the job.

4. **Wire it into the job**  
   Once the real MP4 is in R2 at the path the job expects (e.g. `jobs/{jobId}/final.mp4`), the existing Export page and download will serve it. No frontend changes needed.

---

## Minimal “real video” flow (one option)

1. Keep the current **Create → job created in D1 → GET /api/jobs/:id runs the processor** flow.
2. In the processor (or in a separate step triggered by the processor):
   - Generate script (already done).
   - Call a TTS API with the script → get audio URL or bytes.
   - Call an external **video service** (or your own FFmpeg worker) with script + audio (+ optional images). Get back an MP4 URL.
   - Download that MP4 and upload it to R2 at `jobs/{jobId}/final.mp4` (or stream it into R2).
   - Update the job in D1 as `completed` with `output_final_mp4` set (already done by the processor).
3. User sees “completed” and can preview/download the real MP4 on the Export page.

---

## Why no video appears (checklist)

If **no video** shows in the preview or download:

1. **Deploy via Git** so that **Functions** (e.g. `functions/lib/jobProcessor.js`, `functions/api/jobs/[id]/download.js`) are updated. Pushing only `dist/` (e.g. with `wrangler pages deploy dist`) does **not** update the backend.
2. **Create a new job** after deploying. Old jobs still point to the old file in R2 (or none).
3. Check **R2** in the Cloudflare dashboard: bucket `nonfictionfooty-media`, prefix `jobs/{jobId}/`. After a completed job you should see `final.mp4`, `cover.png`, etc.
4. Check the **download URL** in the browser: open DevTools → Network → click the request to `/api/jobs/:id/download`. It should return 200 and `Content-Type: video/mp4`. If you get 404, the job or R2 key is wrong; if 503, R2 isn’t bound.

Once the placeholder MP4 is being written and served correctly, you can swap in a real video pipeline (TTS + assembly) that writes to the same R2 path.
