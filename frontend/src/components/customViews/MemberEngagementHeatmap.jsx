import React, { useEffect, useState } from 'react';
import { Flame, Award } from 'lucide-react';

function cellColor(score) {
  // 0-9 score → green ramp
  if (score <= 1) return '#0f172a';
  if (score <= 3) return '#14532d';
  if (score <= 5) return '#15803d';
  if (score <= 7) return '#22c55e';
  return '#86efac';
}

function MemberEngagementHeatmap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/custom-views/engagement-heatmap?members=12', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setData)
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 16, color: '#94a3b8' }}>Loading engagement heatmap...</div>;
  if (err) return <div style={{ padding: 16, color: '#ef4444' }}>Error: {err}</div>;
  if (!data) return null;

  return (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Flame size={20} color="#f59e0b" />
        <h3 style={{ color: '#f1f5f9', margin: 0, fontSize: 18 }}>Member Engagement Heatmap</h3>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ background: '#0f172a', padding: 12, borderRadius: 8, flex: 1, minWidth: 140 }}>
          <div style={{ color: '#94a3b8', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Award size={12} /> Top Member
          </div>
          <div style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 600 }}>{data.top_member.name}</div>
          <div style={{ color: '#86efac', fontSize: 12 }}>Score: {data.top_member.total_score}</div>
        </div>
        <div style={{ background: '#0f172a', padding: 12, borderRadius: 8, flex: 1, minWidth: 140 }}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>Popular Activity</div>
          <div style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 600 }}>{data.most_popular_activity.name}</div>
          <div style={{ color: '#fbbf24', fontSize: 12 }}>Total: {data.most_popular_activity.total}</div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 2, fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ color: '#94a3b8', textAlign: 'left', padding: 4 }}>Member</th>
              {data.activities.map((a) => (
                <th key={a} style={{ color: '#94a3b8', padding: 4, fontWeight: 500, transform: 'rotate(-20deg)', whiteSpace: 'nowrap' }}>{a}</th>
              ))}
              <th style={{ color: '#94a3b8', padding: 4 }}>Σ</th>
            </tr>
          </thead>
          <tbody>
            {data.matrix.map((row) => (
              <tr key={row.member_id}>
                <td style={{ color: '#cbd5e1', padding: 4, whiteSpace: 'nowrap' }}>{row.member_name}</td>
                {data.activities.map((a) => (
                  <td
                    key={a}
                    title={`${row.member_name} - ${a}: ${row.scores[a]}`}
                    style={{
                      background: cellColor(row.scores[a]),
                      color: row.scores[a] >= 6 ? '#052e16' : '#f1f5f9',
                      textAlign: 'center',
                      padding: '6px 4px',
                      borderRadius: 3,
                      fontWeight: 600,
                      minWidth: 24,
                    }}
                  >
                    {row.scores[a]}
                  </td>
                ))}
                <td style={{ color: '#f1f5f9', textAlign: 'center', padding: 4, fontWeight: 700 }}>{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', fontSize: 11, color: '#94a3b8' }}>
        <span>Less</span>
        {[0, 2, 4, 6, 8].map((s) => (
          <div key={s} style={{ width: 16, height: 12, background: cellColor(s), borderRadius: 2 }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

export default MemberEngagementHeatmap;
