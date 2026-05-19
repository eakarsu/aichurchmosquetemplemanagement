import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';

function BulletinPDF() {
  const [form, setForm] = useState({
    service_date: '2026-05-24',
    service_name: 'Sunday Morning Worship',
    presiding_minister: 'Pastor Rev. M. Calloway',
    sermon_title: 'Walking in Faith',
    scripture_reading: 'Romans 8:28-39',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const generate = async () => {
    setLoading(true); setErr(null);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch('/api/custom-views/bulletin-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      setResult(await r.json());
    } catch (e) { setErr(String(e.message || e)); } finally { setLoading(false); }
  };

  const inputStyle = { width: '100%', padding: 8, background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 6, fontSize: 13 };

  return (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <FileText size={20} color="#a78bfa" />
        <h3 style={{ color: '#f1f5f9', margin: 0, fontSize: 18 }}>Bulletin / Program PDF</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label style={{ color: '#94a3b8', fontSize: 12 }}>Service Date</label>
          <input type="date" style={inputStyle} value={form.service_date} onChange={update('service_date')} />
        </div>
        <div>
          <label style={{ color: '#94a3b8', fontSize: 12 }}>Service Name</label>
          <input style={inputStyle} value={form.service_name} onChange={update('service_name')} />
        </div>
        <div>
          <label style={{ color: '#94a3b8', fontSize: 12 }}>Minister</label>
          <input style={inputStyle} value={form.presiding_minister} onChange={update('presiding_minister')} />
        </div>
        <div>
          <label style={{ color: '#94a3b8', fontSize: 12 }}>Sermon Title</label>
          <input style={inputStyle} value={form.sermon_title} onChange={update('sermon_title')} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ color: '#94a3b8', fontSize: 12 }}>Scripture Reading</label>
          <input style={inputStyle} value={form.scripture_reading} onChange={update('scripture_reading')} />
        </div>
      </div>

      <button
        onClick={generate}
        disabled={loading}
        style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <Download size={16} /> {loading ? 'Generating...' : 'Generate Bulletin PDF'}
      </button>

      {err && <div style={{ color: '#ef4444', marginTop: 10, fontSize: 13 }}>Error: {err}</div>}

      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>
            Bulletin <span style={{ color: '#a78bfa' }}>{result.bulletin_number}</span> · {result.page_count} pages
          </div>
          <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: 12, borderRadius: 6, fontSize: 11, maxHeight: 280, overflow: 'auto', whiteSpace: 'pre-wrap', margin: 0 }}>
            {result.pdf_preview}
          </pre>
        </div>
      )}
    </div>
  );
}

export default BulletinPDF;
