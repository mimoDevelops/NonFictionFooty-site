import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="page legal-page">
      <h1>Terms of Service</h1>
      <p><strong>Last updated:</strong> February 2025.</p>
      <p>By using <strong>NonFictionFooty</strong> at nonfictionfooty-site.pages.dev you agree to these Terms.</p>
      <h2>Service</h2>
      <p>NonFictionFooty generates short football-story videos and export packages (MP4, caption, hashtags, SRT, cover). You download and upload content manually to your chosen platforms. We do not post on your behalf.</p>
      <h2>Your responsibilities</h2>
      <p>You are responsible for the content you create and where you publish it. Do not use the service for content that infringes others’ rights or violates applicable law or platform rules.</p>
      <h2>Disclaimer</h2>
      <p>The service is provided “as is.” We are not liable for your use of exported content or any platform’s policies.</p>
      <h2>Contact</h2>
      <p><a href="mailto:support@nonfictionfooty.com">support@nonfictionfooty.com</a></p>
      <p><Link to="/">Home</Link> · <Link to="/privacy">Privacy Policy</Link></p>
    </div>
  );
}
