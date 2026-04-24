import React, { useState, useEffect } from 'react';
import { Search, Plus, Star, Heart, Sparkles } from 'lucide-react';
import DetailModal from '../components/DetailModal';
import AIResponseDisplay from '../components/AIResponseDisplay';

const emptyPrayer = {
  requester_name: '', is_anonymous: false, request_type: 'healing',
  prayer_text: '', status: 'active',
};

function Prayers() {
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyPrayer);
  const [editingId, setEditingId] = useState(null);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [toast, setToast] = useState(null);
  const [prayedFor, setPrayedFor] = useState(new Set());
  const [animatingId, setAnimatingId] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  useEffect(() => { fetchPrayers(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPrayers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/prayers', { headers });
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.prayers || data.data || []);
      setPrayers(list);
    } catch {
      showToast('Failed to fetch prayers', 'error');
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/prayers/${editingId}` : '/api/prayers';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(formData) });
      if (!res.ok) throw new Error('Failed to save');
      showToast(editingId ? 'Prayer request updated!' : 'Prayer request submitted!');
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyPrayer);
      fetchPrayers();
    } catch {
      showToast('Failed to save prayer request', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/prayers/${id}`, { method: 'DELETE', headers });
      showToast('Prayer request deleted');
      setShowDetail(false);
      setSelected(null);
      fetchPrayers();
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const handleEdit = (prayer) => {
    setFormData({
      requester_name: prayer.requester_name || '',
      is_anonymous: prayer.is_anonymous || false,
      request_type: prayer.request_type || 'healing',
      prayer_text: prayer.prayer_text || '',
      status: prayer.status || 'active',
    });
    setEditingId(prayer._id || prayer.id);
    setShowDetail(false);
    setShowForm(true);
  };

  const handlePray = async (e, prayer) => {
    e.stopPropagation();
    const id = prayer._id || prayer.id;
    setAnimatingId(id);
    setTimeout(() => setAnimatingId(null), 400);

    try {
      await fetch(`/api/prayers/${id}/pray`, { method: 'PUT', headers });
      setPrayedFor(prev => new Set([...prev, id]));
      setPrayers(prev => prev.map(p => {
        if ((p._id || p.id) === id) {
          return { ...p, prayer_count: (p.prayer_count || 0) + 1 };
        }
        return p;
      }));
    } catch {
      // silently fail
    }
  };

  const handleAiGuidance = async (prayer) => {
    setAiLoading(true);
    setAiTitle('AI Spiritual Guidance');
    setAiResponse('');
    try {
      const res = await fetch(`/api/prayers/${prayer._id || prayer.id}/ai-guidance`, {
        method: 'POST', headers,
      });
      const data = await res.json();
      setAiResponse(data.guidance || data.ai_guidance || data.response || data.message || data.result || JSON.stringify(data));
    } catch {
      setAiResponse('Failed to generate guidance. Please try again.');
    }
    setAiLoading(false);
  };

  const filtered = prayers.filter(p => {
    const s = search.toLowerCase();
    return (p.requester_name || '').toLowerCase().includes(s) ||
      (p.prayer_text || '').toLowerCase().includes(s) ||
      (p.request_type || '').toLowerCase().includes(s);
  });

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  if (loading) return <div className="loading-container"><div className="loading-spinner lg" /><p>Loading prayer requests...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Prayer Requests</h1>
          <p>Share and support prayer needs</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => { setFormData(emptyPrayer); setEditingId(null); setShowForm(true); }}>
            <Plus size={16} /> Submit Request
          </button>
        </div>
      </div>

      <div className="search-bar">
        <div className="search-wrapper">
          <Search size={18} />
          <input placeholder="Search prayers..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <AIResponseDisplay response={aiResponse} title={aiTitle} isLoading={aiLoading} />

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Star size={48} />
          <p>No prayer requests found. Submit your first request!</p>
        </div>
      ) : (
        <div className="prayer-grid">
          {filtered.map((p) => {
            const id = p._id || p.id;
            return (
              <div key={id} className="prayer-card" onClick={() => { setSelected(p); setShowDetail(true); }}>
                <div className="prayer-card-header">
                  <span className="prayer-card-type">{p.request_type || 'general'}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className={`badge badge-${p.status === 'active' ? 'active' : p.status === 'answered' ? 'active' : 'inactive'}`}>
                      {p.status || 'active'}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: 8 }}>
                  {p.is_anonymous ? 'Anonymous' : (p.requester_name || 'Anonymous')}
                </div>
                <div className="prayer-card-text">
                  {p.prayer_text || 'No details provided.'}
                </div>
                <div className="prayer-card-footer">
                  <span className="prayer-count">
                    <Star size={14} /> {p.prayer_count || 0} prayers
                  </span>
                  <button
                    className={`pray-btn ${prayedFor.has(id) ? 'prayed' : ''}`}
                    onClick={(e) => handlePray(e, p)}
                  >
                    <Heart
                      size={16}
                      fill={prayedFor.has(id) ? 'currentColor' : 'none'}
                      className={animatingId === id ? 'heart-animate' : ''}
                    />
                    Pray
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showDetail && selected && (
        <DetailModal
          isOpen={showDetail}
          onClose={() => { setShowDetail(false); setSelected(null); }}
          title="Prayer Request"
          onEdit={() => handleEdit(selected)}
          onDelete={() => handleDelete(selected._id || selected.id)}
        >
          <div className="detail-view">
            <div className="detail-row">
              <div className="detail-field">
                <span className="field-label">Requester</span>
                <span className="field-value">{selected.is_anonymous ? 'Anonymous' : (selected.requester_name || 'Anonymous')}</span>
              </div>
              <div className="detail-field">
                <span className="field-label">Type</span>
                <span className="field-value"><span className="tag">{selected.request_type}</span></span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-field">
                <span className="field-label">Status</span>
                <span className="field-value">
                  <span className={`badge badge-${selected.status === 'active' ? 'active' : 'inactive'}`}>{selected.status}</span>
                </span>
              </div>
              <div className="detail-field">
                <span className="field-label">Prayer Count</span>
                <span className="field-value" style={{ color: '#e2b04a', fontWeight: 600 }}>{selected.prayer_count || 0} prayers</span>
              </div>
            </div>
            <div className="detail-field">
              <span className="field-label">Prayer Request</span>
              <span className="field-value" style={{ lineHeight: 1.7 }}>{selected.prayer_text || '-'}</span>
            </div>
            {selected.ai_guidance && (
              <div className="detail-field">
                <span className="field-label">AI Guidance</span>
                <span className="field-value" style={{ lineHeight: 1.7 }}>{selected.ai_guidance}</span>
              </div>
            )}
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-ai" onClick={() => handleAiGuidance(selected)}>
                <Sparkles size={16} /> Get Spiritual Guidance
              </button>
            </div>
            <AIResponseDisplay response={aiResponse} title={aiTitle} isLoading={aiLoading} />
          </div>
        </DetailModal>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setEditingId(null); } }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? 'Edit Prayer Request' : 'Submit Prayer Request'}</h2>
              <button className="modal-close" onClick={() => { setShowForm(false); setEditingId(null); }}>
                <span style={{ fontSize: 20 }}>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input className="form-input" value={formData.requester_name} onChange={(e) => updateField('requester_name', e.target.value)} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={formData.request_type} onChange={(e) => updateField('request_type', e.target.value)}>
                      <option value="healing">Healing</option>
                      <option value="guidance">Guidance</option>
                      <option value="gratitude">Gratitude</option>
                      <option value="protection">Protection</option>
                      <option value="strength">Strength</option>
                      <option value="family">Family</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={formData.status} onChange={(e) => updateField('status', e.target.value)}>
                      <option value="active">Active</option>
                      <option value="answered">Answered</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Prayer Request *</label>
                  <textarea className="form-textarea" value={formData.prayer_text} onChange={(e) => updateField('prayer_text', e.target.value)} rows={5} required placeholder="Share your prayer request..." />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.is_anonymous} onChange={(e) => updateField('is_anonymous', e.target.checked)} />
                    <span className="form-label" style={{ margin: 0 }}>Submit Anonymously</span>
                  </label>
                </div>
                <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 16 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Submit'} Prayer Request</button>
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

export default Prayers;
