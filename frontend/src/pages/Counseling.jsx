import React, { useState, useEffect } from 'react';
import { Search, Plus, HeartHandshake, Sparkles, Shield } from 'lucide-react';
import DetailModal from '../components/DetailModal';
import AIResponseDisplay from '../components/AIResponseDisplay';

const emptySession = {
  client_name: '', counselor: '', session_date: '', session_type: 'pastoral',
  status: 'scheduled', is_confidential: true, topic: '', notes: '',
  follow_up_date: '', duration: '60',
};

function Counseling() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptySession);
  const [editingId, setEditingId] = useState(null);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  useEffect(() => { fetchSessions(); }, []);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/counseling', { headers });
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : (data.data || []));
    } catch { showToast('Failed to fetch sessions', 'error'); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const body = { ...formData, duration: parseInt(formData.duration) || 60 };
    try {
      const url = editingId ? `/api/counseling/${editingId}` : '/api/counseling';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed');
      showToast(editingId ? 'Session updated!' : 'Session scheduled!');
      setShowForm(false); setEditingId(null); setFormData(emptySession); fetchSessions();
    } catch { showToast('Failed to save', 'error'); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/counseling/${id}`, { method: 'DELETE', headers });
      showToast('Session deleted'); setShowDetail(false); setSelected(null); fetchSessions();
    } catch { showToast('Failed to delete', 'error'); }
  };

  const handleEdit = (s) => {
    setFormData({
      client_name: s.client_name || '', counselor: s.counselor || '',
      session_date: s.session_date ? s.session_date.slice(0, 16) : '',
      session_type: s.session_type || 'pastoral', status: s.status || 'scheduled',
      is_confidential: s.is_confidential !== false, topic: s.topic || '',
      notes: s.notes || '', follow_up_date: s.follow_up_date ? s.follow_up_date.slice(0, 10) : '',
      duration: s.duration || '60',
    });
    setEditingId(s.id); setShowDetail(false); setShowForm(true);
  };

  const handleAiPrep = async (session) => {
    setAiLoading(true); setAiTitle('AI Session Preparation'); setAiResponse('');
    try {
      const res = await fetch('/api/counseling/ai-session-prep', { method: 'POST', headers,
        body: JSON.stringify({ session_type: session?.session_type || 'pastoral', topic: session?.topic || 'general guidance', notes: session?.notes || '' }) });
      const data = await res.json();
      setAiResponse(data.preparation || data.response || data.result || JSON.stringify(data));
    } catch { setAiResponse('Failed to generate preparation notes.'); }
    setAiLoading(false);
  };

  const filtered = sessions.filter(s =>
    (s.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.counselor || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.topic || '').toLowerCase().includes(search.toLowerCase())
  );

  const typeLabel = (t) => (t || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const statusColor = (s) => s === 'completed' ? 'active' : s === 'scheduled' ? 'pending' : s === 'cancelled' ? 'inactive' : 'pending';
  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  if (loading) return <div className="loading-container"><div className="loading-spinner lg" /><p>Loading sessions...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1>Counseling Sessions</h1><p>Manage pastoral counseling appointments</p></div>
        <div className="page-header-actions">
          <button className="btn btn-ai" onClick={() => handleAiPrep(null)}><Sparkles size={16} /> AI Session Prep</button>
          <button className="btn btn-primary" onClick={() => { setFormData(emptySession); setEditingId(null); setShowForm(true); }}><Plus size={16} /> Schedule Session</button>
        </div>
      </div>

      <div className="search-bar"><div className="search-wrapper"><Search size={18} /><input placeholder="Search sessions..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>

      <AIResponseDisplay response={aiResponse} title={aiTitle} isLoading={aiLoading} />

      {filtered.length === 0 ? (
        <div className="empty-state"><HeartHandshake size={48} /><p>No counseling sessions found.</p></div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr><th>Client</th><th>Counselor</th><th>Date</th><th>Type</th><th>Topic</th><th>Duration</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="table-row" onClick={() => { setSelected(s); setShowDetail(true); }}>
                  <td style={{ fontWeight: 500 }}>{s.client_name}</td>
                  <td>{s.counselor}</td>
                  <td>{s.session_date ? new Date(s.session_date).toLocaleDateString() : '-'}</td>
                  <td><span className="tag">{typeLabel(s.session_type)}</span></td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.topic || '-'}</td>
                  <td>{s.duration || 60} min</td>
                  <td><span className={`badge badge-${statusColor(s.status)}`}>{s.status}</span></td>
                  <td>{s.is_confidential && <Shield size={14} style={{ color: '#e2b04a' }} title="Confidential" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDetail && selected && (
        <DetailModal isOpen={showDetail} onClose={() => { setShowDetail(false); setSelected(null); }} title={`Session: ${selected.client_name}`} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected.id)}>
          <div className="detail-view">
            <div className="detail-row">
              <div className="detail-field"><span className="field-label">Client</span><span className="field-value">{selected.client_name}</span></div>
              <div className="detail-field"><span className="field-label">Counselor</span><span className="field-value">{selected.counselor}</span></div>
            </div>
            <div className="detail-row">
              <div className="detail-field"><span className="field-label">Date & Time</span><span className="field-value">{selected.session_date ? new Date(selected.session_date).toLocaleString() : '-'}</span></div>
              <div className="detail-field"><span className="field-label">Duration</span><span className="field-value">{selected.duration || 60} minutes</span></div>
            </div>
            <div className="detail-row">
              <div className="detail-field"><span className="field-label">Type</span><span className="field-value"><span className="tag">{typeLabel(selected.session_type)}</span></span></div>
              <div className="detail-field"><span className="field-label">Status</span><span className="field-value"><span className={`badge badge-${statusColor(selected.status)}`}>{selected.status}</span></span></div>
            </div>
            <div className="detail-row">
              <div className="detail-field"><span className="field-label">Confidential</span><span className="field-value">{selected.is_confidential ? 'Yes' : 'No'}</span></div>
              <div className="detail-field"><span className="field-label">Follow-up Date</span><span className="field-value">{selected.follow_up_date ? new Date(selected.follow_up_date).toLocaleDateString() : '-'}</span></div>
            </div>
            <div className="detail-field"><span className="field-label">Topic</span><span className="field-value">{selected.topic || '-'}</span></div>
            <div className="detail-field"><span className="field-label">Notes</span><span className="field-value">{selected.notes || '-'}</span></div>
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-ai" onClick={() => handleAiPrep(selected)}><Sparkles size={16} /> AI Prepare for Session</button>
            </div>
            <AIResponseDisplay response={aiResponse} title={aiTitle} isLoading={aiLoading} />
          </div>
        </DetailModal>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setEditingId(null); } }}>
          <div className="modal-content">
            <div className="modal-header"><h2>{editingId ? 'Edit' : 'Schedule'} Session</h2><button className="modal-close" onClick={() => { setShowForm(false); setEditingId(null); }}><span style={{ fontSize: 20 }}>&times;</span></button></div>
            <div className="modal-body">
              <form onSubmit={handleCreate}>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Client Name *</label><input className="form-input" value={formData.client_name} onChange={(e) => updateField('client_name', e.target.value)} required /></div>
                  <div className="form-group"><label className="form-label">Counselor *</label>
                    <select className="form-select" value={formData.counselor} onChange={(e) => updateField('counselor', e.target.value)}>
                      <option value="">Select...</option>
                      <option value="Pastor James Wilson">Pastor James Wilson</option>
                      <option value="Rev. Maria Santos">Rev. Maria Santos</option>
                      <option value="Patricia Nelson">Patricia Nelson</option>
                      <option value="Imam Ahmed Hassan">Imam Ahmed Hassan</option>
                    </select></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Date & Time *</label><input className="form-input" type="datetime-local" value={formData.session_date} onChange={(e) => updateField('session_date', e.target.value)} required /></div>
                  <div className="form-group"><label className="form-label">Duration (min)</label><input className="form-input" type="number" min="15" step="15" value={formData.duration} onChange={(e) => updateField('duration', e.target.value)} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Session Type</label>
                    <select className="form-select" value={formData.session_type} onChange={(e) => updateField('session_type', e.target.value)}>
                      <option value="pastoral">Pastoral</option><option value="marriage">Marriage</option><option value="grief">Grief</option>
                      <option value="youth">Youth</option><option value="pre_marriage">Pre-Marriage</option><option value="family">Family</option>
                      <option value="spiritual_direction">Spiritual Direction</option><option value="crisis">Crisis</option>
                    </select></div>
                  <div className="form-group"><label className="form-label">Status</label>
                    <select className="form-select" value={formData.status} onChange={(e) => updateField('status', e.target.value)}>
                      <option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="follow_up">Follow Up</option>
                    </select></div>
                </div>
                <div className="form-group"><label className="form-label">Topic</label><input className="form-input" value={formData.topic} onChange={(e) => updateField('topic', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Follow-up Date</label><input className="form-input" type="date" value={formData.follow_up_date} onChange={(e) => updateField('follow_up_date', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={formData.notes} onChange={(e) => updateField('notes', e.target.value)} rows={3} /></div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.is_confidential} onChange={(e) => updateField('is_confidential', e.target.checked)} />
                    <span className="form-label" style={{ margin: 0 }}>Confidential</span>
                  </label>
                </div>
                <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 16 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Schedule'} Session</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}

export default Counseling;
