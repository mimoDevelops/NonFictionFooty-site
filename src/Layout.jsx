import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="logo">NonFictionFooty</Link>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/create">Create</Link>
          <Link to="/library">Library</Link>
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
        <Link to="/about">About</Link>
        <span className="sep">·</span>
        <Link to="/app-review">App Review</Link>
      </footer>
    </div>
  );
}
