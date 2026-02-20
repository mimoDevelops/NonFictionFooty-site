# Next steps (TikTok-API-free)

1. **Apply schema** — If you created a new D1 DB or reset, run:  
   `npx wrangler d1 execute nonfictionfooty-db --remote --file=schema.sql`  
   (Schema defines the `jobs` table only.)

2. **R2** — Ensure the bucket `nonfictionfooty-media` exists and is bound as `BUCKET` in wrangler.toml / Pages settings.

3. **Deploy** — Push to main; Cloudflare Pages builds and deploys. Set build command to `npm run build`, output `dist`.

4. **Smoke test** — Run `BASE=https://nonfictionfooty-site.pages.dev ./scripts/smoke-test.sh` to create a job, poll, verify MP4 and /terms, /privacy.

5. **Verification file** — `public/tiktokoYqResEQScW2wKbWiK9U0XDU8FCYHgxe.txt` is served at `/<filename>.txt` for TikTok URL verification if needed.

6. **Real video (optional)** — The job processor currently writes a minimal playable MP4 (single black frame) so the preview and Download MP4 work. For real story videos: add an LLM step for script, TTS for voiceover, and a video pipeline (e.g. FFmpeg on a separate service or use a video API) to produce the final MP4; then upload that to R2 and set `output_final_mp4` in the job. Cloudflare Workers cannot run FFmpeg; use a queue + external worker or third-party API.
