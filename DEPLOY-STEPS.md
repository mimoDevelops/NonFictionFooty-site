# Redeploy NonFictionFooty — step by step

Do these in order in a terminal (PowerShell or Command Prompt), from the project folder.

---

## Important: both frontend AND backend must be updated

- **Frontend** = built files in `dist/` (HTML, JS, CSS).
- **Backend** = Cloudflare **Functions** in the `functions/` folder (e.g. the job processor that creates the video).

If you only run `npx wrangler pages deploy dist`, you upload **only** the `dist/` folder. The **Functions** (including the new video placeholder) are **not** in `dist/` — they live in your repo. So to get the new video behaviour and Export fixes live, you **must deploy via Git** (push to GitHub/GitLab connected to Cloudflare Pages) so that Cloudflare runs a full build and deploys both `dist/` and `functions/`.

---

## Step 1: Go to the project folder

```powershell
cd "c:\Users\New user\CursorProjectsLocal\nonfictionfooty-site"
```

---

## Step 2: Build the frontend

```powershell
npm run build
```

You should see something like:
- `vite v5.x.x building for production...`
- `dist/index.html` and built JS/CSS.

If it fails, fix any errors (e.g. run `npm install` first).

---

## Step 3: Deploy (choose one)

### Option A — You deploy with Git (GitHub/GitLab connected to Cloudflare Pages)

1. Commit and push your changes:
   ```powershell
   git add -A
   git status
   git commit -m "Fix Export page: show completed jobs, not Something went wrong"
   git push
   ```
2. In **Cloudflare Dashboard** → **Pages** → your project, the latest push will trigger a new build. Wait for it to finish.  
   Your `dist/` and `functions/` are built by Cloudflare from the repo, so you don’t need to run `wrangler` yourself.

### Option B — You deploy from your machine with Wrangler

Run this (use your real project name if it’s not `nonfictionfooty-site`):

```powershell
npx wrangler pages deploy dist --project-name=nonfictionfooty-site
```

When asked to log in, follow the browser prompt.  
After it finishes, it will print the live URL (e.g. `https://nonfictionfooty-site.pages.dev`).

---

## Step 4: Test

1. Open your site (e.g. https://nonfictionfooty-site.pages.dev).
2. Go to **Library**.
3. Click a **completed** job.
4. You should see the Export page with video preview, **Download MP4**, **Copy caption**, **Copy hashtags**, etc. — and **no** “Something went wrong.”

If you still see “Something went wrong,” open DevTools (F12) → **Network** → click the request to `api/jobs/...` and check the response body and status code.

---

## Did I deploy correctly? (quick check)

1. **How did you deploy?**
   - **Git push** → Good. Make sure you committed and pushed **all** changes (including `functions/lib/jobProcessor.js`). In Cloudflare Dashboard → Pages → your project → **Deployments**, check that the latest deployment **succeeded** and is from after your last push.
   - **Only `wrangler pages deploy dist`** → That does **not** update the Functions. The video fix is in `functions/lib/jobProcessor.js`. Redeploy using **Git push** so Cloudflare builds from the repo and deploys both `dist/` and `functions/`.

2. **Test with a NEW job**
   - Old jobs (e.g. from Library) still point to the **old** placeholder video in R2. To see the new minimal playable video you must **create a new job**: go to **Create**, submit the form, wait for it to complete, then open that job's Export page.
   - Optional: download the MP4 for that new job. If the file is **~1 KB** or more, the new code is live. If it's only a few dozen bytes, the old placeholder is still being used (deploy via Git and try again).
