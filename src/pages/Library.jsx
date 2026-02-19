import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, routes } from '../api';

export default function Library() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(routes.jobs()).then(d => setJobs(d.jobs || [])).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <h1>Library</h1>
      {error && <p className="error">{error}</p>}
      {loading ? <p className="muted">Loading…</p> : jobs.length === 0 ? (
        <p className="muted">No jobs yet. <Link to="/create">Create</Link> one.</p>
      ) : (
        <ul className="job-list">
          {jobs.map(j => (
            <li key={j.id}>
              <Link to={`/export/${j.id}`}>
                {j.topic || j.id} — <span className={`status-${j.status}`}>{j.status}</span> — {new Date(j.created_at).toLocaleString()}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
