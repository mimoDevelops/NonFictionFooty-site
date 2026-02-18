import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="page legal-page">
      <h1>Terms of Service</h1>
      <p><strong>Last updated:</strong> February 2025.</p>
      <p>Welcome to <strong>NonFictionFooty</strong>. By accessing or using the service at nonfictionfooty-site.pages.dev (“Service”), you agree to be bound by these Terms of Service.</p>

      <h2>Description of the Service</h2>
      <p>NonFictionFooty is a web application that lets you create short football-story drafts and upload them to your TikTok account as photo drafts. The Service uses TikTok’s Login Kit and Content Posting API. You must connect your TikTok account to use the upload feature. We do not automatically publish content; all uploads are created as drafts for you to review, edit, and publish in the TikTok app.</p>

      <h2>Your responsibilities</h2>
      <p>You are responsible for all content you create and publish. You must not use the Service to post content that infringes intellectual property or other rights of others, violates applicable law, or violates TikTok’s Community Guidelines or Terms of Service. You must have the right to use any images and text you include in your drafts. We may remove content or suspend access if we believe it violates these Terms or TikTok’s policies.</p>

      <h2>TikTok’s terms</h2>
      <p>Use of TikTok features is subject to TikTok’s Terms of Service and Developer Terms. By connecting your TikTok account, you authorize us to create drafts on your behalf using the scopes you consent to. You can revoke this access at any time in your TikTok settings.</p>

      <h2>Disclaimer</h2>
      <p>The Service is provided “as is” and “as available.” We do not guarantee uninterrupted or error-free operation. We are not liable for any loss or damage arising from your use of the Service or from TikTok’s handling of your content or account.</p>

      <h2>Changes</h2>
      <p>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated Terms. We will indicate the “Last updated” date at the top of this page.</p>

      <h2>Contact</h2>
      <p>For questions about these Terms, contact us at <a href="mailto:support@nonfictionfooty.com">support@nonfictionfooty.com</a>.</p>

      <p><Link to="/">Back to Home</Link> · <Link to="/privacy">Privacy Policy</Link></p>
    </div>
  );
}
