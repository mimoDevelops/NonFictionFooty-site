# Next steps (TikTok-API-free)

1. **Apply schema** — New DB:  
   `npx wrangler d1 execute nonfictionfooty-db --remote --file=schema.sql`  
   Existing DB: run `migrations/001_step_state_and_category.sql` to add `category`, `steps_json`, `context_json`.

2. **R2** — Ensure the bucket `nonfictionfooty-media` exists and is bound as `BUCKET` in wrangler.toml / Pages settings.

3. **Env vars** — In **Cloudflare Dashboard** → your Pages project → **Settings** → **Environment variables**, add the variables below. You are **not** setting placeholders: these are real config values. Leave a variable **empty** if you don’t use that feature; the app will fall back (e.g. no LLM → rule-based script, no worker URL → placeholder MP4).

   | Variable | What to set | If unset |
   |----------|-------------|----------|
   | `PUBLIC_BASE_URL` | Your live site URL (e.g. `https://nonfictionfooty-site.pages.dev`) so the video worker can call your upload URL | Code uses a default URL |
   | `LLM_API_KEY` | Your OpenAI (or compatible) API key for script/caption generation | Rule-based fallback |
   | `ELEVENLABS_API_KEY` | Your ElevenLabs API key for voiceover | No TTS; no audio in video |
   | `WEBHOOK_SECRET` | Any secret string you choose; give the same value to your video-worker so it can authenticate when uploading the MP4 | upload-video will reject or be insecure |
   | `EXTERNAL_VIDEO_WORKER_URL` | Full URL of your deployed video-worker (e.g. `https://your-app.onrender.com`) | App writes a 1-frame placeholder MP4 |

   See `.env.example` for the full list. D1 and R2 are configured via **wrangler.toml / bindings**, not as env vars in the dashboard.

   **What is the “external video worker” / `EXTERNAL_VIDEO_WORKER_URL`?**  
   Cloudflare Workers can’t run FFmpeg. So “build an MP4 from audio + image” runs on a **separate small service** in this repo: `video-worker/`. You deploy that service somewhere that supports Node + FFmpeg (e.g. Railway or Render). Your Cloudflare app then **calls that URL** with the job’s audio URL; the worker builds the MP4 and uploads it back. If you **don’t** set `EXTERNAL_VIDEO_WORKER_URL`, the app still works: you get script, caption, hashtags, and (with ElevenLabs) voiceover, but the “video” is a tiny placeholder so Export/Download still work. So: **you can leave it empty** until you want real MP4s, then deploy `video-worker` and set the URL (see `video-worker/README.md`).

4. **Deploy** — Push to main; Cloudflare Pages builds and deploys. Build command: `npm run build`, output: `dist`.

5. **Smoke test** — Create a job with a non-soccer topic (e.g. "Why compound interest matters"), poll until completed, confirm Export shows script/caption/hashtags and step progress; MP4 is placeholder or real depending on env.

6. **Verification file** — `public/tiktokoYqResEQScW2wKbWiK9U0XDU8FCYHgxe.txt` is served at `/<filename>.txt` for TikTok URL verification if needed.

7. **Pipeline extensions (optional)** — Stock media/music adapters, word-level timestamps, uniqueness/variety tracking, Remotion renderer; see docs/CODE-PATHS-AND-MIGRATION.md and PROJECT-CONTEXT.md.
