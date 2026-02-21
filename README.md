# Short-video generator

This project is a **web app** that creates short, scripted videos for social media.

You enter a topic (and optional category, tone, duration). The app generates a **script**, **caption**, **hashtags**, optional **voiceover**, and a **video file**. You **download** the results and upload them yourself to TikTok, Instagram, or wherever—there’s no built-in posting to any platform.

**Tech:** Cloudflare Pages (frontend + API), D1 (database), R2 (storage). Optional API keys and an optional external “video worker” service can be configured for LLM script generation, voiceover, and real MP4 rendering.

---

## When you come back to this project

**Issues we ran into (for next time):**

1. **Cloudflare build failed:** “The symbol 'context' has already been declared” in `functions/api/generate.js`. The request handler parameter is `context` and the JSON body also had a field `context`, so the name collided. **Fix:** Destructure the body field as `context: contextPayload` and use `contextPayload` when building `context_json`.
2. **TTS step failing on Export:** ElevenLabs can fail (invalid key, quota, wrong voice ID). **Fix:** Export page now shows the step error under “tts (failed)”. In `jobProcessor.js`, ElevenLabs errors include the API response detail. Check Cloudflare env: `ELEVENLABS_API_KEY` and optional `ELEVENLABS_VOICE_ID`.
3. **Video worker / Render:** To get real MP4s, deploy `video-worker/` (e.g. Render). Set **Root Directory** to `video-worker` and **Runtime** to **Docker** so FFmpeg is available. Put the service URL in Cloudflare as `EXTERNAL_VIDEO_WORKER_URL` and set `WEBHOOK_SECRET` (same value is sent to the worker in the POST body).
4. **Base URL:** Set `PUBLIC_BASE_URL` in Cloudflare to your real deployment URL so worker callbacks and download links work. Default in code is a placeholder.

**To save and push (shelf this state):**

```bash
cd path/to/nonfictionfooty-site
git add -A
git status
git commit -m "Shelf: short-video generator, step pipeline, LLM/TTS/worker, docs trimmed, shelf notes in README"
git push origin main
```

Use your actual branch if it’s not `main`.

MIT.
