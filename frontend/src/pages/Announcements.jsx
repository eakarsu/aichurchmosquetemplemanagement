import React, { useState, useEffect } from 'react';
import { Search, Plus, Bell, Sparkles } from 'lucide-react';
import DetailModal from '../components/DetailModal';
import AIResponseDisplay from '../components/AIResponseDisplay';

const emptyAnnouncement = {
  title: '', content: '', category: 'general', priority: 'normal',
  author: '', target_audience: 'all', publish_date: '', expiry_date: '',
  status: 'draft',
};

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyAnnouncement);
  const [editingId, setEditingId] = useState(null);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  useEffect(() => { fetchAnnouncements(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/announcements', { headers });
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.announcements || data.data || []);
      setAnnouncements(list);
    } catch {
      showToast('Failed to fetch announcements', 'error');
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/announcements/${editingId}` : '/api/announcements';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(formData) });
      if (!res.ok) throw new Error('Failed to save');
      showToast(editingId ? 'Announcement updated!' : 'Announcement created!');
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyAnnouncement);
      fetchAnnouncements();
    } catch {
      showToast('Failed to save announcement', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/announcements/${id}`, { method: 'DELETE', headers });
      showToast('Announcement deleted');
      setShowDetail(false);
      setSelected(null);
      fetchAnnouncements();
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const handleEdit = (ann) => {
    setFormData({
      title: ann.title || '',
      content: ann.content || '',
      category: ann.category || 'general',
      priority: ann.priority || 'normal',
      author: ann.author || '',
      target_audience: ann.target_audience || 'all',
      publish_date: ann.publish_date ? ann.publish_date.slice(0, 10) : '',
      expiry_date: ann.expiry_date ? ann.expiry_date.slice(0, 10) : '',
      status: ann.status || 'draft',
    });
    setEditingId(ann._id || ann.id);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleAiDraft = async () => {
    setAiLoading(true);
    setAiTitle('AI Generated Draft');
    setAiResponse('');
    try {
      const res = await fetch('/api/announcements/ai-draft', {
        method: 'POST', headers,
        body: JSON.stringify({ title: formData.title, category: formData.category, target_audience: formData.target_audience }),
      });
      const data = await res.json();
      const draft = data.draft || data.content || data.response || data.message || data.result || '';
      setAiResponse(draft);
      if (draft && typeof draft === 'string') {
        setFormData(prev => ({ ...prev, content: draft }));
      }
    } catch {
      setAiResponse('Failed to generate draft. Please try again.');
    }
    setAiLoading(false);
  };

  const getPriorityBadge = (priority) => {
    const map = { urgent: 'badge-urgent', high: 'badge-high', normal: 'badge-normal', low: 'badge-low' };
    return map[priority] || 'badge-normal';
  };

  const filtered = announcements.filter(a =>
    (a.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.content || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  if (loading) return <div className="loading-container"><div className="loading-spinner lg" /><p>Loading announcements...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Announcements</h1>
          <p>Create and manage announcements</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => { setFormData(emptyAnnouncement); setEditingId(null); setShowForm(true); }}>
            <Plus size={16} /> Create Announcement
          </button>
        </div>
      </div>

      <div className="search-bar">
        <div className="search-wrapper">
          <Search size={18} />
          <input placeholder="Search announcements..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <AIResponseDisplay response={aiResponse} title={aiTitle} isLoading={aiLoading} />

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Bell size={48} />
          <p>No announcements found. Create your first announcement!</p>
        </div>
      ) : (
        <div className="announcement-list">
          {filtered.map((a) => (
            <div key={a._id || a.id} className="announcement-card" onClick={() => { setSelected(a); setShowDetail(true); }}>
              <div className="announcement-card-header">
                <h3>{a.title}</h3>
                <span className={`badge ${getPriorityBadge(a.priority)}`}>{a.priority || 'normal'}</span>
              </div>
              <div className="announcement-card-preview">
                {a.content || 'No content.'}
              </div>
              <div className="announcement-card-meta">
                <span><span className="tag blue">{a.category || 'general'}</span></span>
                <span>{a.author ? `By ${a.author}` : ''}</span>
                <span>{a.publish_date ? new Date(a.publish_date).toLocaleDateString() : ''}</span>
                <span>Audience: {a.target_audience || 'all'}</span>
                <span className={`badge badge-${a.status === 'published' ? 'active' : a.status === 'draft' ? 'pending' : 'inactive'}`}>
                  {a.status || 'draft'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetail && selected && (
        <DetailModal
          isOpen={showDetail}
          onClose={() => { setShowDetail(false); setSelected(null); }}
          title={selected.title}
          onEdit={() => handleEdit(selected)}
          onDelete={() => handleDelete(selected._id || selected.id)}
        >
          <div className="detail-view">
            <div className="detail-row">
              <div className="detail-field">
                <span className="field-label">Category</span>
                <span className="field-value"><span className="tag blue">{selected.category}</span></span>
              </div>
              <div className="detail-field">
                <span className="field-label">Priority</span>
                <span className="field-value"><span className={`badge ${getPriorityBadge(selected.priority)}`}>{selected.priority}</span></span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-field">
                <span className="field-label">Author</span>
                <span className="field-value">{selected.author || '-'}</span>
              </div>
              <div className="detail-field">
                <span className="field-label">Target Audience</span>
                <span className="field-value">{selected.target_audience || 'all'}</span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-field">
                <span className="field-label">Publish Date</span>
                <span className="field-value">{selected.publish_date ? new Date(selected.publish_date).toLocaleDateString() : '-'}</span>
              </div>
              <div className="detail-field">
                <span className="field-label">Expiry Date</span>
                <span className="field-value">{selected.expiry_date ? new Date(selected.expiry_date).toLocaleDateString() : '-'}</span>
              </div>
            </div>
            <div className="detail-field">
              <span className="field-label">Status</span>
              <span className="field-value">
                <span className={`badge badge-${selected.status === 'published' ? 'active' : 'pending'}`}>{selected.status}</span>
              </span>
            </div>
            <div className="detail-field">
              <span className="field-label">Content</span>
              <span className="field-value" style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selected.content || '-'}</span>
            </div>
          </div>
        </DetailModal>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setEditingId(null); } }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? 'Edit Announcement' : 'Create Announcement'}</h2>
              <button className="modal-close" onClick={() => { setShowForm(false); setEditingId(null); }}>
                <span style={{ fontSize: 20 }}>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={formData.title} onChange={(e) => updateField('title', e.target.value)} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={formData.category} onChange={(e) => updateField('category', e.target.value)}>
                      <option value="general">General</option>
                      <option value="event">Event</option>
                      <option value="service">Service</option>
                      <option value="community">Community</option>
                      <option value="emergency">Emergency</option>
                      <option value="update">Update</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={formData.priority} onChange={(e) => updateField('priority', e.target.value)}>
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Author</label>
                    <input className="form-input" value={formData.author} onChange={(e) => updateField('author', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Audience</label>
                    <select className="form-select" value={formData.target_audience} onChange={(e) => updateField('target_audience', e.target.value)}>
                      <option value="all">All</option>
                      <option value="members">Members Only</option>
                      <option value="youth">Youth</option>
                      <option value="elders">Elders</option>
                      <option value="volunteers">Volunteers</option>
                      <option value="staff">Staff</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">Content *</label>
                    <button type="button" className="btn btn-ai btn-sm" onClick={handleAiDraft}>
                      <Sparkles size={14} /> AI Draft
                    </button>
                  </div>
                  <textarea className="form-textarea" value={formData.content} onChange={(e) => updateField('content', e.target.value)} rows={6} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Publish Date</label>
                    <input className="form-input" type="date" value={formData.publish_date} onChange={(e) => updateField('publish_date', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <input className="form-input" type="date" value={formData.expiry_date} onChange={(e) => updateField('expiry_date', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={formData.status} onChange={(e) => updateField('status', e.target.value)}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <AIResponseDisplay response={aiResponse} title={aiTitle} isLoading={aiLoading} />
                <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 16 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Create'} Announcement</button>
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

export default Announcements;
