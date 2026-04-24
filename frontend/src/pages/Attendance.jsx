import React, { useState, useEffect } from 'react';
import { Search, Plus, BarChart3, Sparkles, TrendingUp, Users, Eye } from 'lucide-react';
import DetailModal from '../components/DetailModal';
import AIResponseDisplay from '../components/AIResponseDisplay';

const emptyRecord = {
  service_name: '', service_date: '', service_type: 'sunday_morning',
  total_attendees: '', new_visitors: '0', online_viewers: '0',
  offering_collected: '0', notes: '', weather: 'sunny',
};

function Attendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyRecord);
  const [editingId, setEditingId] = useState(null);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  useEffect(() => { fetchRecords(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/attendance', { headers });
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : (data.data || []));
    } catch { showToast('Failed to fetch records', 'error'); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const body = {
      ...formData,
      total_attendees: parseInt(formData.total_attendees) || 0,
      new_visitors: parseInt(formData.new_visitors) || 0,
      online_viewers: parseInt(formData.online_viewers) || 0,
      offering_collected: parseFloat(formData.offering_collected) || 0,
    };
    try {
      const url = editingId ? `/api/attendance/${editingId}` : '/api/attendance';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed');
      showToast(editingId ? 'Record updated!' : 'Record created!');
      setShowForm(false); setEditingId(null); setFormData(emptyRecord); fetchRecords();
    } catch { showToast('Failed to save', 'error'); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/attendance/${id}`, { method: 'DELETE', headers });
      showToast('Record deleted'); setShowDetail(false); setSelected(null); fetchRecords();
    } catch { showToast('Failed to delete', 'error'); }
  };

  const handleEdit = (rec) => {
    setFormData({
      service_name: rec.service_name || '',
      service_date: rec.service_date ? rec.service_date.slice(0, 10) : '',
      service_type: rec.service_type || 'sunday_morning',
      total_attendees: rec.total_attendees || '',
      new_visitors: rec.new_visitors || '0',
      online_viewers: rec.online_viewers || '0',
      offering_collected: rec.offering_collected || '0',
      notes: rec.notes || '',
      weather: rec.weather || 'sunny',
    });
    setEditingId(rec.id); setShowDetail(false); setShowForm(true);
  };

  const handleAiInsights = async () => {
    setAiLoading(true); setAiTitle('AI Attendance Insights'); setAiResponse('');
    try {
      const res = await fetch('/api/attendance/ai-insights', { method: 'POST', headers,
        body: JSON.stringify({ records: records.slice(0, 20) }) });
      const data = await res.json();
      setAiResponse(data.insights || data.response || data.result || JSON.stringify(data));
    } catch { setAiResponse('Failed to generate insights.'); }
    setAiLoading(false);
  };

  const filtered = records.filter(r =>
    (r.service_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.service_type || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalAttendees = filtered.reduce((s, r) => s + (parseInt(r.total_attendees) || 0), 0);
  const avgAttendees = filtered.length ? Math.round(totalAttendees / filtered.length) : 0;
  const totalVisitors = filtered.reduce((s, r) => s + (parseInt(r.new_visitors) || 0), 0);

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const typeLabel = (t) => (t || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  if (loading) return <div className="loading-container"><div className="loading-spinner lg" /><p>Loading attendance...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1>Attendance Tracking</h1><p>Monitor service attendance and engagement</p></div>
        <div className="page-header-actions">
          <button className="btn btn-ai" onClick={handleAiInsights}><Sparkles size={16} /> AI Insights</button>
          <button className="btn btn-primary" onClick={() => { setFormData(emptyRecord); setEditingId(null); setShowForm(true); }}><Plus size={16} /> Record Attendance</button>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-header"><div className="stat-icon blue"><Users size={22} /></div></div><div className="stat-value">{totalAttendees.toLocaleString()}</div><div className="stat-label">Total Attendees</div></div>
        <div className="stat-card"><div className="stat-header"><div className="stat-icon teal"><BarChart3 size={22} /></div></div><div className="stat-value">{avgAttendees}</div><div className="stat-label">Avg per Service</div></div>
        <div className="stat-card"><div className="stat-header"><div className="stat-icon green"><TrendingUp size={22} /></div></div><div className="stat-value">{totalVisitors}</div><div className="stat-label">New Visitors</div></div>
        <div className="stat-card"><div className="stat-header"><div className="stat-icon gold"><Eye size={22} /></div></div><div className="stat-value">{filtered.length}</div><div className="stat-label">Services Tracked</div></div>
      </div>

      <div className="search-bar"><div className="search-wrapper"><Search size={18} /><input placeholder="Search records..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>

      <AIResponseDisplay response={aiResponse} title={aiTitle} isLoading={aiLoading} />

      {filtered.length === 0 ? (
        <div className="empty-state"><BarChart3 size={48} /><p>No attendance records found.</p></div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr><th>Service</th><th>Date</th><th>Type</th><th>Attendees</th><th>Visitors</th><th>Online</th><th>Weather</th></tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="table-row" onClick={() => { setSelected(r); setShowDetail(true); }}>
                  <td style={{ fontWeight: 500 }}>{r.service_name}</td>
                  <td>{r.service_date ? new Date(r.service_date).toLocaleDateString() : '-'}</td>
                  <td><span className="tag">{typeLabel(r.service_type)}</span></td>
                  <td style={{ fontWeight: 600 }}>{r.total_attendees}</td>
                  <td>{r.new_visitors || 0}</td>
                  <td>{r.online_viewers || 0}</td>
                  <td>{r.weather || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDetail && selected && (
        <DetailModal isOpen={showDetail} onClose={() => { setShowDetail(false); setSelected(null); }} title={selected.service_name} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected.id)}>
          <div className="detail-view">
            <div className="detail-row">
              <div className="detail-field"><span className="field-label">Service Date</span><span className="field-value">{selected.service_date ? new Date(selected.service_date).toLocaleDateString() : '-'}</span></div>
              <div className="detail-field"><span className="field-label">Service Type</span><span className="field-value">{typeLabel(selected.service_type)}</span></div>
            </div>
            <div className="detail-row">
              <div className="detail-field"><span className="field-label">Total Attendees</span><span className="field-value" style={{ fontSize: '1.3rem', fontWeight: 700, color: '#4ecdc4' }}>{selected.total_attendees}</span></div>
              <div className="detail-field"><span className="field-label">New Visitors</span><span className="field-value">{selected.new_visitors || 0}</span></div>
            </div>
            <div className="detail-row">
              <div className="detail-field"><span className="field-label">Online Viewers</span><span className="field-value">{selected.online_viewers || 0}</span></div>
              <div className="detail-field"><span className="field-label">Offering Collected</span><span className="field-value" style={{ color: '#4ade80' }}>${parseFloat(selected.offering_collected || 0).toLocaleString()}</span></div>
            </div>
            <div className="detail-row">
              <div className="detail-field"><span className="field-label">Weather</span><span className="field-value">{selected.weather || '-'}</span></div>
            </div>
            <div className="detail-field"><span className="field-label">Notes</span><span className="field-value">{selected.notes || '-'}</span></div>
          </div>
        </DetailModal>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setEditingId(null); } }}>
          <div className="modal-content">
            <div className="modal-header"><h2>{editingId ? 'Edit' : 'Record'} Attendance</h2><button className="modal-close" onClick={() => { setShowForm(false); setEditingId(null); }}><span style={{ fontSize: 20 }}>&times;</span></button></div>
            <div className="modal-body">
              <form onSubmit={handleCreate}>
                <div className="form-group"><label className="form-label">Service Name *</label><input className="form-input" value={formData.service_name} onChange={(e) => updateField('service_name', e.target.value)} required /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Date *</label><input className="form-input" type="date" value={formData.service_date} onChange={(e) => updateField('service_date', e.target.value)} required /></div>
                  <div className="form-group"><label className="form-label">Service Type</label>
                    <select className="form-select" value={formData.service_type} onChange={(e) => updateField('service_type', e.target.value)}>
                      <option value="sunday_morning">Sunday Morning</option><option value="sunday_evening">Sunday Evening</option><option value="wednesday">Wednesday</option>
                      <option value="special_event">Special Event</option><option value="youth_service">Youth Service</option><option value="holiday">Holiday</option>
                    </select></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Total Attendees *</label><input className="form-input" type="number" min="0" value={formData.total_attendees} onChange={(e) => updateField('total_attendees', e.target.value)} required /></div>
                  <div className="form-group"><label className="form-label">New Visitors</label><input className="form-input" type="number" min="0" value={formData.new_visitors} onChange={(e) => updateField('new_visitors', e.target.value)} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Online Viewers</label><input className="form-input" type="number" min="0" value={formData.online_viewers} onChange={(e) => updateField('online_viewers', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Offering Collected ($)</label><input className="form-input" type="number" step="0.01" min="0" value={formData.offering_collected} onChange={(e) => updateField('offering_collected', e.target.value)} /></div>
                </div>
                <div className="form-group"><label className="form-label">Weather</label>
                  <select className="form-select" value={formData.weather} onChange={(e) => updateField('weather', e.target.value)}>
                    <option value="sunny">Sunny</option><option value="cloudy">Cloudy</option><option value="rainy">Rainy</option><option value="snowy">Snowy</option><option value="clear">Clear</option>
                  </select></div>
                <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={formData.notes} onChange={(e) => updateField('notes', e.target.value)} rows={3} /></div>
                <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 16 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Record'}</button>
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

export default Attendance;
