import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api, routes } from '../api';
import { useToast } from '../ToastContext';

export default function Export() {
  const { jobId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const toast = useToast();

  const validJobId = jobId && String(jobId) !== 'null' && String(jobId) !== 'undefined';

  useEffect(() => {
    if (!validJobId) {
      setData({ error: 'Invalid job' });
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function fetch_() {
      try {
        const res = await api.get(routes.job(jobId));
        if (!cancelled) setData(res);
        if (res.status === 'pending' && !cancelled) {
          setPolling(true);
          const t = setInterval(async () => {
            const r = await api.get(routes.job(jobId));
            if (!cancelled) setData(r);
            if (r.status !== 'pending') {
              clearInterval(t);
              setPolling(false);
            }
          }, 2000);
          return () => clearInterval(t);
        }
      } catch (e) {
        const msg = e?.message || e?.toString?.() || 'Request failed';
        if (!cancelled) setData({ error: msg });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch_();
    return () => { cancelled = true; };
  }, [jobId, validJobId]);

  const copyCaption = () => {
    if (data?.caption) {
      navigator.clipboard.writeText(data.caption);
      toast.success('Caption copied');
    }
  };
  const copyHashtags = () => {
    if (data?.hashtags) {
      navigator.clipboard.writeText(data.hashtags);
      toast.success('Hashtags copied');
    }
  };

  if (loading || !data) return <div className="page"><p className="muted">Loading…</p></div>;
  // Only show full-page error when the request failed (no job) or job status is failed.
  // Completed/pending jobs may have job.error set in DB; don't treat that as a page error.
  const isRequestError = data.error && data.status !== 'completed' && data.status !== 'pending';
  const errMsg = (data.error == null || String(data.error) === 'null' || String(data.error) === 'undefined')
    ? 'Something went wrong' : String(data.error);
  if (isRequestError) return <div className="page"><p className="error">{errMsg}</p></div>;

  const urls = data.downloadUrls || {};
  const base = routes.job(jobId);

  return (
    <div className="page export-page">
      <h1>Export — {data.jobId && String(data.jobId) !== 'null' ? String(data.jobId).slice(0, 8) : '…'}</h1>
      <p className="status-line">Status: <strong>{data.status ?? '—'}</strong></p>

      {Array.isArray(data.steps) && data.steps.length > 0 && (
        <ul className="step-progress" style={{ listStyle: 'none', paddingLeft: 0, fontSize: '0.9rem', color: 'var(--muted, #888)' }}>
          {data.steps.map((s) => (
            <li key={s.name} style={{ marginBottom: '0.25rem' }}>
              {s.status === 'completed' && '✓ '}
              {s.status === 'running' && '… '}
              {s.status === 'failed' && '✗ '}
              {s.name.replace(/_/g, ' ')} {s.status && `(${s.status})`}
            </li>
          ))}
        </ul>
      )}

      {data.status === 'pending' && <p className="muted">Processing… {polling && '(polling)'}</p>}
      {data.status === 'failed' && <p className="error">{data.error ?? 'Job failed'}</p>}

      {data.status === 'completed' && (
        <>
          <section className="export-section">
            <h2>Video preview</h2>
            <p className="muted" style={{ marginBottom: '0.5rem' }}>
              Preview. If you see only a short placeholder clip, enable LLM + video worker for full videos (see README).
            </p>
            <video
              key={jobId}
              src={urls.mp4 ? (typeof urls.mp4 === 'string' && urls.mp4.startsWith('http') ? urls.mp4 : base + '/download') : ''}
              controls
              playsInline
              className="video-preview"
              style={{ maxWidth: '100%', aspectRatio: '9/16' }}
            />
          </section>
          <section className="export-actions">
            <h2>Download & copy</h2>
            <div className="button-row">
              <a href={urls.mp4 ? base + '/download' : '#'} download className="btn btn-primary">Download MP4</a>
              <button type="button" className="btn" onClick={copyCaption}>Copy caption</button>
              <button type="button" className="btn" onClick={copyHashtags}>Copy hashtags</button>
              <a href={urls.srt ? base + '/asset/srt' : '#'} download className="btn">Download SRT</a>
              <a href={urls.cover ? base + '/asset/cover' : '#'} download className="btn">Download cover</a>
            </div>
          </section>
          <section className="checklist">
            <h2>Posting checklist</h2>
            <ul>
              <li>Download the MP4</li>
              <li>Copy caption and hashtags into your post</li>
              <li>Upload the video manually to your platform</li>
              <li>Add SRT as subtitles if supported</li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
