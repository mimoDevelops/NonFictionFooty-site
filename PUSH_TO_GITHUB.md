# Push changes to GitHub

Run these commands in **PowerShell** or **Command Prompt** from this folder.

## If this folder is already a git repo (you already ran `git init` and pushed once)

```powershell
cd "c:\Users\New user\CursorProjectsLocal\nonfictionfooty-site"

git add .
git status
git commit -m "Fix Functions _lib import paths for Cloudflare deploy"
git push
```

## If you haven't set up git here yet

```powershell
cd "c:\Users\New user\CursorProjectsLocal\nonfictionfooty-site"

git init
git add .
git commit -m "Initial commit: NonFictionFooty + fixed _lib imports"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your GitHub username and repo name.

---

After `git push`, Cloudflare Pages will automatically start a new build and deploy.
