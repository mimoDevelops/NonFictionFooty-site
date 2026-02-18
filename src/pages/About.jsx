import React from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="page about-page">
      <h1>About / Contact</h1>
      <p><strong>NonFictionFooty</strong> is a web app that helps creators turn football stories into TikTok photo drafts. We integrate with TikTok via Login Kit and the Content Posting API so you can create drafts in our app and then review and post them from TikTok.</p>
      <p>Our goal is to make it easy to produce short, fact-based football content for TikTok without manually sourcing images or building posts from scratch. We use rights-cleared sources (e.g. Wikimedia Commons) and only request the minimum TikTok scopes needed to create drafts on your behalf.</p>
      <h2>Contact & support</h2>
      <p>For support, feature requests, or general inquiries:</p>
      <p><strong>Email:</strong> <a href="mailto:support@nonfictionfooty.com">support@nonfictionfooty.com</a></p>
      <p>We aim to respond within a few business days.</p>
      <p><Link to="/">Home</Link> · <Link to="/privacy">Privacy Policy</Link> · <Link to="/terms">Terms of Service</Link> · <Link to="/app-review">TikTok integration</Link></p>
    </div>
  );
}
