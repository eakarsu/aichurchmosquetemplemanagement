import React, { useState, useEffect } from 'react';
import { Search, Plus, BookOpen, Sparkles } from 'lucide-react';
import DetailModal from '../components/DetailModal';
import AIResponseDisplay from '../components/AIResponseDisplay';

const emptySermon = {
  title: '', speaker: '', date: '', duration: '',
  scripture_text: '', transcript: '', status: 'archived', tags: '', audio_url: '',
};

function Sermons() {
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptySermon);
  const [editingId, setEditingId] = useState(null);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  useEffect(() => { fetchSermons(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSermons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sermons', { headers });
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.sermons || data.data || []);
      setSermons(list);
    } catch {
      showToast('Failed to fetch sermons', 'error');
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const body = {
      ...formData,
      tags: typeof formData.tags === 'string' ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : formData.tags,
    };
    try {
      const url = editingId ? `/api/sermons/${editingId}` : '/api/sermons';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save');
      showToast(editingId ? 'Sermon updated!' : 'Sermon created!');
      setShowForm(false);
      setEditingId(null);
      setFormData(emptySermon);
      fetchSermons();
    } catch {
      showToast('Failed to save sermon', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/sermons/${id}`, { method: 'DELETE', headers });
      showToast('Sermon deleted');
      setShowDetail(false);
      setSelected(null);
      fetchSermons();
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const handleEdit = (sermon) => {
    setFormData({
      title: sermon.title || '',
      speaker: sermon.speaker || '',
      date: sermon.date ? sermon.date.slice(0, 10) : '',
      duration: sermon.duration || '',
      scripture_text: sermon.scripture_text || '',
      transcript: sermon.transcript || '',
      status: sermon.status || 'archived',
      tags: Array.isArray(sermon.tags) ? sermon.tags.join(', ') : (sermon.tags || ''),
      audio_url: sermon.audio_url || '',
    });
    setEditingId(sermon._id || sermon.id);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleAiSummarize = async (sermon) => {
    setAiLoading(true);
    setAiTitle('AI Sermon Summary');
    setAiResponse('');
    try {
      const res = await fetch(`/api/sermons/${sermon._id || sermon.id}/ai-summarize`, {
        method: 'POST', headers,
      });
      const data = await res.json();
      setAiResponse(data.summary || data.response || data.message || data.result || JSON.stringify(data));
    } catch {
      setAiResponse('Failed to generate summary. Please try again.');
    }
    setAiLoading(false);
  };

  const handleAiTopics = async () => {
    setAiLoading(true);
    setAiTitle('AI Topic Suggestions');
    setAiResponse('');
    try {
      const res = await fetch('/api/sermons/ai-generate-topics', {
        method: 'POST', headers,
      });
      const data = await res.json();
      setAiResponse(data.topics || data.response || data.message || data.result || JSON.stringify(data));
    } catch {
      setAiResponse('Failed to generate topics. Please try again.');
    }
    setAiLoading(false);
  };

  const filtered = sermons.filter(s =>
    (s.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.speaker || '').toLowerCase().includes(search.toLowerCase())
  );

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  if (loading) return <div className="loading-container"><div className="loading-spinner lg" /><p>Loading sermons...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Sermon Management</h1>
          <p>Manage and organize your sermons</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-ai" onClick={handleAiTopics}>
            <Sparkles size={16} /> AI Topic Suggestions
          </button>
          <button className="btn btn-primary" onClick={() => { setFormData(emptySermon); setEditingId(null); setShowForm(true); }}>
            <Plus size={16} /> Add New Sermon
          </button>
        </div>
      </div>

      <div className="search-bar">
        <div className="search-wrapper">
          <Search size={18} />
          <input placeholder="Search sermons..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <AIResponseDisplay response={aiResponse} title={aiTitle} isLoading={aiLoading} />

      {filtered.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} />
          <p>No sermons found. Create your first sermon!</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Speaker</th>
                <th>Date</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s._id || s.id} className="table-row" onClick={() => { setSelected(s); setShowDetail(true); }}>
                  <td style={{ fontWeight: 500 }}>{s.title}</td>
                  <td>{s.speaker}</td>
                  <td>{s.date ? new Date(s.date).toLocaleDateString() : '-'}</td>
                  <td>{s.duration || '-'}</td>
                  <td>
                    <span className={`badge badge-${s.status === 'published' ? 'active' : s.status === 'draft' ? 'pending' : 'inactive'}`}>
                      {s.status || 'draft'}
                    </span>
                  </td>
                  <td>
                    <div className="tags-container">
                      {(Array.isArray(s.tags) ? s.tags : []).slice(0, 3).map((tag, i) => (
                        <span key={i} className="tag">{tag}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                <span className="field-label">Speaker</span>
                <span className="field-value">{selected.speaker || '-'}</span>
              </div>
              <div className="detail-field">
                <span className="field-label">Date</span>
                <span className="field-value">{selected.date ? new Date(selected.date).toLocaleDateString() : '-'}</span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-field">
                <span className="field-label">Duration</span>
                <span className="field-value">{selected.duration || '-'}</span>
              </div>
              <div className="detail-field">
                <span className="field-label">Status</span>
                <span className="field-value">
                  <span className={`badge badge-${selected.status === 'published' ? 'active' : 'pending'}`}>{selected.status}</span>
                </span>
              </div>
            </div>
            <div className="detail-field">
              <span className="field-label">Scripture Text</span>
              <span className="field-value">{selected.scripture_text || '-'}</span>
            </div>
            <div className="detail-field">
              <span className="field-label">Tags</span>
              <div className="tags-container" style={{ marginTop: 4 }}>
                {(Array.isArray(selected.tags) ? selected.tags : []).map((tag, i) => (
                  <span key={i} className="tag">{tag}</span>
                ))}
              </div>
            </div>
            <div className="detail-field">
              <span className="field-label">Transcript</span>
              <span className="field-value" style={{maxHeight: 200, overflow: 'auto'}}>{selected.transcript || '-'}</span>
            </div>
            {selected.summary && (
              <div className="detail-field">
                <span className="field-label">Summary</span>
                <span className="field-value">{selected.summary}</span>
              </div>
            )}
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-ai" onClick={() => handleAiSummarize(selected)}>
                <Sparkles size={16} /> AI Summarize
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
              <h2>{editingId ? 'Edit Sermon' : 'Add New Sermon'}</h2>
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
                    <label className="form-label">Speaker *</label>
                    <input className="form-input" value={formData.speaker} onChange={(e) => updateField('speaker', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input className="form-input" type="date" value={formData.date} onChange={(e) => updateField('date', e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Duration</label>
                    <input className="form-input" placeholder="e.g. 45 min" value={formData.duration} onChange={(e) => updateField('duration', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={formData.status} onChange={(e) => updateField('status', e.target.value)}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Scripture Text</label>
                  <textarea className="form-textarea" value={formData.scripture_text} onChange={(e) => updateField('scripture_text', e.target.value)} rows={2} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (comma separated)</label>
                  <input className="form-input" value={formData.tags} onChange={(e) => updateField('tags', e.target.value)} placeholder="faith, hope, love" />
                </div>
                <div className="form-group">
                  <label className="form-label">Transcript</label>
                  <textarea className="form-textarea" value={formData.transcript} onChange={(e) => updateField('transcript', e.target.value)} rows={4} />
                </div>
                <div className="form-group">
                  <label className="form-label">Audio URL</label>
                  <input className="form-input" value={formData.audio_url} onChange={(e) => updateField('audio_url', e.target.value)} placeholder="https://..." />
                </div>
                <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 16 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Create'} Sermon</button>
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

export default Sermons;
