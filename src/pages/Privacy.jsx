import React from 'react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="page legal-page">
      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> February 2025.</p>
      <p><strong>NonFictionFooty</strong> operates the website and service at nonfictionfooty-site.pages.dev. This Privacy Policy explains how we handle information when you use our service.</p>
      <h2>Information we collect</h2>
      <p>We store the content you create (topic, script, caption, hashtags) and the generated job outputs (video, subtitles) in our systems to provide the export workflow. We do not collect or store third-party account credentials. We do not sell or share your data for marketing.</p>
      <h2>How we use your information</h2>
      <p>We use your inputs solely to generate and store export assets (MP4, SRT, caption, cover). All exports are for manual upload by you; we do not post to any platform on your behalf.</p>
      <h2>Contact</h2>
      <p>For privacy questions or data deletion requests: <a href="mailto:support@nonfictionfooty.com">support@nonfictionfooty.com</a>.</p>
      <p><Link to="/">Home</Link> · <Link to="/terms">Terms of Service</Link></p>
    </div>
  );
}
