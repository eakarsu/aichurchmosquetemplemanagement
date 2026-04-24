import React, { useState, useEffect } from 'react';
import { Search, Plus, UsersRound, Sparkles, MapPin, Clock } from 'lucide-react';
import DetailModal from '../components/DetailModal';
import AIResponseDisplay from '../components/AIResponseDisplay';

const emptyGroup = {
  name: '', description: '', leader: '', meeting_day: 'Monday', meeting_time: '19:00',
  location: '', category: 'bible_study', max_members: '', current_members: '0',
  curriculum: '', status: 'active', start_date: '', notes: '',
};

function SmallGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyGroup);
  const [editingId, setEditingId] = useState(null);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  useEffect(() => { fetchGroups(); }, []);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/small-groups', { headers });
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : (data.data || []));
    } catch { showToast('Failed to fetch groups', 'error'); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const body = { ...formData, max_members: parseInt(formData.max_members) || 20, current_members: parseInt(formData.current_members) || 0 };
    try {
      const url = editingId ? `/api/small-groups/${editingId}` : '/api/small-groups';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed');
      showToast(editingId ? 'Group updated!' : 'Group created!');
      setShowForm(false); setEditingId(null); setFormData(emptyGroup); fetchGroups();
    } catch { showToast('Failed to save', 'error'); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/small-groups/${id}`, { method: 'DELETE', headers });
      showToast('Group deleted'); setShowDetail(false); setSelected(null); fetchGroups();
    } catch { showToast('Failed to delete', 'error'); }
  };

  const handleEdit = (g) => {
    setFormData({
      name: g.name || '', description: g.description || '', leader: g.leader || '',
      meeting_day: g.meeting_day || 'Monday', meeting_time: g.meeting_time || '19:00',
      location: g.location || '', category: g.category || 'bible_study',
      max_members: g.max_members || '', current_members: g.current_members || '0',
      curriculum: g.curriculum || '', status: g.status || 'active',
      start_date: g.start_date ? g.start_date.slice(0, 10) : '', notes: g.notes || '',
    });
    setEditingId(g.id); setShowDetail(false); setShowForm(true);
  };

  const handleAiCurriculum = async () => {
    setAiLoading(true); setAiTitle('AI Curriculum Suggestions'); setAiResponse('');
    try {
      const res = await fetch('/api/small-groups/ai-curriculum', { method: 'POST', headers,
        body: JSON.stringify({ groups: groups.slice(0, 10) }) });
      const data = await res.json();
      setAiResponse(data.curriculum || data.response || data.result || JSON.stringify(data));
    } catch { setAiResponse('Failed to generate curriculum suggestions.'); }
    setAiLoading(false);
  };

  const filtered = groups.filter(g =>
    (g.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (g.leader || '').toLowerCase().includes(search.toLowerCase()) ||
    (g.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const catLabel = (c) => (c || '').replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  if (loading) return <div className="loading-container"><div className="loading-spinner lg" /><p>Loading small groups...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1>Small Groups</h1><p>Manage fellowship and study groups</p></div>
        <div className="page-header-actions">
          <button className="btn btn-ai" onClick={handleAiCurriculum}><Sparkles size={16} /> AI Curriculum Ideas</button>
          <button className="btn btn-primary" onClick={() => { setFormData(emptyGroup); setEditingId(null); setShowForm(true); }}><Plus size={16} /> Create Group</button>
        </div>
      </div>

      <div className="search-bar"><div className="search-wrapper"><Search size={18} /><input placeholder="Search groups..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>

      <AIResponseDisplay response={aiResponse} title={aiTitle} isLoading={aiLoading} />

      {filtered.length === 0 ? (
        <div className="empty-state"><UsersRound size={48} /><p>No small groups found.</p></div>
      ) : (
        <div className="feature-grid">
          {filtered.map(g => (
            <div key={g.id} className="feature-card" onClick={() => { setSelected(g); setShowDetail(true); }} style={{ cursor: 'pointer' }}>
              <div className="feature-icon teal"><UsersRound size={24} /></div>
              <h3>{g.name}</h3>
              <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: 8 }}>{g.description ? g.description.slice(0, 80) + '...' : ''}</p>
              <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: '#9ca3af', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><UsersRound size={12} /> {g.leader}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {g.meeting_day} {g.meeting_time}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {g.location}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <span className="tag">{catLabel(g.category)}</span>
                <span className={`badge badge-${g.status === 'active' ? 'active' : 'inactive'}`}>{g.status}</span>
                <span className="tag">{g.current_members}/{g.max_members} members</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetail && selected && (
        <DetailModal isOpen={showDetail} onClose={() => { setShowDetail(false); setSelected(null); }} title={selected.name} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected.id)}>
          <div className="detail-view">
            <div className="detail-field"><span className="field-label">Description</span><span className="field-value">{selected.description || '-'}</span></div>
            <div className="detail-row">
              <div className="detail-field"><span className="field-label">Leader</span><span className="field-value">{selected.leader || '-'}</span></div>
              <div className="detail-field"><span className="field-label">Category</span><span className="field-value"><span className="tag">{catLabel(selected.category)}</span></span></div>
            </div>
            <div className="detail-row">
              <div className="detail-field"><span className="field-label">Meeting Day</span><span className="field-value">{selected.meeting_day}</span></div>
              <div className="detail-field"><span className="field-label">Meeting Time</span><span className="field-value">{selected.meeting_time}</span></div>
            </div>
            <div className="detail-row">
              <div className="detail-field"><span className="field-label">Location</span><span className="field-value">{selected.location || '-'}</span></div>
              <div className="detail-field"><span className="field-label">Status</span><span className="field-value"><span className={`badge badge-${selected.status === 'active' ? 'active' : 'inactive'}`}>{selected.status}</span></span></div>
            </div>
            <div className="detail-row">
              <div className="detail-field"><span className="field-label">Members</span><span className="field-value">{selected.current_members} / {selected.max_members}</span></div>
              <div className="detail-field"><span className="field-label">Start Date</span><span className="field-value">{selected.start_date ? new Date(selected.start_date).toLocaleDateString() : '-'}</span></div>
            </div>
            <div className="detail-field"><span className="field-label">Curriculum</span><span className="field-value">{selected.curriculum || '-'}</span></div>
            <div className="detail-field"><span className="field-label">Notes</span><span className="field-value">{selected.notes || '-'}</span></div>
          </div>
        </DetailModal>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setEditingId(null); } }}>
          <div className="modal-content">
            <div className="modal-header"><h2>{editingId ? 'Edit' : 'Create'} Small Group</h2><button className="modal-close" onClick={() => { setShowForm(false); setEditingId(null); }}><span style={{ fontSize: 20 }}>&times;</span></button></div>
            <div className="modal-body">
              <form onSubmit={handleCreate}>
                <div className="form-group"><label className="form-label">Group Name *</label><input className="form-input" value={formData.name} onChange={(e) => updateField('name', e.target.value)} required /></div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={formData.description} onChange={(e) => updateField('description', e.target.value)} rows={2} /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Leader *</label><input className="form-input" value={formData.leader} onChange={(e) => updateField('leader', e.target.value)} required /></div>
                  <div className="form-group"><label className="form-label">Category</label>
                    <select className="form-select" value={formData.category} onChange={(e) => updateField('category', e.target.value)}>
                      <option value="bible_study">Bible Study</option><option value="fellowship">Fellowship</option><option value="support">Support</option>
                      <option value="discipleship">Discipleship</option><option value="service">Service</option><option value="discussion">Discussion</option>
                    </select></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Meeting Day</label>
                    <select className="form-select" value={formData.meeting_day} onChange={(e) => updateField('meeting_day', e.target.value)}>
                      {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select></div>
                  <div className="form-group"><label className="form-label">Meeting Time</label><input className="form-input" type="time" value={formData.meeting_time} onChange={(e) => updateField('meeting_time', e.target.value)} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Location</label><input className="form-input" value={formData.location} onChange={(e) => updateField('location', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Status</label>
                    <select className="form-select" value={formData.status} onChange={(e) => updateField('status', e.target.value)}>
                      <option value="active">Active</option><option value="inactive">Inactive</option><option value="forming">Forming</option>
                    </select></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Max Members</label><input className="form-input" type="number" min="2" value={formData.max_members} onChange={(e) => updateField('max_members', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Current Members</label><input className="form-input" type="number" min="0" value={formData.current_members} onChange={(e) => updateField('current_members', e.target.value)} /></div>
                </div>
                <div className="form-group"><label className="form-label">Start Date</label><input className="form-input" type="date" value={formData.start_date} onChange={(e) => updateField('start_date', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Curriculum</label><textarea className="form-textarea" value={formData.curriculum} onChange={(e) => updateField('curriculum', e.target.value)} rows={2} /></div>
                <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={formData.notes} onChange={(e) => updateField('notes', e.target.value)} rows={2} /></div>
                <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 16 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Create'} Group</button>
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

export default SmallGroups;
