import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, routes } from '../api';

const STATUS_COLORS = {
  DRAFT: 'status-draft',
  APPROVED: 'status-approved',
  UPLOADED_DRAFT: 'status-uploaded',
  NEEDS_FIX: 'status-fix',
};

export default function Dashboard() {
  const [drafts, setDrafts] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const path = filter ? `${routes.drafts()}?status=${encodeURIComponent(filter)}` : routes.drafts();
    api.get(path).then((d) => setDrafts(d.drafts || [])).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="page dashboard">
      <div className="page-header">
        <h1>Drafts</h1>
        <Link to="/drafts/new" className="btn btn-primary">New draft</Link>
      </div>
      <div className="filter-bar">
        <span>Filter:</span>
        {['', 'DRAFT', 'APPROVED', 'UPLOADED_DRAFT', 'NEEDS_FIX'].map((s) => (
          <button
            key={s || 'all'}
            className={`chip ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s || 'All'}
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : drafts.length === 0 ? (
        <p className="muted">No drafts yet. Create one from New draft.</p>
      ) : (
        <ul className="draft-list">
          {drafts.map((d) => (
            <li key={d.id} className="draft-card">
              <Link to={`/drafts/${d.id}`} className="draft-card-link">
                <span className={`status-chip ${STATUS_COLORS[d.status] || ''}`}>{d.status}</span>
                <span className="draft-headline">{d.headline || d.id}</span>
                <span className="draft-meta">{new Date(d.created_at).toLocaleDateString()} · {d.chosen_slide_count ?? '?'} slides</span>
                {d.tiktok_publish_id && <span className="draft-publish-id">TikTok: {d.tiktok_publish_id}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
