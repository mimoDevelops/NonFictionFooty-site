# NonFictionFooty – TikTok Story Orchestrator

A Cloudflare Pages full-stack app that generates soccer story drafts, fetches rights-cleared images (Wikimedia Commons, optional Unsplash), and lets you approve drafts and upload them as **photo drafts** to TikTok via the Content Posting API. Photos are served from your Pages domain under `/media/*` so the URL prefix can be verified with TikTok.

**Live URL:** https://nonfictionfooty-site.pages.dev/

---

## Architecture (Cloudflare-native)

| Layer | Technology |
|-------|------------|
| Frontend | Vite + React, static build → `dist/` |
| Backend | Cloudflare Pages Functions in `/functions` (file-based routing) |
| Storage | R2 bucket for images |
| Media URLs | `https://nonfictionfooty-site.pages.dev/media/<key>` served by a Pages Function from R2 |
| Persistence | Cloudflare D1 (SQLite) for drafts and TikTok tokens |

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd nonfictionfooty-site
npm install
```

### 2. Create D1 database

```bash
npx wrangler d1 create nonfictionfooty-db
```

Note the **database_id** from the output. Then apply the schema:

```bash
npx wrangler d1 execute nonfictionfooty-db --remote --file=schema.sql
```

For local dev (optional):

```bash
npx wrangler d1 execute nonfictionfooty-db --local --file=schema.sql
```

### 3. Create R2 bucket

```bash
npx wrangler r2 bucket create nonfictionfooty-media
```

### 4. Configure `wrangler.toml`

Uncomment and fill in the bindings:

```toml
[[d1_databases]]
binding = "DB"
database_name = "nonfictionfooty-db"
database_id = "<YOUR_D1_DATABASE_ID>"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "nonfictionfooty-media"
```

### 5. Environment variables (Cloudflare Dashboard)

In **Pages** → your project → **Settings** → **Environment variables**, add:

| Variable | Description |
|----------|-------------|
| `TIKTOK_CLIENT_KEY` | TikTok Developer app Client Key |
| `TIKTOK_CLIENT_SECRET` | TikTok Developer app Client Secret |
| `TIKTOK_REDIRECT_URI` | `https://nonfictionfooty-site.pages.dev/auth/tiktok/callback` |
| `UNSPLASH_ACCESS_KEY` | (Optional) Unsplash API access key for extra images |

### 6. TikTok app configuration

- In [TikTok for Developers](https://developers.tiktok.com/), create an app and enable **Login Kit** and **Content Posting API**.
- Set redirect URI: `https://nonfictionfooty-site.pages.dev/auth/tiktok/callback`.
- Add the **Verified URL prefix** for photo uploads (see below).

### 7. TikTok verified URL prefix (for PULL_FROM_URL)

TikTok requires that photo URLs used in `source_info.photo_images` are under a verified prefix.

1. In TikTok Developer Portal → your app → **Content Posting** (or **Webhooks / URL verification**).
2. Add **Verified URL prefix**:  
   `https://nonfictionfooty-site.pages.dev/media`
3. TikTok may request a verification request to a path under that prefix; our `/media/[[path]]` function serves R2 objects, so ensure the bucket and function are deployed and the base URL returns 404 or a valid response as required by TikTok’s verification flow.

**Checklist:**

- [ ] Redirect URI added: `https://nonfictionfooty-site.pages.dev/auth/tiktok/callback`
- [ ] Verified URL prefix added: `https://nonfictionfooty-site.pages.dev/media`
- [ ] Scopes requested: `user.info.basic`, `video.upload`, `video.publish`
- [ ] App deployed and `/media/<key>` returns images (e.g. after uploading a draft)

### 8. Build and deploy

**Via Git (recommended):**

- Connect the repo to Cloudflare Pages (Git integration).
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: project root (so `functions/` is at repo root).
- Add the same env vars and D1/R2 bindings in the Pages project.

**Via Wrangler:**

```bash
npm run build
npx wrangler pages deploy dist --project-name=nonfictionfooty-site
```

Ensure D1 and R2 bindings (and env vars) are configured for the Pages project in the dashboard.

---

## Scripts

- `npm run dev` – Local Vite dev server (frontend only; no Functions).
- `npm run build` – Build frontend to `dist/`.
- `npm run preview` – Preview production build locally.
- `npx wrangler pages dev dist` – Run Pages + Functions locally (after build).

---

## API (Pages Functions)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/drafts` | List drafts (optional `?status=`) |
| POST | `/api/drafts` | Create draft (body: `niche_seed`, `min_slides`, `max_slides`, `tone`) |
| GET | `/api/drafts/:id` | Get one draft |
| POST | `/api/drafts/:id/approve` | Set status to APPROVED |
| POST | `/api/drafts/:id/regenerate-images` | Fetch new image candidates |
| POST | `/api/drafts/:id/upload` | Upload chosen images to R2, create TikTok photo draft (body: optional `chosen_images[]`) |
| GET | `/api/auth/status` | Returns `{ connected, open_id }` |
| GET | `/auth/tiktok/login` | Redirect to TikTok OAuth |
| GET | `/auth/tiktok/callback` | OAuth callback; stores tokens in D1 |
| GET | `/media/*` | Serve R2 object (for TikTok PULL_FROM_URL) |

---

## Data model

**Draft:** `id`, `created_at`, `status` (DRAFT | APPROVED | UPLOADED_DRAFT | NEEDS_FIX), `headline`, `story_json`, `sources_json`, `min_slides`, `max_slides`, `chosen_slide_count`, `caption`, `hashtags`, `image_candidates_json`, `chosen_images_json`, `tiktok_publish_id`, `error`.

**TikTokAuth:** `open_id`, `access_token`, `refresh_token`, `expires_at`.

---

## TikTok behavior

- Uses **photo** endpoint: `POST https://open.tiktokapis.com/v2/post/publish/content/init/`.
- Body: `post_mode: "MEDIA_UPLOAD"`, `media_type: "PHOTO"`, `source_info.source: "PULL_FROM_URL"`, `source_info.photo_images`: array of `{ url }` (HTTPS under verified prefix).
- Slide count: between `min_slides` and `max_slides`, capped at 35.
- **Draft-only:** we never auto-publish; the UI shows: “Open TikTok inbox notification to continue editing & post.”
- `publish_id` from the response is stored and shown in the UI.

---

## License

MIT.
