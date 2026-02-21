# Prompt UI

A minimal chat UI backed by OpenAI. The frontend is a single page (Vite + React); the backend is a Cloudflare Pages Function that proxies requests to OpenAI. **The OpenAI API key is only set in Cloudflare and never exposed to the client.**

- **Hosting:** Cloudflare Pages (frontend + `functions/` for serverless API).
- **Stack:** Vite, React, Cloudflare Pages Functions, OpenAI Chat Completions.

---

## Setup

1. **Environment variable (required for `/api/chat`):**
   - In [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages** → your project → **Settings** → **Environment variables**, add:
   - `OPENAI_API_KEY` = your OpenAI API key (Encrypted).
   - Do **not** put the key in client code or in the repo.

2. **Local dev:**
   ```bash
   npm install
   npm run dev
   ```
   This runs the Vite dev server (frontend only). To test the full stack including the `/api/chat` function locally, use:
   ```bash
   npm run build
   npx wrangler pages dev dist --compatibility-date=2024-01-01
   ```
   Then open the URL Wrangler prints (e.g. `http://localhost:8788`). The Pages Function will run locally and will need `OPENAI_API_KEY` in a `.dev.vars` file in the project root (create it; format: `OPENAI_API_KEY=sk-...`). **Do not commit `.dev.vars`.**

3. **Deploy:**
   - Connect the repo to Cloudflare Pages and set the build command to `npm run build` and output directory to `dist`.
   - Ensure `OPENAI_API_KEY` is set in the project’s environment variables for production (and preview if you use it).

---

## Security / ops

- **API key:** Only in Cloudflare Pages env (and locally in `.dev.vars`). Never log it or expose it to the client.
- **Rate limiting:** Optional; the API rejects bodies larger than 100KB. You can add per-IP or per-request cooldowns in `functions/api/chat.js` if needed.

MIT.
