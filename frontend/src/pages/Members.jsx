import React, { useState, useEffect } from 'react';
import { Search, Plus, Users, Sparkles } from 'lucide-react';
import DetailModal from '../components/DetailModal';
import AIResponseDisplay from '../components/AIResponseDisplay';

const emptyMember = {
  first_name: '', last_name: '', email: '', phone: '', address: '',
  membership_type: 'regular', status: 'active', groups: '', join_date: '',
  notes: '',
};

function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyMember);
  const [editingId, setEditingId] = useState(null);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  useEffect(() => { fetchMembers(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/members', { headers });
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.members || data.data || []);
      setMembers(list);
    } catch {
      showToast('Failed to fetch members', 'error');
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const body = {
      ...formData,
      groups: typeof formData.groups === 'string' ? formData.groups.split(',').map(g => g.trim()).filter(Boolean) : formData.groups,
    };
    try {
      const url = editingId ? `/api/members/${editingId}` : '/api/members';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save');
      showToast(editingId ? 'Member updated!' : 'Member added!');
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyMember);
      fetchMembers();
    } catch {
      showToast('Failed to save member', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/members/${id}`, { method: 'DELETE', headers });
      showToast('Member deleted');
      setShowDetail(false);
      setSelected(null);
      fetchMembers();
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const handleEdit = (member) => {
    setFormData({
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      email: member.email || '',
      phone: member.phone || '',
      address: member.address || '',
      membership_type: member.membership_type || 'regular',
      status: member.status || 'active',
      groups: Array.isArray(member.groups) ? member.groups.join(', ') : (member.groups || ''),
      join_date: member.join_date ? member.join_date.slice(0, 10) : '',
      notes: member.notes || '',
    });
    setEditingId(member._id || member.id);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleEngagement = async () => {
    setAiLoading(true);
    setAiTitle('AI Engagement Analysis');
    setAiResponse('');
    try {
      const res = await fetch('/api/members/ai-engagement', {
        method: 'POST', headers,
      });
      const data = await res.json();
      setAiResponse(data.analysis || data.response || data.message || data.result || JSON.stringify(data));
    } catch {
      setAiResponse('Failed to generate engagement analysis. Please try again.');
    }
    setAiLoading(false);
  };

  const filtered = members.filter(m => {
    const name = `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase();
    const s = search.toLowerCase();
    return name.includes(s) || (m.email || '').toLowerCase().includes(s);
  });

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const getFullName = (m) => `${m.first_name || ''} ${m.last_name || ''}`.trim() || 'Unknown';

  if (loading) return <div className="loading-container"><div className="loading-spinner lg" /><p>Loading members...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Member Management</h1>
          <p>Manage your congregation members</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-ai" onClick={handleEngagement}>
            <Sparkles size={16} /> Engagement Analysis
          </button>
          <button className="btn btn-primary" onClick={() => { setFormData(emptyMember); setEditingId(null); setShowForm(true); }}>
            <Plus size={16} /> Add Member
          </button>
        </div>
      </div>

      <div className="search-bar">
        <div className="search-wrapper">
          <Search size={18} />
          <input placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <AIResponseDisplay response={aiResponse} title={aiTitle} isLoading={aiLoading} />

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <p>No members found. Add your first member!</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Membership</th>
                <th>Status</th>
                <th>Groups</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m._id || m.id} className="table-row" onClick={() => { setSelected(m); setShowDetail(true); }}>
                  <td style={{ fontWeight: 500 }}>{getFullName(m)}</td>
                  <td>{m.email || '-'}</td>
                  <td>{m.phone || '-'}</td>
                  <td><span className="tag gold">{m.membership_type || 'regular'}</span></td>
                  <td>
                    <span className={`badge badge-${m.status === 'active' ? 'active' : m.status === 'inactive' ? 'inactive' : 'pending'}`}>
                      {m.status || 'active'}
                    </span>
                  </td>
                  <td>
                    <div className="tags-container">
                      {(Array.isArray(m.groups) ? m.groups : []).slice(0, 2).map((g, i) => (
                        <span key={i} className={`tag ${['blue', 'purple', 'gold'][i % 3]}`}>{g}</span>
                      ))}
                      {(Array.isArray(m.groups) ? m.groups : []).length > 2 && (
                        <span className="tag">+{m.groups.length - 2}</span>
                      )}
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
          title={getFullName(selected)}
          onEdit={() => handleEdit(selected)}
          onDelete={() => handleDelete(selected._id || selected.id)}
        >
          <div className="detail-view">
            <div className="detail-row">
              <div className="detail-field">
                <span className="field-label">First Name</span>
                <span className="field-value">{selected.first_name || '-'}</span>
              </div>
              <div className="detail-field">
                <span className="field-label">Last Name</span>
                <span className="field-value">{selected.last_name || '-'}</span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-field">
                <span className="field-label">Email</span>
                <span className="field-value">{selected.email || '-'}</span>
              </div>
              <div className="detail-field">
                <span className="field-label">Phone</span>
                <span className="field-value">{selected.phone || '-'}</span>
              </div>
            </div>
            <div className="detail-field">
              <span className="field-label">Address</span>
              <span className="field-value">{selected.address || '-'}</span>
            </div>
            <div className="detail-row">
              <div className="detail-field">
                <span className="field-label">Membership Type</span>
                <span className="field-value"><span className="tag gold">{selected.membership_type || 'regular'}</span></span>
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
              <span className="field-label">Groups</span>
              <div className="tags-container" style={{ marginTop: 4 }}>
                {(Array.isArray(selected.groups) ? selected.groups : []).map((g, i) => (
                  <span key={i} className={`tag ${['blue', 'purple', 'gold'][i % 3]}`}>{g}</span>
                ))}
              </div>
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
              <h2>{editingId ? 'Edit Member' : 'Add Member'}</h2>
              <button className="modal-close" onClick={() => { setShowForm(false); setEditingId(null); }}>
                <span style={{ fontSize: 20 }}>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreate}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input className="form-input" value={formData.first_name} onChange={(e) => updateField('first_name', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input className="form-input" value={formData.last_name} onChange={(e) => updateField('last_name', e.target.value)} required />
                  </div>
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
                  <label className="form-label">Address</label>
                  <input className="form-input" value={formData.address} onChange={(e) => updateField('address', e.target.value)} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Membership Type</label>
                    <select className="form-select" value={formData.membership_type} onChange={(e) => updateField('membership_type', e.target.value)}>
                      <option value="regular">Regular</option>
                      <option value="elder">Elder</option>
                      <option value="deacon">Deacon</option>
                      <option value="youth">Youth</option>
                      <option value="visitor">Visitor</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={formData.status} onChange={(e) => updateField('status', e.target.value)}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Join Date</label>
                  <input className="form-input" type="date" value={formData.join_date} onChange={(e) => updateField('join_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Groups (comma separated)</label>
                  <input className="form-input" value={formData.groups} onChange={(e) => updateField('groups', e.target.value)} placeholder="choir, youth group, bible study" />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={formData.notes} onChange={(e) => updateField('notes', e.target.value)} rows={3} />
                </div>
                <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 16 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Add'} Member</button>
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

export default Members;
