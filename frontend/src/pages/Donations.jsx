import React, { useState, useEffect } from 'react';
import { Search, Plus, DollarSign, Sparkles, Receipt } from 'lucide-react';
import DetailModal from '../components/DetailModal';
import AIResponseDisplay from '../components/AIResponseDisplay';

const emptyDonation = {
  donor_name: '', donor_email: '', amount: '', date: '', category: 'tithe',
  payment_method: 'cash', notes: '', recurring: false, tax_receipt_sent: false,
};

function Donations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyDonation);
  const [editingId, setEditingId] = useState(null);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  useEffect(() => { fetchDonations(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/donations', { headers });
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.donations || data.data || []);
      setDonations(list);
    } catch {
      showToast('Failed to fetch donations', 'error');
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const body = { ...formData, amount: parseFloat(formData.amount) || 0 };
    try {
      const url = editingId ? `/api/donations/${editingId}` : '/api/donations';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save');
      showToast(editingId ? 'Donation updated!' : 'Donation recorded!');
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyDonation);
      fetchDonations();
    } catch {
      showToast('Failed to save donation', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/donations/${id}`, { method: 'DELETE', headers });
      showToast('Donation deleted');
      setShowDetail(false);
      setSelected(null);
      fetchDonations();
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const handleEdit = (donation) => {
    setFormData({
      donor_name: donation.donor_name || '',
      donor_email: donation.donor_email || '',
      amount: donation.amount || '',
      date: donation.date ? donation.date.slice(0, 10) : '',
      category: donation.category || 'tithe',
      payment_method: donation.payment_method || 'cash',
      notes: donation.notes || '',
      recurring: donation.recurring || false,
      tax_receipt_sent: donation.tax_receipt_sent || false,
    });
    setEditingId(donation._id || donation.id);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleThankYou = async (donation) => {
    setAiLoading(true);
    setAiTitle('AI Thank You Letter');
    setAiResponse('');
    try {
      const res = await fetch('/api/donations/ai-thank-you', {
        method: 'POST', headers,
        body: JSON.stringify({
          donor_name: donation.donor_name,
          amount: donation.amount,
          category: donation.category,
          date: donation.date,
        }),
      });
      const data = await res.json();
      setAiResponse(data.letter || data.response || data.message || data.result || JSON.stringify(data));
    } catch {
      setAiResponse('Failed to generate thank you letter. Please try again.');
    }
    setAiLoading(false);
  };

  const handleTaxReceipt = async (donation) => {
    try {
      const res = await fetch(`/api/donations/${donation._id || donation.id}/generate-receipt`, {
        method: 'POST', headers,
      });
      const data = await res.json();
      showToast(data.message || 'Tax receipt generated!');
    } catch {
      showToast('Failed to generate receipt', 'error');
    }
  };

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt || 0);
  };

  const filtered = donations.filter(d =>
    (d.donor_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalDonations = filtered.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
  const avgDonation = filtered.length > 0 ? totalDonations / filtered.length : 0;

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  if (loading) return <div className="loading-container"><div className="loading-spinner lg" /><p>Loading donations...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Donation Management</h1>
          <p>Track and manage donations</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => { setFormData(emptyDonation); setEditingId(null); setShowForm(true); }}>
            <Plus size={16} /> Record Donation
          </button>
        </div>
      </div>

      <div className="donation-stats">
        <div className="donation-stat">
          <div className="stat-amount">{formatCurrency(totalDonations)}</div>
          <div className="stat-desc">Total Donations</div>
        </div>
        <div className="donation-stat">
          <div className="stat-amount">{formatCurrency(avgDonation)}</div>
          <div className="stat-desc">Average Donation</div>
        </div>
        <div className="donation-stat">
          <div className="stat-amount">{filtered.length}</div>
          <div className="stat-desc">Total Records</div>
        </div>
      </div>

      <div className="search-bar">
        <div className="search-wrapper">
          <Search size={18} />
          <input placeholder="Search donations..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <AIResponseDisplay response={aiResponse} title={aiTitle} isLoading={aiLoading} />

      {filtered.length === 0 ? (
        <div className="empty-state">
          <DollarSign size={48} />
          <p>No donations found. Record your first donation!</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Donor Name</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Category</th>
                <th>Payment Method</th>
                <th>Tax Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d._id || d.id} className="table-row" onClick={() => { setSelected(d); setShowDetail(true); }}>
                  <td style={{ fontWeight: 500 }}>{d.donor_name || 'Anonymous'}</td>
                  <td style={{ color: '#4ade80', fontWeight: 600 }}>{formatCurrency(d.amount)}</td>
                  <td>{d.date ? new Date(d.date).toLocaleDateString() : '-'}</td>
                  <td><span className="tag gold">{d.category || 'general'}</span></td>
                  <td>{d.payment_method || '-'}</td>
                  <td>
                    <span className={`badge ${d.tax_receipt_sent ? 'badge-active' : 'badge-pending'}`}>
                      {d.tax_receipt_sent ? 'Sent' : 'Pending'}
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
          title={`Donation from ${selected.donor_name || 'Anonymous'}`}
          onEdit={() => handleEdit(selected)}
          onDelete={() => handleDelete(selected._id || selected.id)}
        >
          <div className="detail-view">
            <div className="detail-row">
              <div className="detail-field">
                <span className="field-label">Donor Name</span>
                <span className="field-value">{selected.donor_name || 'Anonymous'}</span>
              </div>
              <div className="detail-field">
                <span className="field-label">Email</span>
                <span className="field-value">{selected.donor_email || '-'}</span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-field">
                <span className="field-label">Amount</span>
                <span className="field-value" style={{ color: '#4ade80', fontWeight: 600, fontSize: '1.2rem' }}>{formatCurrency(selected.amount)}</span>
              </div>
              <div className="detail-field">
                <span className="field-label">Date</span>
                <span className="field-value">{selected.date ? new Date(selected.date).toLocaleDateString() : '-'}</span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-field">
                <span className="field-label">Category</span>
                <span className="field-value">{selected.category || '-'}</span>
              </div>
              <div className="detail-field">
                <span className="field-label">Payment Method</span>
                <span className="field-value">{selected.payment_method || '-'}</span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-field">
                <span className="field-label">Recurring</span>
                <span className="field-value">{selected.recurring ? 'Yes' : 'No'}</span>
              </div>
              <div className="detail-field">
                <span className="field-label">Receipt Sent</span>
                <span className="field-value">
                  <span className={`badge ${selected.tax_receipt_sent ? 'badge-active' : 'badge-pending'}`}>
                    {selected.tax_receipt_sent ? 'Sent' : 'Pending'}
                  </span>
                </span>
              </div>
            </div>
            <div className="detail-field">
              <span className="field-label">Notes</span>
              <span className="field-value">{selected.notes || '-'}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button className="btn btn-ai" onClick={() => handleThankYou(selected)}>
                <Sparkles size={16} /> Generate Thank You Letter
              </button>
              <button className="btn btn-success" onClick={() => handleTaxReceipt(selected)}>
                <Receipt size={16} /> Generate Tax Receipt
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
              <h2>{editingId ? 'Edit Donation' : 'Record Donation'}</h2>
              <button className="modal-close" onClick={() => { setShowForm(false); setEditingId(null); }}>
                <span style={{ fontSize: 20 }}>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreate}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Donor Name *</label>
                    <input className="form-input" value={formData.donor_name} onChange={(e) => updateField('donor_name', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" value={formData.donor_email} onChange={(e) => updateField('donor_email', e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Amount *</label>
                    <input className="form-input" type="number" step="0.01" min="0" value={formData.amount} onChange={(e) => updateField('amount', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input className="form-input" type="date" value={formData.date} onChange={(e) => updateField('date', e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={formData.category} onChange={(e) => updateField('category', e.target.value)}>
                      <option value="tithe">Tithe</option>
                      <option value="offering">Offering</option>
                      <option value="building">Building Fund</option>
                      <option value="missions">Missions</option>
                      <option value="charity">Charity</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select className="form-select" value={formData.payment_method} onChange={(e) => updateField('payment_method', e.target.value)}>
                      <option value="cash">Cash</option>
                      <option value="check">Check</option>
                      <option value="card">Credit/Debit Card</option>
                      <option value="online">Online Transfer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={formData.notes} onChange={(e) => updateField('notes', e.target.value)} rows={3} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input type="checkbox" checked={formData.recurring} onChange={(e) => updateField('recurring', e.target.checked)} />
                      <span className="form-label" style={{ margin: 0 }}>Recurring</span>
                    </label>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input type="checkbox" checked={formData.tax_receipt_sent} onChange={(e) => updateField('tax_receipt_sent', e.target.checked)} />
                      <span className="form-label" style={{ margin: 0 }}>Receipt Sent</span>
                    </label>
                  </div>
                </div>
                <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 16 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Record'} Donation</button>
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

export default Donations;
