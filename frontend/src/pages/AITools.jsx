import React, { useState } from 'react';
import { Brain, AlertCircle } from 'lucide-react';

const TOOLS = [
  {
    key: 'sermon-analyzer',
    label: 'Sermon Analyzer',
    description: 'Analyze themes, scripture references, sentiment.',
    fields: [
      { name: 'speaker', label: 'Speaker', type: 'text' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'sermon_transcript', label: 'Sermon Transcript', type: 'textarea' },
    ],
  },
  {
    key: 'donation-insights',
    label: 'Donation Insights',
    description: 'Trends, campaigns, donor patterns.',
    fields: [
      { name: 'period', label: 'Period (e.g. 2024)', type: 'text' },
      { name: 'donations', label: 'Donations JSON array', type: 'json' },
    ],
  },
  {
    key: 'prayer-guidance',
    label: 'Prayer Guidance',
    description: 'Pastoral suggestions for a prayer request.',
    fields: [
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'prayer_request_text', label: 'Prayer Request', type: 'textarea' },
    ],
  },
  {
    key: 'member-engagement',
    label: 'Member Engagement',
    description: 'At-risk members and re-engagement strategies.',
    fields: [
      { name: 'member_data', label: 'Members JSON array', type: 'json' },
      { name: 'attendance_history', label: 'Attendance JSON (optional)', type: 'json', optional: true },
    ],
  },
  {
    key: 'event-planner',
    label: 'Event Planner',
    description: 'Logistics, volunteers, promotion checklist.',
    fields: [
      { name: 'event_type', label: 'Event Type', type: 'text' },
      { name: 'expected_attendance', label: 'Expected Attendance', type: 'number' },
      { name: 'budget', label: 'Budget ($)', type: 'number' },
    ],
  },
  {
    key: 'outreach-strategy',
    label: 'Outreach Strategy',
    description: 'Community outreach plan + partnerships.',
    fields: [
      { name: 'community_demographics', label: 'Community Demographics (text or JSON)', type: 'textarea' },
      { name: 'current_programs', label: 'Current Programs (comma-separated)', type: 'list' },
    ],
  },
  {
    key: 'sermon-qa',
    label: 'Sermon QA Bot',
    description: 'Ask questions about previous sermons.',
    fields: [
      { name: 'question', label: 'Question', type: 'textarea' },
      { name: 'sermon_ids', label: 'Sermon IDs (comma-separated, optional)', type: 'list', optional: true },
    ],
  },
  {
    key: 'volunteer-burnout',
    label: 'Volunteer Burnout Alert',
    description: 'Detect at-risk volunteers from engagement patterns.',
    fields: [
      { name: 'volunteer_logs', label: 'Volunteer Logs JSON (optional - uses DB if empty)', type: 'json', optional: true },
    ],
  },
  {
    key: 'prayer-categorize',
    label: 'Prayer Categorization',
    description: 'Auto-tag prayer requests by topic.',
    fields: [
      { name: 'prayer_requests', label: 'Prayer Requests JSON array', type: 'json' },
    ],
  },
  {
    key: 'facility-optimizer',
    label: 'Facility Utilization Optimizer',
    description: 'Reduce conflicts & maximize bookings.',
    fields: [
      { name: 'bookings', label: 'Bookings JSON array', type: 'json' },
      { name: 'facilities', label: 'Facilities JSON (optional)', type: 'json', optional: true },
    ],
  },
];

export default function AITools() {
  const [activeKey, setActiveKey] = useState(TOOLS[0].key);
  const [inputs, setInputs] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const tool = TOOLS.find(t => t.key === activeKey);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    try {
      const payload = {};
      for (const f of tool.fields) {
        const v = inputs[f.name];
        if ((v === undefined || v === '') && !f.optional) continue;
        if (v === undefined || v === '') continue;
        if (f.type === 'json') {
          try { payload[f.name] = JSON.parse(v); }
          catch { throw new Error(`Invalid JSON in ${f.label}`); }
        } else if (f.type === 'list') {
          payload[f.name] = String(v).split(',').map(s => s.trim()).filter(Boolean);
        } else if (f.type === 'number') {
          payload[f.name] = Number(v);
        } else {
          payload[f.name] = v;
        }
      }

      const token = localStorage.getItem('token');
      const res = await fetch(`/api/ai/${activeKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || 'AI request failed');
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><Brain size={24} /> AI Tools</h1>
        <p>Specialized AI features for religious institution operations.</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {TOOLS.map(t => (
          <button
            key={t.key}
            onClick={() => { setActiveKey(t.key); setInputs({}); setResult(null); setError(''); }}
            className={`btn ${activeKey === t.key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 24, padding: 24 }}>
        <h2>{tool.label}</h2>
        <p style={{ color: '#666' }}>{tool.description}</p>
        <form onSubmit={handleSubmit}>
          {tool.fields.map(f => (
            <div className="form-group" key={f.name} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>{f.label}</label>
              {f.type === 'textarea' || f.type === 'json' ? (
                <textarea
                  rows={f.type === 'json' ? 6 : 4}
                  className="form-input"
                  style={{ width: '100%', padding: 8, fontFamily: f.type === 'json' ? 'monospace' : 'inherit' }}
                  value={inputs[f.name] || ''}
                  onChange={(e) => setInputs({ ...inputs, [f.name]: e.target.value })}
                  placeholder={f.type === 'json' ? '[]' : ''}
                />
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                  className="form-input"
                  style={{ width: '100%', padding: 8 }}
                  value={inputs[f.name] || ''}
                  onChange={(e) => setInputs({ ...inputs, [f.name]: e.target.value })}
                />
              )}
            </div>
          ))}
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Analyzing...' : 'Run'}
          </button>
        </form>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ display: 'flex', gap: 8, padding: 12, background: '#fee', border: '1px solid #fcc', borderRadius: 4, color: '#c00' }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {result && (
        <div className="card" style={{ padding: 24 }}>
          <h3>Result</h3>
          <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, overflow: 'auto', maxHeight: 600 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
