# What to do now (NonFictionFooty is live)

You can see the UI. Follow these in order so the app actually works end-to-end.

---

## 1. Set up the backend (if you haven’t)

The UI needs **D1** (database) and **R2** (image storage), plus env vars.

### D1 (drafts + TikTok tokens)

In a terminal (with Wrangler logged in):

```bash
cd "c:\Users\New user\CursorProjectsLocal\nonfictionfooty-site"
npx wrangler d1 create nonfictionfooty-db
```

Copy the **database_id** from the output. Then:

- **Cloudflare Dashboard** → **Workers & Pages** → your **Pages project** → **Settings** → **Functions**.
- Under **D1 database bindings**, add:
  - Variable name: `DB`
  - D1 database: select **nonfictionfooty-db** (or the DB you created).

Apply the schema (use your real `database_id`):

```bash
npx wrangler d1 execute nonfictionfooty-db --remote --file=schema.sql
```

(If the CLI asks for a database ID, use the one from `wrangler d1 create`.)

### R2 (images for TikTok)

```bash
npx wrangler r2 bucket create nonfictionfooty-media
```

Then in the same **Pages** project → **Settings** → **Functions** → **R2 bucket bindings**:

- Variable name: `BUCKET`
- R2 bucket: **nonfictionfooty-media**

### Env vars (Pages project)

**Settings** → **Environment variables** (Production, and Preview if you use it):

| Name | Value | Notes |
|------|--------|--------|
| `TIKTOK_CLIENT_KEY` | Your TikTok app Client Key | From developers.tiktok.com |
| `TIKTOK_CLIENT_SECRET` | Your TikTok app Client Secret | |
| `TIKTOK_REDIRECT_URI` | `https://nonfictionfooty-site.pages.dev/auth/tiktok/callback` | Or your real Pages URL |
| `UNSPLASH_ACCESS_KEY` | (optional) | Only if you use Unsplash |

Redeploy once after adding D1, R2, and env vars (e.g. **Retry deployment** or push a commit).

---

## 2. Connect TikTok

1. In [TikTok for Developers](https://developers.tiktok.com/), create an app (or use existing).
2. Add **Login Kit** and **Content Posting API**; set redirect URI to  
   `https://nonfictionfooty-site.pages.dev/auth/tiktok/callback`  
   (or your real domain).
3. For **Content Posting** → **Verified URL prefix**, add:  
   `https://nonfictionfooty-site.pages.dev/media`
4. In your live app, click **“Connect TikTok”** in the header and complete the OAuth flow.

When it works, the header will show “Connected to TikTok” instead of the button.

---

## 3. Create a draft

1. Click **“New draft”** (top right or in the main area).
2. Fill in:
   - **Niche seed** (e.g. `soccer-history`, `world-cup-1986`)
   - **Min / max slides** (e.g. 3–10)
   - **Tone** (e.g. Factual)
3. Click **“Create draft”**.

You should be taken to the draft detail page (story, caption, image candidates). If you get an error, check that D1 is bound and the schema was applied (step 1).

---

## 4. Use a draft (approve → upload to TikTok)

On the draft detail page you can:

- **Regenerate images** – new image candidates from Wikimedia (and Unsplash if configured).
- **Approve draft** – set status to APPROVED.
- **Upload to TikTok (create draft)** – uploads chosen images to R2, then creates a **photo draft** in TikTok via the API. You’ll get a `publish_id` and the message: *“Open TikTok inbox notification to continue editing & post.”*

So the flow is: create draft → (optionally regenerate images and pick/order images) → Approve → Upload to TikTok → finish in the TikTok app from the inbox notification.

---

## Quick checklist

- [ ] D1 database created and bound to the Pages project (`DB`)
- [ ] `schema.sql` applied to that D1 database
- [ ] R2 bucket created and bound (`BUCKET`)
- [ ] Env vars set: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI`
- [ ] TikTok app: redirect URI and Verified URL prefix set
- [ ] Clicked “Connect TikTok” and completed OAuth
- [ ] Created at least one draft from “New draft”
- [ ] (Optional) Approved a draft and clicked “Upload to TikTok (create draft)”

If something fails (e.g. “D1 not configured”, “TikTok not connected”, or “R2 not configured”), double-check the matching step above.
