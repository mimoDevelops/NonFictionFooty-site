import React from 'react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="page legal-page">
      <h1>Privacy Policy</h1>
      <p><strong>NonFictionFooty</strong> (“we”) respects your privacy.</p>
      <p>We use your TikTok account connection only to post content you choose (photo drafts) via TikTok’s Content Posting API. We do not sell your data. We store draft content and tokens necessary to communicate with TikTok; you can revoke access at any time in your TikTok settings.</p>
      <p>For questions, contact us through the channels provided in the app or on our site.</p>
      <p><Link to="/">Back to NonFictionFooty</Link></p>
    </div>
  );
}
