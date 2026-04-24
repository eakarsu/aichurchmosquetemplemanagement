import React, { useState, useEffect } from 'react';
import { Search, Plus, Calendar, Sparkles } from 'lucide-react';
import DetailModal from '../components/DetailModal';
import AIResponseDisplay from '../components/AIResponseDisplay';

const emptyEvent = {
  title: '', description: '', event_date: '', end_date: '', location: '',
  category: 'service', status: 'upcoming', max_attendees: '', current_attendees: 0,
  organizer: '',
};

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyEvent);
  const [editingId, setEditingId] = useState(null);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  useEffect(() => { fetchEvents(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/events', { headers });
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.events || data.data || []);
      setEvents(list);
    } catch {
      showToast('Failed to fetch events', 'error');
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const body = { ...formData, max_attendees: parseInt(formData.max_attendees) || 0, current_attendees: parseInt(formData.current_attendees) || 0 };
    try {
      const url = editingId ? `/api/events/${editingId}` : '/api/events';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save');
      showToast(editingId ? 'Event updated!' : 'Event created!');
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyEvent);
      fetchEvents();
    } catch {
      showToast('Failed to save event', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/events/${id}`, { method: 'DELETE', headers });
      showToast('Event deleted');
      setShowDetail(false);
      setSelected(null);
      fetchEvents();
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const handleEdit = (event) => {
    setFormData({
      title: event.title || '',
      description: event.description || '',
      event_date: event.event_date ? event.event_date.slice(0, 10) : '',
      end_date: event.end_date ? event.end_date.slice(0, 10) : '',
      location: event.location || '',
      category: event.category || 'service',
      status: event.status || 'upcoming',
      max_attendees: event.max_attendees || '',
      current_attendees: event.current_attendees || 0,
      organizer: event.organizer || '',
    });
    setEditingId(event._id || event.id);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleAiDescription = async () => {
    setAiLoading(true);
    setAiTitle('AI Generated Description');
    setAiResponse('');
    try {
      const res = await fetch('/api/events/ai-generate-description', {
        method: 'POST', headers,
        body: JSON.stringify({ title: formData.title, category: formData.category }),
      });
      const data = await res.json();
      const desc = data.description || data.response || data.message || data.result || '';
      setAiResponse(desc);
      if (desc && typeof desc === 'string') {
        setFormData(prev => ({ ...prev, description: desc }));
      }
    } catch {
      setAiResponse('Failed to generate description. Please try again.');
    }
    setAiLoading(false);
  };

  const filtered = events.filter(ev => {
    const matchSearch = (ev.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (ev.location || '').toLowerCase().includes(search.toLowerCase());
    const matchCategory = !filterCategory || ev.category === filterCategory;
    const matchStatus = !filterStatus || ev.status === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const getStatusBadge = (status) => {
    const map = { upcoming: 'badge-pending', active: 'badge-active', ongoing: 'badge-active', completed: 'badge-inactive', cancelled: 'badge-inactive' };
    return map[status] || 'badge-pending';
  };

  if (loading) return <div className="loading-container"><div className="loading-spinner lg" /><p>Loading events...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Event Coordination</h1>
          <p>Plan and manage events</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => { setFormData(emptyEvent); setEditingId(null); setShowForm(true); }}>
            <Plus size={16} /> Create Event
          </button>
        </div>
      </div>

      <div className="search-bar">
        <div className="search-wrapper">
          <Search size={18} />
          <input placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="filter-bar">
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="service">Service</option>
          <option value="workshop">Workshop</option>
          <option value="social">Social</option>
          <option value="fundraiser">Fundraiser</option>
          <option value="meeting">Meeting</option>
          <option value="outreach">Outreach</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <AIResponseDisplay response={aiResponse} title={aiTitle} isLoading={aiLoading} />

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Calendar size={48} />
          <p>No events found. Create your first event!</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Location</th>
                <th>Category</th>
                <th>Max Attendees</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ev) => (
                <tr key={ev._id || ev.id} className="table-row" onClick={() => { setSelected(ev); setShowDetail(true); }}>
                  <td style={{ fontWeight: 500 }}>{ev.title}</td>
                  <td>{ev.event_date ? new Date(ev.event_date).toLocaleDateString() : '-'}</td>
                  <td>{ev.location || '-'}</td>
                  <td><span className="tag blue">{ev.category || '-'}</span></td>
                  <td>{ev.max_attendees || '-'}</td>
                  <td><span className={`badge ${getStatusBadge(ev.status)}`}>{ev.status || 'upcoming'}</span></td>
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
                <span className="field-label">Event Date</span>
                <span className="field-value">{selected.event_date ? new Date(selected.event_date).toLocaleDateString() : '-'}</span>
              </div>
              <div className="detail-field">
                <span className="field-label">End Date</span>
                <span className="field-value">{selected.end_date ? new Date(selected.end_date).toLocaleDateString() : '-'}</span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-field">
                <span className="field-label">Location</span>
                <span className="field-value">{selected.location || '-'}</span>
              </div>
              <div className="detail-field">
                <span className="field-label">Category</span>
                <span className="field-value"><span className="tag blue">{selected.category}</span></span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-field">
                <span className="field-label">Max Attendees</span>
                <span className="field-value">{selected.max_attendees || '-'}</span>
              </div>
              <div className="detail-field">
                <span className="field-label">Current Attendees</span>
                <span className="field-value">{selected.current_attendees || 0}</span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-field">
                <span className="field-label">Organizer</span>
                <span className="field-value">{selected.organizer || '-'}</span>
              </div>
              <div className="detail-field">
                <span className="field-label">Status</span>
                <span className="field-value"><span className={`badge ${getStatusBadge(selected.status)}`}>{selected.status}</span></span>
              </div>
            </div>
            <div className="detail-field">
              <span className="field-label">Description</span>
              <span className="field-value">{selected.description || '-'}</span>
            </div>
          </div>
        </DetailModal>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setEditingId(null); } }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? 'Edit Event' : 'Create Event'}</h2>
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
                    <label className="form-label">Event Date *</label>
                    <input className="form-input" type="date" value={formData.event_date} onChange={(e) => updateField('event_date', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input className="form-input" type="date" value={formData.end_date} onChange={(e) => updateField('end_date', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-input" value={formData.location} onChange={(e) => updateField('location', e.target.value)} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={formData.category} onChange={(e) => updateField('category', e.target.value)}>
                      <option value="service">Service</option>
                      <option value="workshop">Workshop</option>
                      <option value="social">Social</option>
                      <option value="fundraiser">Fundraiser</option>
                      <option value="meeting">Meeting</option>
                      <option value="outreach">Outreach</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={formData.status} onChange={(e) => updateField('status', e.target.value)}>
                      <option value="upcoming">Upcoming</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Max Attendees</label>
                    <input className="form-input" type="number" value={formData.max_attendees} onChange={(e) => updateField('max_attendees', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Organizer</label>
                    <input className="form-input" value={formData.organizer} onChange={(e) => updateField('organizer', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">Description</label>
                    <button type="button" className="btn btn-ai btn-sm" onClick={handleAiDescription}>
                      <Sparkles size={14} /> Generate Description
                    </button>
                  </div>
                  <textarea className="form-textarea" value={formData.description} onChange={(e) => updateField('description', e.target.value)} rows={4} />
                </div>
                <AIResponseDisplay response={aiResponse} title={aiTitle} isLoading={aiLoading} />
                <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 16 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Create'} Event</button>
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

export default Events;
