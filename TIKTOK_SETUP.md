# TikTok Developer App Setup (exact checklist)

Use this when setting up or fixing your TikTok app for NonFictionFooty. Do the steps **in this order**.

---

## 1. Platform: Web only (fixes “Desktop Redirect URI” errors)

In your TikTok app settings:

- ✅ **Web** — check this
- ❌ **Desktop** — **uncheck** (this is why the Desktop Redirect URI was failing)
- ❌ **Android/iOS** — leave unchecked

Once Desktop is unchecked, you use the **Web Redirect URI** only.

---

## 2. App details

### App icon (required)
- Upload a **1024×1024** PNG or JPG.

### Description (max 120 characters)

Copy this exactly:

```
NonFictionFooty generates short football story videos and lets users upload them to TikTok after connecting their account.
```

(That’s 99 characters — under the 120 limit and not cut off.)

---

## 3. URLs (must be real pages that load — no 404)

| Field | URL |
|--------|-----|
| **Web/Desktop URL (official website)** | `https://nonfictionfooty-site.pages.dev/` |
| **Terms of Service URL** | `https://nonfictionfooty-site.pages.dev/terms` |
| **Privacy Policy URL** | `https://nonfictionfooty-site.pages.dev/privacy` |

**Check:** Open each URL in an **incognito** tab and confirm the page loads (no 404).  
Your app already has `/terms` and `/privacy` routes.

---

## 4. URL properties (fixes “URL is not verified”)

- Click **URL properties** (top right in the TikTok developer portal).
- Add / verify:
  - **Website domain:** `nonfictionfooty-site.pages.dev`
- If it asks for both “Website” and “Redirect” domains, use the same one: `nonfictionfooty-site.pages.dev`.

This removes the red “not verified” warnings.

---

## 5. Products → Login Kit (OAuth callback)

- Platform: **Web** (not Desktop).
- **Redirect URI (Web):**
  ```
  https://nonfictionfooty-site.pages.dev/auth/tiktok/callback
  ```
- No extra query params, no trailing spaces. Copy/paste exactly.

---

## 6. Products → Content Posting API

- You can leave **Direct Post** off for now (draft upload is easier to get approved).
- **Verify domains (for pull_from_url):**  
  You serve images from `https://nonfictionfooty-site.pages.dev/media/...`, so verify:
  - `nonfictionfooty-site.pages.dev`  
  (If you later use a custom domain for media, add that too.)

---

## 7. App review (2 required things)

### 1) “Explain how each product and scope works…” (required)

Paste this in the explanation box:

```
Users click "Connect TikTok" to authorize with Login Kit. We request user.info.basic to identify the account. After authorization, the user creates a video in our web app and we upload it to TikTok using the Content Posting API with the video.upload scope. The upload is created as a draft for the user to review and post in TikTok.
```

### 2) Demo video (required)

Upload a **screen recording** that shows:

1. Your site open at `https://nonfictionfooty-site.pages.dev/`
2. Click **“Connect TikTok”**
3. TikTok consent screen
4. Redirect back to your site (success)
5. Trigger an upload flow (create a draft → “Upload to TikTok”) and show it reaches TikTok as a draft (or show the API response / success in your UI)

If the full upload isn’t working yet, still record: **Login → callback → UI at “ready to upload”** and mention in the notes that the rest is in progress. TikTok may ask for full end-to-end later.

---

## Why you might still see 5 errors

Common causes:

| Issue | Fix |
|--------|-----|
| App icon missing | Upload 1024×1024 icon |
| URLs not verified | Do **URL properties** and verify `nonfictionfooty-site.pages.dev` |
| Desktop platform checked | Uncheck Desktop, use **Web** only |
| App review explanation empty | Paste the text from **§ 7.1** above |
| Demo video not uploaded | Record and upload the flow from **§ 7.2** |

---

## Order to do everything

1. Uncheck **Desktop**, check **Web** only.
2. **URL properties** → add and verify `nonfictionfooty-site.pages.dev`.
3. Confirm `/terms` and `/privacy` load (incognito).
4. Set **Web Redirect URI:** `https://nonfictionfooty-site.pages.dev/auth/tiktok/callback`.
5. Fill **App review** explanation (paste from § 7.1).
6. Upload **demo video** (see § 7.2).
7. Upload **app icon** (1024×1024).
8. Fill **Description** with the 99-character text above.
9. Set **Web/Desktop URL**, **Terms URL**, **Privacy URL** as in the table in § 3.

After that, submit (or resubmit) for review. If TikTok rejects, the email usually says which of these is still missing — use this doc to fix that item and try again.
