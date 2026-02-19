import React from 'react';
import { Link } from 'react-router-dom';

export default function Homepage() {
  return (
    <div className="homepage">
      <section className="hero">
        <h1>NonFictionFooty</h1>
        <p className="tagline">Generate short football story videos and export them for manual upload.</p>
        <Link to="/create" className="btn btn-primary cta">Create video</Link>
      </section>
      <section className="section">
        <h2>What it does</h2>
        <p>NonFictionFooty generates script, voiceover, subtitles, and visuals for short football stories. You get a 9:16 MP4, caption, hashtags, and SRT — then upload manually to your preferred platform.</p>
      </section>
      <section className="section">
        <h2>How it works</h2>
        <ol className="steps">
          <li><strong>Create</strong> — Enter topic, team or player, era or match, tone, and duration. We start a generation job.</li>
          <li><strong>Library</strong> — See your recent jobs and their status. Open any completed job to export.</li>
          <li><strong>Export</strong> — Download the MP4, copy caption and hashtags, download SRT and cover image. Use the posting checklist and upload manually.</li>
        </ol>
      </section>
      <section className="section cta-section">
        <Link to="/create" className="btn btn-primary">Create video</Link>
        <p className="small"><Link to="/library">Library</Link> · <Link to="/about">About / Contact</Link> · <Link to="/app-review">How exports work</Link></p>
      </section>
    </div>
  );
}
