import React, { useState, useEffect } from 'react';
import { BarChart3, Download, RefreshCw } from 'lucide-react';

function Reports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reports/summary', { headers });
      const data = await res.json();
      setSummary(data);
    } catch (e) { setError('Failed to load summary'); }
    setLoading(false);
  };

  const downloadCsv = (resource) => {
    fetch(`/api/reports/${resource}.csv`, { headers })
      .then(r => r.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${resource}.csv`;
        document.body.appendChild(a); a.click(); a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(e => setError(e.message));
  };

  const csvs = ['donations', 'members', 'events', 'attendance'];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title"><BarChart3 size={24} /> Reports</h1>
          <p className="page-subtitle">Resource summary and CSV exports</p>
        </div>
        <button className="btn btn-secondary" onClick={load}><RefreshCw size={16} /> Refresh</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? <div className="loading">Loading...</div> : (
        <>
          <div className="stat-grid">
            {summary && Object.entries(summary).map(([k, v]) => (
              <div key={k} className="stat-card">
                <div className="stat-value">{typeof v === 'number' ? v : '-'}</div>
                <div className="stat-label">{k.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: '16px' }}>
            <h3>CSV Exports</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
              {csvs.map(c => (
                <button key={c} className="btn btn-secondary" onClick={() => downloadCsv(c)}>
                  <Download size={14} /> {c}.csv
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Reports;
