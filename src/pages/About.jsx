import React from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="page about-page">
      <h1>About</h1>
      <p><strong>NonFictionFooty</strong> is a web app that generates short football story videos and export packages. You get an MP4, caption, hashtags, SRT, and cover image to upload manually to your preferred platform.</p>
      <h2>Contact & support</h2>
      <p><strong>Email:</strong> <a href="mailto:support@nonfictionfooty.com">support@nonfictionfooty.com</a></p>
      <p><Link to="/">Home</Link> · <Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link> · <Link to="/app-review">How exports work</Link></p>
    </div>
  );
}
