# Redeploy NonFictionFooty — step by step

Do these in order in a terminal (PowerShell or Command Prompt), from the project folder.

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
