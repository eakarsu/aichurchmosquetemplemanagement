import React, { useState, useEffect } from 'react';
import { Search, Plus, Heart, Sparkles } from 'lucide-react';
import DetailModal from '../components/DetailModal';
import AIResponseDisplay from '../components/AIResponseDisplay';

const emptyVolunteer = {
  name: '', email: '', phone: '', skills: '',
  assigned_ministry: '', availability: 'weekends', hours_logged: 0, status: 'active',
  join_date: '', notes: '',
};

function Volunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyVolunteer);
  const [editingId, setEditingId] = useState(null);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  useEffect(() => { fetchVolunteers(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchVolunteers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/volunteers', { headers });
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.volunteers || data.data || []);
      setVolunteers(list);
    } catch {
      showToast('Failed to fetch volunteers', 'error');
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const body = {
      ...formData,
      skills: typeof formData.skills === 'string' ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : formData.skills,
      hours_logged: parseInt(formData.hours_logged) || 0,
    };
    try {
      const url = editingId ? `/api/volunteers/${editingId}` : '/api/volunteers';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save');
      showToast(editingId ? 'Volunteer updated!' : 'Volunteer added!');
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyVolunteer);
      fetchVolunteers();
    } catch {
      showToast('Failed to save volunteer', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/volunteers/${id}`, { method: 'DELETE', headers });
      showToast('Volunteer deleted');
      setShowDetail(false);
      setSelected(null);
      fetchVolunteers();
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const handleEdit = (vol) => {
    setFormData({
      name: vol.name || '',
      email: vol.email || '',
      phone: vol.phone || '',
      skills: Array.isArray(vol.skills) ? vol.skills.join(', ') : (vol.skills || ''),
      assigned_ministry: vol.assigned_ministry || '',
      availability: vol.availability || 'weekends',
      hours_logged: vol.hours_logged || 0,
      status: vol.status || 'active',
      join_date: vol.join_date ? vol.join_date.slice(0, 10) : '',
      notes: vol.notes || '',
    });
    setEditingId(vol._id || vol.id);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleAiMatch = async () => {
    setAiLoading(true);
    setAiTitle('AI Volunteer Matching');
    setAiResponse('');
    try {
      const res = await fetch('/api/volunteers/ai-match', {
        method: 'POST', headers,
      });
      const data = await res.json();
      setAiResponse(data.matches || data.suggestions || data.response || data.message || data.result || JSON.stringify(data));
    } catch {
      setAiResponse('Failed to generate volunteer matches. Please try again.');
    }
    setAiLoading(false);
  };

  const filtered = volunteers.filter(v => {
    const s = search.toLowerCase();
    return (v.name || '').toLowerCase().includes(s) || (v.email || '').toLowerCase().includes(s) || (v.assigned_ministry || '').toLowerCase().includes(s);
  });

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  if (loading) return <div className="loading-container"><div className="loading-spinner lg" /><p>Loading volunteers...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Volunteer Scheduling</h1>
          <p>Manage volunteers and assignments</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-ai" onClick={handleAiMatch}>
            <Sparkles size={16} /> AI Match Volunteers
          </button>
          <button className="btn btn-primary" onClick={() => { setFormData(emptyVolunteer); setEditingId(null); setShowForm(true); }}>
            <Plus size={16} /> Add Volunteer
          </button>
        </div>
      </div>

      <div className="search-bar">
        <div className="search-wrapper">
          <Search size={18} />
          <input placeholder="Search volunteers..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <AIResponseDisplay response={aiResponse} title={aiTitle} isLoading={aiLoading} />

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Heart size={48} />
          <p>No volunteers found. Add your first volunteer!</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Skills</th>
                <th>Ministry</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v._id || v.id} className="table-row" onClick={() => { setSelected(v); setShowDetail(true); }}>
                  <td style={{ fontWeight: 500 }}>{v.name || 'Unknown'}</td>
                  <td>{v.email || '-'}</td>
                  <td>
                    <div className="tags-container">
                      {(Array.isArray(v.skills) ? v.skills : []).slice(0, 2).map((s, i) => (
                        <span key={i} className="tag">{s}</span>
                      ))}
                      {(Array.isArray(v.skills) ? v.skills : []).length > 2 && (
                        <span className="tag">+{v.skills.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td><span className="tag gold">{v.assigned_ministry || '-'}</span></td>
                  <td>{v.hours_logged || 0}h</td>
                  <td>
                    <span className={`badge badge-${v.status === 'active' ? 'active' : 'inactive'}`}>
                      {v.status || 'active'}
                    </span>
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
          title={selected.name || 'Unknown'}
          onEdit={() => handleEdit(selected)}
          onDelete={() => handleDelete(selected._id || selected.id)}
        >
          <div className="detail-view">
            <div className="detail-row">
              <div className="detail-field">
                <span className="field-label">Name</span>
                <span className="field-value">{selected.name || '-'}</span>
              </div>
              <div className="detail-field">
                <span className="field-label">Email</span>
                <span className="field-value">{selected.email || '-'}</span>
              </div>
            </div>
            <div className="detail-field">
              <span className="field-label">Phone</span>
              <span className="field-value">{selected.phone || '-'}</span>
            </div>
            <div className="detail-field">
              <span className="field-label">Skills</span>
              <div className="tags-container" style={{ marginTop: 4 }}>
                {(Array.isArray(selected.skills) ? selected.skills : []).map((s, i) => (
                  <span key={i} className="tag">{s}</span>
                ))}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-field">
                <span className="field-label">Assigned Ministry</span>
                <span className="field-value"><span className="tag gold">{selected.assigned_ministry || '-'}</span></span>
              </div>
              <div className="detail-field">
                <span className="field-label">Availability</span>
                <span className="field-value">{selected.availability || '-'}</span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-field">
                <span className="field-label">Hours Logged</span>
                <span className="field-value">{selected.hours_logged || 0} hours</span>
              </div>
              <div className="detail-field">
                <span className="field-label">Status</span>
                <span className="field-value">
                  <span className={`badge badge-${selected.status === 'active' ? 'active' : 'inactive'}`}>{selected.status}</span>
                </span>
              </div>
            </div>
            <div className="detail-field">
              <span className="field-label">Join Date</span>
              <span className="field-value">{selected.join_date ? new Date(selected.join_date).toLocaleDateString() : '-'}</span>
            </div>
            <div className="detail-field">
              <span className="field-label">Notes</span>
              <span className="field-value">{selected.notes || '-'}</span>
            </div>
          </div>
        </DetailModal>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setEditingId(null); } }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? 'Edit Volunteer' : 'Add Volunteer'}</h2>
              <button className="modal-close" onClick={() => { setShowForm(false); setEditingId(null); }}>
                <span style={{ fontSize: 20 }}>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" value={formData.name} onChange={(e) => updateField('name', e.target.value)} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input className="form-input" type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Skills (comma separated)</label>
                  <input className="form-input" value={formData.skills} onChange={(e) => updateField('skills', e.target.value)} placeholder="teaching, music, cooking" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Assigned Ministry</label>
                    <input className="form-input" value={formData.assigned_ministry} onChange={(e) => updateField('assigned_ministry', e.target.value)} placeholder="e.g. Youth Ministry" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Availability</label>
                    <select className="form-select" value={formData.availability} onChange={(e) => updateField('availability', e.target.value)}>
                      <option value="weekends">Weekends</option>
                      <option value="weekdays">Weekdays</option>
                      <option value="evenings">Evenings</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Hours Logged</label>
                    <input className="form-input" type="number" min="0" value={formData.hours_logged} onChange={(e) => updateField('hours_logged', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={formData.status} onChange={(e) => updateField('status', e.target.value)}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="on_leave">On Leave</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Join Date</label>
                  <input className="form-input" type="date" value={formData.join_date} onChange={(e) => updateField('join_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={formData.notes} onChange={(e) => updateField('notes', e.target.value)} rows={3} />
                </div>
                <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 16 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Add'} Volunteer</button>
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

export default Volunteers;
