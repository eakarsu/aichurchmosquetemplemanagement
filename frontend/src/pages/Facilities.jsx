import React, { useState, useEffect } from 'react';
import { Search, Plus, Building, Sparkles } from 'lucide-react';
import DetailModal from '../components/DetailModal';
import AIResponseDisplay from '../components/AIResponseDisplay';

const emptyFacility = {
  name: '', description: '', capacity: '', status: 'available',
  amenities: '', hourly_rate: '', booking_date: '', booking_time: '',
  booked_by: '', notes: '',
};

function Facilities() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyFacility);
  const [editingId, setEditingId] = useState(null);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  useEffect(() => { fetchFacilities(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/facilities', { headers });
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.facilities || data.data || []);
      setFacilities(list);
    } catch {
      showToast('Failed to fetch facilities', 'error');
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const body = {
      ...formData,
      capacity: parseInt(formData.capacity) || 0,
      hourly_rate: parseFloat(formData.hourly_rate) || 0,
      amenities: typeof formData.amenities === 'string' ? formData.amenities.split(',').map(a => a.trim()).filter(Boolean) : formData.amenities,
    };
    try {
      const url = editingId ? `/api/facilities/${editingId}` : '/api/facilities';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save');
      showToast(editingId ? 'Facility updated!' : 'Facility added!');
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyFacility);
      fetchFacilities();
    } catch {
      showToast('Failed to save facility', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/facilities/${id}`, { method: 'DELETE', headers });
      showToast('Facility deleted');
      setShowDetail(false);
      setSelected(null);
      fetchFacilities();
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const handleEdit = (fac) => {
    setFormData({
      name: fac.name || '',
      description: fac.description || '',
      capacity: fac.capacity || '',
      status: fac.status || 'available',
      amenities: Array.isArray(fac.amenities) ? fac.amenities.join(', ') : (fac.amenities || ''),
      hourly_rate: fac.hourly_rate || '',
      booking_date: fac.booking_date ? fac.booking_date.slice(0, 10) : '',
      booking_time: fac.booking_time || '',
      booked_by: fac.booked_by || '',
      notes: fac.notes || '',
    });
    setEditingId(fac._id || fac.id);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleAiOptimize = async () => {
    setAiLoading(true);
    setAiTitle('AI Schedule Optimization');
    setAiResponse('');
    try {
      const res = await fetch('/api/facilities/ai-optimize', {
        method: 'POST', headers,
      });
      const data = await res.json();
      setAiResponse(data.optimization || data.suggestions || data.response || data.message || data.result || JSON.stringify(data));
    } catch {
      setAiResponse('Failed to generate optimization. Please try again.');
    }
    setAiLoading(false);
  };

  const filtered = facilities.filter(f =>
    (f.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const getStatusClass = (status) => {
    const map = { available: 'badge-available', booked: 'badge-booked', maintenance: 'badge-maintenance' };
    return map[status] || 'badge-pending';
  };

  if (loading) return <div className="loading-container"><div className="loading-spinner lg" /><p>Loading facilities...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Facility Management</h1>
          <p>Manage your facilities and bookings</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-ai" onClick={handleAiOptimize}>
            <Sparkles size={16} /> Optimize Schedule
          </button>
          <button className="btn btn-primary" onClick={() => { setFormData(emptyFacility); setEditingId(null); setShowForm(true); }}>
            <Plus size={16} /> Add Facility
          </button>
        </div>
      </div>

      <div className="search-bar">
        <div className="search-wrapper">
          <Search size={18} />
          <input placeholder="Search facilities..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <AIResponseDisplay response={aiResponse} title={aiTitle} isLoading={aiLoading} />

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Building size={48} />
          <p>No facilities found. Add your first facility!</p>
        </div>
      ) : (
        <div className="facility-grid">
          {filtered.map((f) => (
            <div key={f._id || f.id} className="facility-card" onClick={() => { setSelected(f); setShowDetail(true); }}>
              <div className="facility-card-header">
                <h3>{f.name}</h3>
                <span className={`badge ${getStatusClass(f.status)}`}>{f.status || 'available'}</span>
              </div>
              <div className="capacity">
                <Building size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                Capacity: {f.capacity || 'N/A'}
              </div>
              <div className="tags-container">
                {(Array.isArray(f.amenities) ? f.amenities : []).slice(0, 4).map((a, i) => (
                  <span key={i} className={`tag ${['blue', 'gold', 'purple'][i % 3]}`}>{a}</span>
                ))}
                {(Array.isArray(f.amenities) ? f.amenities : []).length > 4 && (
                  <span className="tag">+{f.amenities.length - 4}</span>
                )}
              </div>
              {f.hourly_rate > 0 && (
                <div style={{ marginTop: 12, color: 'var(--accent-gold)', fontWeight: 600, fontSize: '0.9rem' }}>
                  ${f.hourly_rate}/hr
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showDetail && selected && (
        <DetailModal
          isOpen={showDetail}
          onClose={() => { setShowDetail(false); setSelected(null); }}
          title={selected.name}
          onEdit={() => handleEdit(selected)}
          onDelete={() => handleDelete(selected._id || selected.id)}
        >
          <div className="detail-view">
            <div className="detail-row">
              <div className="detail-field">
                <span className="field-label">Name</span>
                <span className="field-value">{selected.name}</span>
              </div>
              <div className="detail-field">
                <span className="field-label">Status</span>
                <span className="field-value">
                  <span className={`badge ${getStatusClass(selected.status)}`}>{selected.status}</span>
                </span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-field">
                <span className="field-label">Capacity</span>
                <span className="field-value">{selected.capacity || '-'}</span>
              </div>
              <div className="detail-field">
                <span className="field-label">Hourly Rate</span>
                <span className="field-value">{selected.hourly_rate ? `$${selected.hourly_rate}/hr` : 'Free'}</span>
              </div>
            </div>
            <div className="detail-field">
              <span className="field-label">Description</span>
              <span className="field-value">{selected.description || '-'}</span>
            </div>
            <div className="detail-field">
              <span className="field-label">Amenities</span>
              <div className="tags-container" style={{ marginTop: 4 }}>
                {(Array.isArray(selected.amenities) ? selected.amenities : []).map((a, i) => (
                  <span key={i} className={`tag ${['blue', 'gold', 'purple'][i % 3]}`}>{a}</span>
                ))}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-field">
                <span className="field-label">Booking Date</span>
                <span className="field-value">{selected.booking_date ? new Date(selected.booking_date).toLocaleDateString() : '-'}</span>
              </div>
              <div className="detail-field">
                <span className="field-label">Booking Time</span>
                <span className="field-value">{selected.booking_time || '-'}</span>
              </div>
            </div>
            <div className="detail-field">
              <span className="field-label">Booked By</span>
              <span className="field-value">{selected.booked_by || '-'}</span>
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
              <h2>{editingId ? 'Edit Facility' : 'Add Facility'}</h2>
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
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={formData.description} onChange={(e) => updateField('description', e.target.value)} rows={3} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Capacity</label>
                    <input className="form-input" type="number" min="0" value={formData.capacity} onChange={(e) => updateField('capacity', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={formData.status} onChange={(e) => updateField('status', e.target.value)}>
                      <option value="available">Available</option>
                      <option value="booked">Booked</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Amenities (comma separated)</label>
                  <input className="form-input" value={formData.amenities} onChange={(e) => updateField('amenities', e.target.value)} placeholder="projector, sound system, kitchen" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Hourly Rate ($)</label>
                    <input className="form-input" type="number" step="0.01" min="0" value={formData.hourly_rate} onChange={(e) => updateField('hourly_rate', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Booked By</label>
                    <input className="form-input" value={formData.booked_by} onChange={(e) => updateField('booked_by', e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Booking Date</label>
                    <input className="form-input" type="date" value={formData.booking_date} onChange={(e) => updateField('booking_date', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Booking Time</label>
                    <input className="form-input" type="time" value={formData.booking_time} onChange={(e) => updateField('booking_time', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={formData.notes} onChange={(e) => updateField('notes', e.target.value)} rows={2} />
                </div>
                <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 16 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Add'} Facility</button>
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

export default Facilities;
