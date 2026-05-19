import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Eye } from 'lucide-react';

function AttendanceTrendChart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/custom-views/attendance-trend?weeks=12', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setData)
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 16, color: '#94a3b8' }}>Loading attendance trend...</div>;
  if (err) return <div style={{ padding: 16, color: '#ef4444' }}>Error: {err}</div>;
  if (!data) return null;

  const maxVal = Math.max(...data.series.map((d) => d.total_attendees));

  return (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <TrendingUp size={20} color="#60a5fa" />
        <h3 style={{ color: '#f1f5f9', margin: 0, fontSize: 18 }}>Weekly Attendance Trend</h3>
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ background: '#0f172a', padding: 12, borderRadius: 8, flex: 1, minWidth: 120 }}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>Avg Weekly</div>
          <div style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700 }}>{data.average_weekly_attendance}</div>
        </div>
        <div style={{ background: '#0f172a', padding: 12, borderRadius: 8, flex: 1, minWidth: 120 }}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>Peak Week</div>
          <div style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700 }}>{data.peak_week.attendance}</div>
        </div>
        <div style={{ background: '#0f172a', padding: 12, borderRadius: 8, flex: 1, minWidth: 120 }}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>Growth</div>
          <div style={{ color: data.growth_pct >= 0 ? '#4ade80' : '#ef4444', fontSize: 22, fontWeight: 700 }}>
            {data.growth_pct >= 0 ? '+' : ''}{data.growth_pct}%
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 200, padding: '0 8px', borderLeft: '1px solid #334155', borderBottom: '1px solid #334155' }}>
        {data.series.map((d) => {
          const h = (d.total_attendees / maxVal) * 180;
          return (
            <div key={d.week} title={`${d.week}: ${d.total_attendees}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ color: '#94a3b8', fontSize: 10 }}>{d.total_attendees}</div>
              <div style={{ width: '100%', height: h, background: 'linear-gradient(to top, #3b82f6, #60a5fa)', borderRadius: '4px 4px 0 0' }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 20, marginTop: 16, color: '#94a3b8', fontSize: 13 }}>
        <span><Users size={14} style={{ verticalAlign: 'middle' }} /> Across all services</span>
        <span><Eye size={14} style={{ verticalAlign: 'middle' }} /> Includes online viewers</span>
      </div>
    </div>
  );
}

export default AttendanceTrendChart;
