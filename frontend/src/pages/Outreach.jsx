import React, { useState, useEffect } from 'react';
import { Search, Plus, Globe, Sparkles, DollarSign, Users, Target } from 'lucide-react';
import DetailModal from '../components/DetailModal';
import AIResponseDisplay from '../components/AIResponseDisplay';

const emptyProgram = {
  program_name: '', description: '', coordinator: '', start_date: '', end_date: '',
  target_community: '', budget: '', spent: '0', volunteers_needed: '',
  volunteers_assigned: '0', beneficiaries: '0', status: 'active', impact_notes: '',
};

function Outreach() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyProgram);
  const [editingId, setEditingId] = useState(null);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  useEffect(() => { fetchPrograms(); }, []);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/outreach', { headers });
      const data = await res.json();
      setPrograms(Array.isArray(data) ? data : (data.data || []));
    } catch { showToast('Failed to fetch programs', 'error'); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const body = {
      ...formData,
      budget: parseFloat(formData.budget) || 0, spent: parseFloat(formData.spent) || 0,
      volunteers_needed: parseInt(formData.volunteers_needed) || 0,
      volunteers_assigned: parseInt(formData.volunteers_assigned) || 0,
      beneficiaries: parseInt(formData.beneficiaries) || 0,
    };
    try {
      const url = editingId ? `/api/outreach/${editingId}` : '/api/outreach';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed');
      showToast(editingId ? 'Program updated!' : 'Program created!');
      setShowForm(false); setEditingId(null); setFormData(emptyProgram); fetchPrograms();
    } catch { showToast('Failed to save', 'error'); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/outreach/${id}`, { method: 'DELETE', headers });
      showToast('Program deleted'); setShowDetail(false); setSelected(null); fetchPrograms();
    } catch { showToast('Failed to delete', 'error'); }
  };

  const handleEdit = (p) => {
    setFormData({
      program_name: p.program_name || '', description: p.description || '',
      coordinator: p.coordinator || '', start_date: p.start_date ? p.start_date.slice(0, 10) : '',
      end_date: p.end_date ? p.end_date.slice(0, 10) : '', target_community: p.target_community || '',
      budget: p.budget || '', spent: p.spent || '0',
      volunteers_needed: p.volunteers_needed || '', volunteers_assigned: p.volunteers_assigned || '0',
      beneficiaries: p.beneficiaries || '0', status: p.status || 'active', impact_notes: p.impact_notes || '',
    });
    setEditingId(p.id); setShowDetail(false); setShowForm(true);
  };

  const handleAiImpact = async () => {
    setAiLoading(true); setAiTitle('AI Impact Analysis'); setAiResponse('');
    try {
      const res = await fetch('/api/outreach/ai-impact', { method: 'POST', headers,
        body: JSON.stringify({ programs: programs.slice(0, 15) }) });
      const data = await res.json();
      setAiResponse(data.analysis || data.response || data.result || JSON.stringify(data));
    } catch { setAiResponse('Failed to generate impact analysis.'); }
    setAiLoading(false);
  };

  const filtered = programs.filter(p =>
    (p.program_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.coordinator || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.target_community || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalBudget = filtered.reduce((s, p) => s + (parseFloat(p.budget) || 0), 0);
  const totalBeneficiaries = filtered.reduce((s, p) => s + (parseInt(p.beneficiaries) || 0), 0);
  const totalVolunteers = filtered.reduce((s, p) => s + (parseInt(p.volunteers_assigned) || 0), 0);

  const statusColor = (s) => s === 'active' ? 'active' : s === 'completed' ? 'active' : s === 'planned' ? 'pending' : 'inactive';
  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  if (loading) return <div className="loading-container"><div className="loading-spinner lg" /><p>Loading outreach programs...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1>Outreach Programs</h1><p>Community outreach and service management</p></div>
        <div className="page-header-actions">
          <button className="btn btn-ai" onClick={handleAiImpact}><Sparkles size={16} /> AI Impact Analysis</button>
          <button className="btn btn-primary" onClick={() => { setFormData(emptyProgram); setEditingId(null); setShowForm(true); }}><Plus size={16} /> New Program</button>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-header"><div className="stat-icon green"><Globe size={22} /></div></div><div className="stat-value">{filtered.length}</div><div className="stat-label">Active Programs</div></div>
        <div className="stat-card"><div className="stat-header"><div className="stat-icon gold"><DollarSign size={22} /></div></div><div className="stat-value">${totalBudget.toLocaleString()}</div><div className="stat-label">Total Budget</div></div>
        <div className="stat-card"><div className="stat-header"><div className="stat-icon blue"><Users size={22} /></div></div><div className="stat-value">{totalVolunteers}</div><div className="stat-label">Volunteers Engaged</div></div>
        <div className="stat-card"><div className="stat-header"><div className="stat-icon teal"><Target size={22} /></div></div><div className="stat-value">{totalBeneficiaries.toLocaleString()}</div><div className="stat-label">People Served</div></div>
      </div>

      <div className="search-bar"><div className="search-wrapper"><Search size={18} /><input placeholder="Search programs..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>

      <AIResponseDisplay response={aiResponse} title={aiTitle} isLoading={aiLoading} />

      {filtered.length === 0 ? (
        <div className="empty-state"><Globe size={48} /><p>No outreach programs found.</p></div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr><th>Program</th><th>Coordinator</th><th>Community</th><th>Budget</th><th>Volunteers</th><th>Beneficiaries</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="table-row" onClick={() => { setSelected(p); setShowDetail(true); }}>
                  <td style={{ fontWeight: 500 }}>{p.program_name}</td>
                  <td>{p.coordinator}</td>
                  <td>{p.target_community || '-'}</td>
                  <td style={{ color: '#4ade80' }}>${parseFloat(p.budget || 0).toLocaleString()}</td>
                  <td>{p.volunteers_assigned}/{p.volunteers_needed}</td>
                  <td style={{ fontWeight: 600 }}>{p.beneficiaries || 0}</td>
                  <td><span className={`badge badge-${statusColor(p.status)}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDetail && selected && (
        <DetailModal isOpen={showDetail} onClose={() => { setShowDetail(false); setSelected(null); }} title={selected.program_name} onEdit={() => handleEdit(selected)} onDelete={() => handleDelete(selected.id)}>
          <div className="detail-view">
            <div className="detail-field"><span className="field-label">Description</span><span className="field-value">{selected.description || '-'}</span></div>
            <div className="detail-row">
              <div className="detail-field"><span className="field-label">Coordinator</span><span className="field-value">{selected.coordinator}</span></div>
              <div className="detail-field"><span className="field-label">Target Community</span><span className="field-value">{selected.target_community || '-'}</span></div>
            </div>
            <div className="detail-row">
              <div className="detail-field"><span className="field-label">Start Date</span><span className="field-value">{selected.start_date ? new Date(selected.start_date).toLocaleDateString() : '-'}</span></div>
              <div className="detail-field"><span className="field-label">End Date</span><span className="field-value">{selected.end_date ? new Date(selected.end_date).toLocaleDateString() : '-'}</span></div>
            </div>
            <div className="detail-row">
              <div className="detail-field"><span className="field-label">Budget</span><span className="field-value" style={{ color: '#4ade80', fontWeight: 600 }}>${parseFloat(selected.budget || 0).toLocaleString()}</span></div>
              <div className="detail-field"><span className="field-label">Spent</span><span className="field-value">${parseFloat(selected.spent || 0).toLocaleString()}</span></div>
            </div>
            <div className="detail-row">
              <div className="detail-field"><span className="field-label">Volunteers</span><span className="field-value">{selected.volunteers_assigned} / {selected.volunteers_needed} assigned</span></div>
              <div className="detail-field"><span className="field-label">Beneficiaries</span><span className="field-value" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#4ecdc4' }}>{selected.beneficiaries || 0}</span></div>
            </div>
            <div className="detail-row">
              <div className="detail-field"><span className="field-label">Status</span><span className="field-value"><span className={`badge badge-${statusColor(selected.status)}`}>{selected.status}</span></span></div>
            </div>
            <div className="detail-field"><span className="field-label">Impact Notes</span><span className="field-value">{selected.impact_notes || '-'}</span></div>
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-ai" onClick={handleAiImpact}><Sparkles size={16} /> Analyze Impact</button>
            </div>
            <AIResponseDisplay response={aiResponse} title={aiTitle} isLoading={aiLoading} />
          </div>
        </DetailModal>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setEditingId(null); } }}>
          <div className="modal-content">
            <div className="modal-header"><h2>{editingId ? 'Edit' : 'New'} Program</h2><button className="modal-close" onClick={() => { setShowForm(false); setEditingId(null); }}><span style={{ fontSize: 20 }}>&times;</span></button></div>
            <div className="modal-body">
              <form onSubmit={handleCreate}>
                <div className="form-group"><label className="form-label">Program Name *</label><input className="form-input" value={formData.program_name} onChange={(e) => updateField('program_name', e.target.value)} required /></div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={formData.description} onChange={(e) => updateField('description', e.target.value)} rows={2} /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Coordinator *</label><input className="form-input" value={formData.coordinator} onChange={(e) => updateField('coordinator', e.target.value)} required /></div>
                  <div className="form-group"><label className="form-label">Target Community</label><input className="form-input" value={formData.target_community} onChange={(e) => updateField('target_community', e.target.value)} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Start Date</label><input className="form-input" type="date" value={formData.start_date} onChange={(e) => updateField('start_date', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">End Date</label><input className="form-input" type="date" value={formData.end_date} onChange={(e) => updateField('end_date', e.target.value)} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Budget ($)</label><input className="form-input" type="number" step="0.01" min="0" value={formData.budget} onChange={(e) => updateField('budget', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Spent ($)</label><input className="form-input" type="number" step="0.01" min="0" value={formData.spent} onChange={(e) => updateField('spent', e.target.value)} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Volunteers Needed</label><input className="form-input" type="number" min="0" value={formData.volunteers_needed} onChange={(e) => updateField('volunteers_needed', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Volunteers Assigned</label><input className="form-input" type="number" min="0" value={formData.volunteers_assigned} onChange={(e) => updateField('volunteers_assigned', e.target.value)} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Beneficiaries</label><input className="form-input" type="number" min="0" value={formData.beneficiaries} onChange={(e) => updateField('beneficiaries', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Status</label>
                    <select className="form-select" value={formData.status} onChange={(e) => updateField('status', e.target.value)}>
                      <option value="planned">Planned</option><option value="active">Active</option><option value="completed">Completed</option><option value="paused">Paused</option>
                    </select></div>
                </div>
                <div className="form-group"><label className="form-label">Impact Notes</label><textarea className="form-textarea" value={formData.impact_notes} onChange={(e) => updateField('impact_notes', e.target.value)} rows={3} /></div>
                <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 16 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Create'} Program</button>
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

export default Outreach;
