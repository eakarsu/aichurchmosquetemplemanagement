import React, { useEffect, useState } from 'react';
import { UsersRound, Plus, Trash2, Save, X } from 'lucide-react';

function MinistryRolesEditor() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editBuf, setEditBuf] = useState({});
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState({ ministry: '', role: '', assignee: '', members: 0, schedule: '' });

  const token = () => localStorage.getItem('token');

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const r = await fetch('/api/custom-views/ministry-roles', { headers: { Authorization: `Bearer ${token()}` } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      setData(await r.json());
    } catch (e) { setErr(String(e.message || e)); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const createRow = async () => {
    if (!newRow.ministry || !newRow.role) return;
    const r = await fetch('/api/custom-views/ministry-roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(newRow),
    });
    if (r.ok) { setNewRow({ ministry: '', role: '', assignee: '', members: 0, schedule: '' }); setAdding(false); load(); }
  };

  const startEdit = (row) => { setEditingId(row.id); setEditBuf({ ...row }); };
  const cancelEdit = () => { setEditingId(null); setEditBuf({}); };

  const saveEdit = async () => {
    const r = await fetch(`/api/custom-views/ministry-roles/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(editBuf),
    });
    if (r.ok) { cancelEdit(); load(); }
  };

  const deleteRow = async (id) => {
    if (!window.confirm('Delete this ministry role?')) return;
    const r = await fetch(`/api/custom-views/ministry-roles/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    if (r.ok) load();
  };

  if (loading) return <div style={{ padding: 16, color: '#94a3b8' }}>Loading ministry roles...</div>;
  if (err) return <div style={{ padding: 16, color: '#ef4444' }}>Error: {err}</div>;
  if (!data) return null;

  const inputStyle = { width: '100%', padding: 4, background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 4, fontSize: 12 };

  return (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <UsersRound size={20} color="#22c55e" />
          <h3 style={{ color: '#f1f5f9', margin: 0, fontSize: 18 }}>Ministry Roles & Groups</h3>
        </div>
        <button onClick={() => setAdding(!adding)} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}>
          <Plus size={14} /> Add Role
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 12, color: '#94a3b8' }}>
        <span>{data.count} roles</span> · <span>{data.total_members} members</span> · <span>{data.ministries.length} ministries</span>
      </div>

      {adding && (
        <div style={{ background: '#0f172a', padding: 12, borderRadius: 6, marginBottom: 12, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: 6 }}>
          <input placeholder="Ministry" style={inputStyle} value={newRow.ministry} onChange={(e) => setNewRow({ ...newRow, ministry: e.target.value })} />
          <input placeholder="Role" style={inputStyle} value={newRow.role} onChange={(e) => setNewRow({ ...newRow, role: e.target.value })} />
          <input placeholder="Assignee" style={inputStyle} value={newRow.assignee} onChange={(e) => setNewRow({ ...newRow, assignee: e.target.value })} />
          <input placeholder="Members" type="number" style={inputStyle} value={newRow.members} onChange={(e) => setNewRow({ ...newRow, members: parseInt(e.target.value) || 0 })} />
          <input placeholder="Schedule" style={inputStyle} value={newRow.schedule} onChange={(e) => setNewRow({ ...newRow, schedule: e.target.value })} />
          <button onClick={createRow} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Save</button>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              <th style={{ color: '#94a3b8', padding: 8, textAlign: 'left' }}>Ministry</th>
              <th style={{ color: '#94a3b8', padding: 8, textAlign: 'left' }}>Role</th>
              <th style={{ color: '#94a3b8', padding: 8, textAlign: 'left' }}>Assignee</th>
              <th style={{ color: '#94a3b8', padding: 8, textAlign: 'center' }}>Members</th>
              <th style={{ color: '#94a3b8', padding: 8, textAlign: 'left' }}>Schedule</th>
              <th style={{ color: '#94a3b8', padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.roles.map((row) => (
              <tr key={row.id} style={{ borderBottom: '1px solid #1e293b' }}>
                {editingId === row.id ? (
                  <>
                    <td style={{ padding: 6 }}><input style={inputStyle} value={editBuf.ministry} onChange={(e) => setEditBuf({ ...editBuf, ministry: e.target.value })} /></td>
                    <td style={{ padding: 6 }}><input style={inputStyle} value={editBuf.role} onChange={(e) => setEditBuf({ ...editBuf, role: e.target.value })} /></td>
                    <td style={{ padding: 6 }}><input style={inputStyle} value={editBuf.assignee} onChange={(e) => setEditBuf({ ...editBuf, assignee: e.target.value })} /></td>
                    <td style={{ padding: 6 }}><input type="number" style={inputStyle} value={editBuf.members} onChange={(e) => setEditBuf({ ...editBuf, members: parseInt(e.target.value) || 0 })} /></td>
                    <td style={{ padding: 6 }}><input style={inputStyle} value={editBuf.schedule} onChange={(e) => setEditBuf({ ...editBuf, schedule: e.target.value })} /></td>
                    <td style={{ padding: 6, display: 'flex', gap: 4 }}>
                      <button onClick={saveEdit} style={{ background: '#22c55e', color: 'white', border: 'none', padding: 4, borderRadius: 4, cursor: 'pointer' }}><Save size={12} /></button>
                      <button onClick={cancelEdit} style={{ background: '#64748b', color: 'white', border: 'none', padding: 4, borderRadius: 4, cursor: 'pointer' }}><X size={12} /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ color: '#f1f5f9', padding: 8 }}>{row.ministry}</td>
                    <td style={{ color: '#cbd5e1', padding: 8 }}>{row.role}</td>
                    <td style={{ color: '#cbd5e1', padding: 8 }}>{row.assignee}</td>
                    <td style={{ color: '#cbd5e1', padding: 8, textAlign: 'center' }}>{row.members}</td>
                    <td style={{ color: '#94a3b8', padding: 8 }}>{row.schedule}</td>
                    <td style={{ padding: 6, display: 'flex', gap: 4 }}>
                      <button onClick={() => startEdit(row)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Edit</button>
                      <button onClick={() => deleteRow(row.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: 4, borderRadius: 4, cursor: 'pointer' }}><Trash2 size={12} /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MinistryRolesEditor;
