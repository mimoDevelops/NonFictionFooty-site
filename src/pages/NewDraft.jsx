import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, routes } from '../api';
import { useToast } from '../ToastContext';

export default function NewDraft() {
  const [nicheSeed, setNicheSeed] = useState('soccer-history');
  const [minSlides, setMinSlides] = useState(3);
  const [maxSlides, setMaxSlides] = useState(10);
  const [tone, setTone] = useState('factual');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    const min = Math.min(35, Math.max(1, minSlides));
    const max = Math.min(35, Math.max(min, maxSlides));
    setLoading(true);
    try {
      const { draft } = await api.post(routes.drafts(), {
        niche_seed: nicheSeed,
        min_slides: min,
        max_slides: max,
        tone,
      });
      toast.success('Draft created');
      navigate(`/drafts/${draft.id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page new-draft">
      <h1>Generate draft</h1>
      <form onSubmit={submit} className="form">
        <label>
          Niche seed
          <input
            type="text"
            value={nicheSeed}
            onChange={(e) => setNicheSeed(e.target.value)}
            placeholder="e.g. soccer-history, world-cup-1986"
          />
        </label>
        <label>
          Min slides
          <input
            type="number"
            min={1}
            max={35}
            value={minSlides}
            onChange={(e) => setMinSlides(Number(e.target.value))}
          />
        </label>
        <label>
          Max slides
          <input
            type="number"
            min={1}
            max={35}
            value={maxSlides}
            onChange={(e) => setMaxSlides(Number(e.target.value))}
          />
        </label>
        <label>
          Tone
          <select value={tone} onChange={(e) => setTone(e.target.value)}>
            <option value="factual">Factual</option>
            <option value="dramatic">Dramatic</option>
            <option value="inspiring">Inspiring</option>
            <option value="quirky">Quirky</option>
          </select>
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating…' : 'Create draft'}
        </button>
      </form>
    </div>
  );
}
