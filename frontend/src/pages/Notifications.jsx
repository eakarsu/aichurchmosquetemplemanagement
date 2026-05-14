import React, { useState, useEffect } from 'react';
import { Bell, Plus, Check, Trash2 } from 'lucide-react';

function Notifications() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'info', user_id: '' });
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/notifications', { headers });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : (data.notifications || data.items || []));
      try {
        const c = await fetch('/api/notifications/unread-count', { headers });
        const cd = await c.json();
        setUnread(cd.count || cd.unread || 0);
      } catch (_) {}
    } catch (e) {
      setError('Failed to fetch notifications');
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/notifications', { method: 'POST', headers, body: JSON.stringify(form) });
      if (!res.ok) throw new Error('Save failed');
      setShowForm(false);
      setForm({ title: '', message: '', type: 'info', user_id: '' });
      load();
    } catch (e) { setError(e.message); }
  };

  const markRead = async (id) => {
    try { await fetch(`/api/notifications/${id}/read`, { method: 'PUT', headers }); load(); } catch (e) { setError(e.message); }
  };

  const markAllRead = async () => {
    try { await fetch('/api/notifications/mark-all-read', { method: 'POST', headers }); load(); } catch (e) { setError(e.message); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await fetch(`/api/notifications/${id}`, { method: 'DELETE', headers }); load(); } catch (e) { setError(e.message); }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Bell size={24} /> Notifications</h1>
          <p className="page-subtitle">{unread} unread</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={markAllRead}><Check size={16} /> Mark all read</button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> New</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? <div className="loading">Loading...</div> : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr><th>Title</th><th>Message</th><th>Type</th><th>Status</th><th>Created</th><th></th></tr>
            </thead>
            <tbody>
              {items.map(n => (
                <tr key={n.id}>
                  <td><strong>{n.title}</strong></td>
                  <td>{n.message}</td>
                  <td><span className="badge">{n.type || 'info'}</span></td>
                  <td>{n.read || n.is_read ? 'read' : 'unread'}</td>
                  <td>{n.created_at ? new Date(n.created_at).toLocaleString() : '-'}</td>
                  <td>
                    {!(n.read || n.is_read) && <button className="btn-icon" onClick={() => markRead(n.id)}><Check size={14} /></button>}
                    <button className="btn-icon" onClick={() => remove(n.id)}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>No notifications</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Notification</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Title</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <div className="form-group">
                <label>User ID (optional)</label>
                <input value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} />
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

export default Notifications;
