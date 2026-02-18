import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { api, routes } from './api';

export default function Layout() {
  const [tiktokConnected, setTiktokConnected] = useState(false);
  useEffect(() => {
    api.get(routes.authStatus()).then((d) => setTiktokConnected(d.connected)).catch(() => setTiktokConnected(false));
  }, []);

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="logo">NonFictionFooty</Link>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/drafts">Drafts</Link>
          <Link to="/drafts/new">New draft</Link>
          {tiktokConnected ? (
            <span className="tiktok-badge connected">Connected to TikTok</span>
          ) : (
            <a href={routes.tiktokLogin()} className="tiktok-badge connect">Connect TikTok</a>
          )}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <Link to="/terms">Terms of Service</Link>
        <span className="sep">·</span>
        <Link to="/privacy">Privacy Policy</Link>
        <span className="sep">·</span>
        <Link to="/about">About / Contact</Link>
        <span className="sep">·</span>
        <Link to="/app-review">TikTok integration</Link>
      </footer>
    </div>
  );
}
