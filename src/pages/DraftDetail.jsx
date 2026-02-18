import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, routes } from '../api';
import { useToast } from '../ToastContext';

const STATUS_COLORS = {
  DRAFT: 'status-draft',
  APPROVED: 'status-approved',
  UPLOADED_DRAFT: 'status-uploaded',
  NEEDS_FIX: 'status-fix',
};

function parseJson(s, fallback) {
  if (!s) return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

export default function DraftDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chosenIndices, setChosenIndices] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDraft = () => {
    api.get(routes.draft(id)).then((d) => setDraft(d.draft)).catch(() => toast.error('Draft not found')).finally(() => setLoading(false));
  };
  useEffect(() => fetchDraft(), [id]);

  const candidates = draft ? parseJson(draft.image_candidates_json, []) : [];
  const chosenImages = draft ? parseJson(draft.chosen_images_json, []) : [];
  const story = draft?.story_json ? parseJson(draft.story_json, { slides: [] }) : { slides: [] };

  const toggleCandidate = (idx) => {
    setChosenIndices((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx].sort((a, b) => a - b)));
  };

  const removeChosen = (idx) => {
    setChosenIndices((prev) => prev.filter((i) => i !== idx).sort((a, b) => a - b));
  };

  const approve = async () => {
    setActionLoading('approve');
    try {
      const { draft: updated } = await api.post(routes.approve(id));
      setDraft(updated);
      toast.success('Draft approved');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const regenerateImages = async () => {
    setActionLoading('regenerate');
    try {
      const { draft: updated } = await api.post(routes.regenerateImages(id));
      setDraft(updated);
      setChosenIndices([]);
      toast.success('New image candidates loaded');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const uploadToTikTok = async () => {
    const toSend = chosenIndices.length ? chosenIndices.map((i) => candidates[i]) : candidates.slice(0, draft.chosen_slide_count || 10);
    if (!toSend.length) {
      toast.error('Select at least one image');
      return;
    }
    setActionLoading('upload');
    try {
      const { draft: updated, publish_id } = await api.post(routes.upload(id), { chosen_images: toSend });
      setDraft(updated);
      toast.success(`TikTok draft created. publish_id: ${publish_id}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !draft) return <div className="page"><p className="muted">Loading…</p></div>;

  const displayCandidates = chosenIndices.length ? chosenIndices.map((i) => candidates[i]).filter(Boolean) : candidates.slice(0, draft.chosen_slide_count || 10);
  const canUpload = (chosenIndices.length || candidates.length) && (chosenIndices.length <= 35 && (chosenIndices.length || (draft.chosen_slide_count || 0) <= 35));

  return (
    <div className="page draft-detail">
      <div className="draft-detail-header">
        <button type="button" className="btn back" onClick={() => navigate('/')}>← Back</button>
        <span className={`status-chip ${STATUS_COLORS[draft.status] || ''}`}>{draft.status}</span>
      </div>
      <h1 className="draft-headline">{draft.headline || 'Untitled'}</h1>
      {draft.caption && <p className="caption-preview">{draft.caption}</p>}
      {draft.hashtags && <p className="hashtags">{draft.hashtags}</p>}
      {draft.tiktok_publish_id && (
        <p className="publish-id-box">
          TikTok <code>publish_id</code>: {draft.tiktok_publish_id}
        </p>
      )}
      {draft.status === 'UPLOADED_DRAFT' && (
        <div className="instruction-box">
          Open TikTok inbox notification to continue editing & post.
        </div>
      )}

      {story.slides?.length > 0 && (
        <section className="story-section">
          <h2>Story slides</h2>
          <ol className="story-slides">
            {story.slides.map((s, i) => (
              <li key={i}>{s.text}</li>
            ))}
          </ol>
        </section>
      )}

      <section className="images-section">
        <div className="images-section-head">
          <h2>Image candidates</h2>
          <button type="button" className="btn btn-secondary" onClick={regenerateImages} disabled={!!actionLoading}>
            {actionLoading === 'regenerate' ? '…' : 'Regenerate images'}
          </button>
        </div>
        <p className="hint">Click to select/deselect for TikTok (max 35). Order = slide order.</p>
        <div className="image-grid">
          {candidates.map((c, i) => (
            <div key={i} className={`image-card ${chosenIndices.includes(i) ? 'chosen' : ''}`}>
              <img src={c.url} alt="" loading="lazy" onError={(e) => e.target.style.background = '#333'} />
              <div className="image-meta">
                <span className="license">{c.license}</span>
                <span className="attribution">{c.attribution}</span>
              </div>
              <button type="button" className="btn img-btn" onClick={() => toggleCandidate(i)} title={chosenIndices.includes(i) ? 'Remove' : 'Add'}>
                {chosenIndices.includes(i) ? '✓ Remove' : 'Add'}
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="chosen-order">
        {chosenIndices.length > 0 && (
          <p>Chosen order: {chosenIndices.map((i) => candidates[i]?.url?.slice(0, 30)).join(' → ')} …</p>
        )}
      </div>

      <div className="actions">
        {draft.status === 'DRAFT' && (
          <button type="button" className="btn btn-primary" onClick={approve} disabled={!!actionLoading}>
            {actionLoading === 'approve' ? '…' : 'Approve draft'}
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={uploadToTikTok}
          disabled={!!actionLoading || !canUpload}
        >
          {actionLoading === 'upload' ? 'Uploading…' : 'Upload to TikTok (create draft)'}
        </button>
      </div>
    </div>
  );
}
