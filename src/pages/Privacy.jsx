import React from 'react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="page legal-page">
      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> February 2025.</p>
      <p><strong>NonFictionFooty</strong> (“we”, “our”) operates the website and service at nonfictionfooty-site.pages.dev. This Privacy Policy explains how we collect, use, and protect your information when you use our service.</p>

      <h2>Information we collect</h2>
      <p>When you connect your TikTok account via TikTok Login Kit, we receive and store the access and refresh tokens provided by TikTok, and your TikTok user identifier (open_id), so we can create draft posts on your behalf. We do not receive or store your TikTok password. We also store the draft content you create (headlines, captions, image references) in our database to let you manage and upload drafts.</p>

      <h2>How we use your information</h2>
      <p>We use your TikTok connection solely to create draft posts when you choose to upload content through our app. We use the minimum scopes required: user.info.basic (to identify the connected account) and video.upload (to create drafts). We do not sell, rent, or share your personal data with third parties for marketing. We do not automatically publish any content; uploads are created as drafts for you to review and post in the TikTok app.</p>

      <h2>Data retention and your choices</h2>
      <p>We retain your tokens and draft data until you revoke access or delete your data. You can revoke our access to your TikTok account at any time in your TikTok app settings (Settings → Security → Manage app permissions). After revocation, we will no longer be able to create drafts for you; existing drafts in our app remain stored unless you request deletion.</p>

      <h2>Security</h2>
      <p>We use industry-standard practices to protect your data. TikTok credentials are stored securely and used only to communicate with TikTok’s APIs. Our service is hosted on Cloudflare Pages and uses HTTPS.</p>

      <h2>Contact</h2>
      <p>For privacy-related questions or to request deletion of your data, contact us at <a href="mailto:support@nonfictionfooty.com">support@nonfictionfooty.com</a>.</p>

      <p><Link to="/">Back to Home</Link> · <Link to="/terms">Terms of Service</Link></p>
    </div>
  );
}
