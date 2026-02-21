import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, routes } from '../api';
import { useToast } from '../ToastContext';

export default function Create() {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('custom');
  const [teamOrPlayer, setTeamOrPlayer] = useState('');
  const [eraOrMatch, setEraOrMatch] = useState('');
  const [tone, setTone] = useState('factual');
  const [durationSec, setDurationSec] = useState(45);
  const [stylePreset, setStylePreset] = useState('default');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(routes.generate(), {
        topic: (topic || '').trim() || 'short video',
        teamOrPlayer: (teamOrPlayer || '').trim() || undefined,
        eraOrMatch: (eraOrMatch || '').trim() || undefined,
        tone,
        durationSec: Math.min(120, Math.max(30, durationSec)),
        stylePreset: stylePreset || 'default',
        category: category || undefined,
      });
      const jobId = res?.jobId;
      if (!jobId || String(jobId) === 'null') {
        toast.error('Server did not return a job ID');
        return;
      }
      toast.success('Job started');
      navigate(`/export/${jobId}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>Create video</h1>
      <form onSubmit={submit} className="form">
        <label>Topic *</label>
        <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Why compound interest matters, World Cup 1986" required />
        <label>Category</label>
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="custom">Custom</option>
          <option value="soccer">Soccer</option>
          <option value="motivation">Motivation</option>
          <option value="history">History</option>
          <option value="finance">Finance</option>
          <option value="tech">Tech</option>
        </select>
        <label>Context 1 (optional)</label>
        <input type="text" value={teamOrPlayer} onChange={e => setTeamOrPlayer(e.target.value)} placeholder="e.g. person, event, concept" />
        <label>Context 2 (optional)</label>
        <input type="text" value={eraOrMatch} onChange={e => setEraOrMatch(e.target.value)} placeholder="e.g. era, match, timeframe" />
        <label>Tone</label>
        <select value={tone} onChange={e => setTone(e.target.value)}>
          <option value="factual">Factual</option>
          <option value="dramatic">Dramatic</option>
          <option value="inspiring">Inspiring</option>
        </select>
        <label>Duration (seconds, 30–120)</label>
        <input type="number" min={30} max={120} value={durationSec} onChange={e => setDurationSec(Number(e.target.value))} />
        <label>Style preset</label>
        <select value={stylePreset} onChange={e => setStylePreset(e.target.value)}>
          <option value="default">Default</option>
        </select>
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Starting…' : 'Generate'}</button>
      </form>
    </div>
  );
}
