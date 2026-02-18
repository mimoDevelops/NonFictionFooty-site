# How to Get This Project on GitHub (and Cloudflare)

You have two options, depending on how your GitHub repo is set up.

---

## Option A: This project should BE your Cloudflare site (recommended)

**Use this if:** Your GitHub repo is already connected to Cloudflare Pages for **nonfictionfooty-site**, and you want this code to be what deploys.

### 1. Create a new repo on GitHub (or use an existing empty one)

- Go to [github.com/new](https://github.com/new).
- Name it something like `nonfictionfooty-site`.
- Do **not** add a README, .gitignore, or license (we already have these).
- Create the repo and copy the repo URL (e.g. `https://github.com/YOUR_USERNAME/nonfictionfooty-site.git`).

### 2. In this folder, turn it into a git repo and push

Open **PowerShell** or **Command Prompt** and run:

```powershell
cd "c:\Users\New user\CursorProjectsLocal\nonfictionfooty-site"

git init
git add .
git commit -m "Initial commit: NonFictionFooty TikTok orchestrator"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nonfictionfooty-site.git
git push -u origin main
```

Replace `YOUR_USERNAME/nonfictionfooty-site` with your actual GitHub username and repo name.

### 3. Connect (or reconnect) Cloudflare Pages to this repo

- In **Cloudflare Dashboard** → **Workers & Pages** → your **Pages** project (e.g. nonfictionfooty-site).
- **Create application** → **Connect to Git** → choose this repo, or if it’s already connected, it will start building from the new push.
- Build settings:
  - **Build command:** `npm run build`
  - **Build output directory:** `dist`
  - **Root directory:** leave blank (repo root).

After the next push to `main`, Cloudflare will build and deploy this project.

---

## Option B: You already have a repo connected and want this code in it

**Use this if:** You have one repo that’s already connected to Cloudflare, and you want to add this project **inside** that repo (e.g. in a subfolder) for documentation or as the new app.

### 1. Clone your existing repo (if you don’t have it locally)

```powershell
cd "c:\Users\New user\CursorProjectsLocal"
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### 2. Copy this project into the repo

- Copy **everything** from `nonfictionfooty-site` (except `node_modules` and `.git` if it exists) into your repo:
  - Either into the **root** of the repo (so this app becomes the main site), or
  - Into a **subfolder**, e.g. `nonfictionfooty-site/`, if you want to keep other content at the root.

### 3. Commit and push

```powershell
git add .
git commit -m "Add NonFictionFooty project"
git push
```

### 4. Cloudflare build settings

- If you put the project in the **root** of the repo:  
  Build command: `npm run build`, Build output: `dist`, Root: (blank).
- If you put it in a **subfolder** (e.g. `nonfictionfooty-site/`):  
  Root directory: `nonfictionfooty-site`, Build command: `npm run build`, Build output: `dist`.

---

## Quick reference

| Goal | What to do |
|------|------------|
| New repo just for this app | Option A: create repo → `git init` in this folder → add remote → push. Then connect that repo in Cloudflare. |
| Add to existing repo | Option B: copy this folder into the repo (root or subfolder), commit, push. Set Cloudflare root if you used a subfolder. |

Your `.gitignore` already excludes `node_modules/` and `dist/`, so they won’t be pushed. Cloudflare will run `npm install` and `npm run build` on their side.
