import React from 'react';
import { Link } from 'react-router-dom';

export default function AppReview() {
  return (
    <div className="page legal-page app-review-page">
      <h1>How exports work</h1>
      <p>This page describes the NonFictionFooty generate-and-export flow for reviewers.</p>
      <h2>Flow</h2>
      <ol>
        <li><strong>Create</strong> — User enters topic, team/player, era/match, tone, duration, and style. We create a job and return a job ID.</li>
        <li><strong>Processing</strong> — We generate script, caption, hashtags, voiceover (or placeholder), subtitles (SRT), and visuals, then render a 9:16 MP4 and store outputs in R2.</li>
        <li><strong>Export</strong> — User opens the job in the Library and gets: video preview, Download MP4, Copy caption, Copy hashtags, Download SRT, Download cover. A posting checklist is shown. User uploads manually; we do not post to any platform.</li>
      </ol>
      <h2>Demo steps</h2>
      <p>1. Open the homepage. 2. Click “Create video” and submit the form. 3. You are redirected to /export/:jobId; the job may show “Processing” then “completed.” 4. Download MP4, copy caption/hashtags, download SRT and cover. 5. Use the checklist to upload manually elsewhere.</p>
      <p><em>Screenshots: (placeholder for demo screenshots)</em></p>
      <p><Link to="/">Home</Link> · <Link to="/about">About</Link> · <Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link></p>
    </div>
  );
}
