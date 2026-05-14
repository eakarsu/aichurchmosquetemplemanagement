import React, { useState, useEffect } from 'react';
import { Zap, Plus, Trash2, Send } from 'lucide-react';

function Webhooks() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', events: '', active: true });
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/webhooks', { headers });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : (data.webhooks || data.items || []));
    } catch (e) { setError('Failed to fetch webhooks'); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const body = { ...form, events: form.events.split(',').map(s => s.trim()).filter(Boolean) };
    try {
      const res = await fetch('/api/webhooks', { method: 'POST', headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Save failed');
      setShowForm(false);
      setForm({ name: '', url: '', events: '', active: true });
      load();
    } catch (e) { setError(e.message); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await fetch(`/api/webhooks/${id}`, { method: 'DELETE', headers }); load(); } catch (e) { setError(e.message); }
  };

  const testDeliver = async (id) => {
    setTestResult(null);
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: 'POST', headers, body: JSON.stringify({ event: 'test', payload: { hello: 'world' } }) });
      const data = await res.json();
      setTestResult({ id, ok: res.ok, data });
    } catch (e) { setTestResult({ id, ok: false, data: { error: e.message } }); }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Zap size={24} /> Webhooks</h1>
          <p className="page-subtitle">Outbound webhook registry</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> New</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? <div className="loading">Loading...</div> : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>URL</th><th>Events</th><th>Active</th><th></th></tr>
            </thead>
            <tbody>
              {items.map(w => (
                <tr key={w.id}>
                  <td><strong>{w.name}</strong></td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.url}</td>
                  <td>{(w.events || []).join(', ')}</td>
                  <td>{w.active ? 'yes' : 'no'}</td>
                  <td>
                    <button className="btn-icon" title="Test delivery" onClick={() => testDeliver(w.id)}><Send size={14} /></button>
                    <button className="btn-icon" onClick={() => remove(w.id)}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>No webhooks</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {testResult && (
        <div className="card" style={{ marginTop: '12px', background: testResult.ok ? '#ECFDF5' : '#FEE2E2' }}>
          <strong>Test result for #{testResult.id}:</strong>
          <pre style={{ overflow: 'auto', fontSize: '12px' }}>{JSON.stringify(testResult.data, null, 2)}</pre>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Webhook</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>URL</label>
                <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} required placeholder="https://..." />
              </div>
              <div className="form-group">
                <label>Events (comma-separated)</label>
                <input value={form.events} onChange={e => setForm({ ...form, events: e.target.value })} placeholder="donation.created, member.added" />
              </div>
              <div className="form-group">
                <label><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active</label>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Webhooks;
