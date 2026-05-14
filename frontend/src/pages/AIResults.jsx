import React, { useEffect, useState } from 'react';
import { History, Trash2, Eye, X } from 'lucide-react';

const FEATURES = [
  '', 'sermon-analyzer', 'donation-insights', 'prayer-guidance', 'member-engagement',
  'event-planner', 'outreach-strategy', 'sermon-qa', 'volunteer-burnout',
  'prayer-categorize', 'facility-optimizer',
];

export default function AIResults() {
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 0 });
  const [feature, setFeature] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const load = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (feature) params.set('feature', feature);
      const res = await fetch(`/api/ai-results?${params.toString()}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load AI results');
      setResults(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, total_pages: 0 });
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(1); /* eslint-disable-next-line */ }, [feature]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this AI result?')) return;
    await fetch(`/api/ai-results/${id}`, { method: 'DELETE', headers });
    load(pagination.page);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><History size={24} /> AI Results History</h1>
        <p>Audit prior AI outputs (persisted JSONB in ai_results).</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={feature} onChange={(e) => setFeature(e.target.value)} className="form-input" style={{ width: 280, padding: 8 }}>
          {FEATURES.map(f => <option key={f} value={f}>{f || 'All features'}</option>)}
        </select>
        <button onClick={() => load(pagination.page)} disabled={loading} className="btn btn-secondary">
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="alert alert-danger" style={{ background: '#fee', padding: 12, color: '#c00', marginBottom: 16 }}>{error}</div>}

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: 12, textAlign: 'left' }}>ID</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Feature</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Model</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Created</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: 24 }}>No AI results yet.</td></tr>
            ) : results.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: 12 }}>{r.id}</td>
                <td style={{ padding: 12 }}><span style={{ background: '#e0e7ff', padding: '4px 8px', borderRadius: 4 }}>{r.feature}</span></td>
                <td style={{ padding: 12, fontSize: 12 }}>{r.model}</td>
                <td style={{ padding: 12 }}>{new Date(r.created_at).toLocaleString()}</td>
                <td style={{ padding: 12 }}>
                  <button onClick={() => setSelected(r)} className="btn btn-secondary" style={{ padding: '4px 8px', marginRight: 8 }}><Eye size={14} /> View</button>
                  <button onClick={() => handleDelete(r.id)} className="btn btn-danger" style={{ padding: '4px 8px' }}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center', justifyContent: 'center' }}>
        <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)} className="btn btn-secondary">Prev</button>
        <span>Page {pagination.page} of {pagination.total_pages || 1} ({pagination.total} total)</span>
        <button disabled={pagination.page >= pagination.total_pages} onClick={() => load(pagination.page + 1)} className="btn btn-secondary">Next</button>
      </div>

      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800, width: '90%', maxHeight: '85vh', overflow: 'auto', background: 'white', padding: 24, borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2>Result #{selected.id} - {selected.feature}</h2>
              <button onClick={() => setSelected(null)} className="btn btn-ghost"><X size={20} /></button>
            </div>
            <h3>Input</h3>
            <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, overflow: 'auto' }}>
              {JSON.stringify(selected.input, null, 2)}
            </pre>
            <h3>Output</h3>
            <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, overflow: 'auto' }}>
              {JSON.stringify(selected.output, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
