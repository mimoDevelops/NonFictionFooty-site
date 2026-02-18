import React from 'react';
import { Link } from 'react-router-dom';

export default function AppReview() {
  return (
    <div className="page legal-page app-review-page">
      <h1>TikTok integration</h1>
      <p>This page explains how NonFictionFooty uses TikTok’s APIs for app review purposes.</p>

      <h2>Products used</h2>
      <ul>
        <li><strong>Login Kit</strong> — so users can connect their TikTok account with one-time OAuth consent.</li>
        <li><strong>Content Posting API</strong> — to create photo drafts on the user’s behalf. We do not use Direct Post; we only create drafts so the user can review and publish in the TikTok app.</li>
      </ul>

      <h2>Scopes used</h2>
      <p>We request only the minimum scopes needed:</p>
      <ul>
        <li><strong>user.info.basic</strong> — to identify the connected TikTok account (e.g. display name/avatar in our UI) after the user authorizes.</li>
        <li><strong>video.upload</strong> — to create draft photo posts via the Content Posting API. We do not auto-publish; every upload is created as a draft.</li>
      </ul>
      <p>We do not request video.publish for automatic posting. Users always complete the post from TikTok after reviewing the draft.</p>

      <h2>User flow</h2>
      <ol>
        <li><strong>Connect TikTok</strong> — The user clicks “Connect TikTok” on our site. They are redirected to TikTok’s OAuth consent screen (Login Kit). After authorizing, TikTok redirects back to our callback URL: <code>https://nonfictionfooty-site.pages.dev/auth/tiktok/callback</code>. We exchange the authorization code for access and refresh tokens and store them securely. We use <strong>user.info.basic</strong> to show the connected account in our UI.</li>
        <li><strong>Create a draft</strong> — The user creates a story draft in our app (topic, slides, images). We fetch rights-cleared images (e.g. Wikimedia Commons) and store the draft in our database.</li>
        <li><strong>Upload as draft</strong> — When the user clicks “Upload to TikTok,” we call the Content Posting API with <strong>video.upload</strong>. We use <code>post_mode: MEDIA_UPLOAD</code> and <code>media_type: PHOTO</code> so that the content is created as a <strong>draft</strong> in the user’s TikTok account. The user receives an inbox notification and can then open the draft in TikTok to edit, add music, and publish. We do not use Direct Post or auto-publish.</li>
      </ol>

      <h2>Minimum scope and user control</h2>
      <p>We only request the scopes necessary for the above flow. Users can revoke our access at any time in TikTok (Settings → Security → Manage app permissions). All uploads are drafts; users retain full control over what is published.</p>

      <p><Link to="/">Home</Link> · <Link to="/about">About / Contact</Link> · <Link to="/privacy">Privacy Policy</Link> · <Link to="/terms">Terms of Service</Link></p>
    </div>
  );
}
