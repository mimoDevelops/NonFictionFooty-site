import React from 'react';
import { Link } from 'react-router-dom';
import { api, routes } from '../api';

export default function Homepage() {
  return (
    <div className="homepage">
      <section className="hero">
        <h1>NonFictionFooty</h1>
        <p className="tagline">Turn football stories into TikTok photo drafts in minutes.</p>
        <a href={routes.tiktokLogin()} className="btn btn-primary cta">Connect TikTok</a>
      </section>

      <section className="section">
        <h2>What it does</h2>
        <p>NonFictionFooty helps you create short, fact-based football story drafts and upload them to TikTok as photo posts. You connect your TikTok account once, then create drafts in the app. We fetch rights-cleared images (e.g. Wikimedia Commons), you review and approve, and we send the post to TikTok as a <strong>draft</strong> so you can edit and publish from the TikTok app.</p>
      </section>

      <section className="section">
        <h2>How it works</h2>
        <ol className="steps">
          <li><strong>Connect TikTok</strong> — Authorize once with your TikTok account so we can create drafts on your behalf.</li>
          <li><strong>Create a draft</strong> — Enter a topic (e.g. soccer history), choose slide count and tone. We generate a story and image candidates.</li>
          <li><strong>Review and upload</strong> — Approve your draft, pick images, then click “Upload to TikTok.” We create a draft in your TikTok account; you finish editing and post from the TikTok app.</li>
        </ol>
      </section>

      <section className="section">
        <h2>Key features</h2>
        <ul className="features">
          <li>Login with TikTok (Login Kit) — one-time connection</li>
          <li>Draft creation with story and image suggestions</li>
          <li>Rights-cleared images (Wikimedia Commons, optional Unsplash) with attribution</li>
          <li>Upload to TikTok as draft only — you control when to publish</li>
          <li>No automatic posting; all posts go through your TikTok inbox as drafts</li>
        </ul>
      </section>

      <section className="section">
        <h2>Who it’s for</h2>
        <p>Creators and fans who want to share short football stories on TikTok without manually sourcing images or building posts from scratch. Ideal for fact-based, story-style content.</p>
      </section>

      <section className="section cta-section">
        <a href={routes.tiktokLogin()} className="btn btn-primary">Connect TikTok</a>
        <p className="small"><Link to="/drafts">Go to Drafts</Link> · <Link to="/about">About / Contact</Link> · <Link to="/app-review">TikTok integration details</Link></p>
      </section>
    </div>
  );
}
