// Custom Views for Religious Organization Member Management
// 2 VIZ + 2 NON-VIZ endpoints:
//   GET  /attendance-trend      (VIZ)
//   GET  /engagement-heatmap    (VIZ)
//   POST /bulletin-pdf          (NON-VIZ)
//   GET/POST/PUT/DELETE /ministry-roles  (NON-VIZ CRUD)
const express = require('express');
const router = express.Router();

// ---------- Helpers ----------
function seedRand(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ---------- 1) VIZ: Attendance trend (multi-service) ----------
router.get('/attendance-trend', (req, res) => {
  const weeks = Math.max(4, Math.min(52, parseInt(req.query.weeks) || 12));
  const rand = seedRand(20260518);
  const services = ['Sunday Morning', 'Sunday Evening', 'Wednesday Bible Study', 'Friday Prayer'];
  const today = new Date('2026-05-17');
  const series = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 7);
    const weekLabel = d.toISOString().slice(0, 10);
    const breakdown = {};
    let total = 0;
    services.forEach((svc) => {
      const base = 60 + Math.floor(rand() * 140);
      const trend = Math.floor((weeks - i) * 1.2);
      const v = base + trend;
      breakdown[svc] = v;
      total += v;
    });
    series.push({
      week: weekLabel,
      total_attendees: total,
      new_visitors: Math.floor(rand() * 25) + 5,
      online_viewers: Math.floor(rand() * 200) + 50,
      breakdown,
    });
  }
  const totals = series.reduce((a, d) => a + d.total_attendees, 0);
  const avg = Math.round(totals / series.length);
  const peak = series.reduce((p, d) => (d.total_attendees > p.total_attendees ? d : p), series[0]);
  res.json({
    institution: 'Sacred Grounds Faith Community',
    period: { start: series[0].week, end: series[series.length - 1].week, weeks },
    services,
    average_weekly_attendance: avg,
    peak_week: { week: peak.week, attendance: peak.total_attendees },
    growth_pct: Number((((series[series.length - 1].total_attendees - series[0].total_attendees) / series[0].total_attendees) * 100).toFixed(1)),
    series,
  });
});

// ---------- 2) VIZ: Member engagement heatmap (member x activity) ----------
router.get('/engagement-heatmap', (req, res) => {
  const memberCount = Math.max(5, Math.min(40, parseInt(req.query.members) || 12));
  const rand = seedRand(78451293);
  const activities = ['Worship', 'Small Group', 'Volunteering', 'Giving', 'Prayer Meeting', 'Bible Study', 'Outreach'];
  const firstNames = ['Sarah', 'David', 'Mary', 'John', 'Hannah', 'Daniel', 'Esther', 'Paul', 'Ruth', 'Aaron', 'Rebecca', 'Samuel', 'Naomi', 'Caleb', 'Miriam', 'Joshua', 'Leah', 'Stephen', 'Anna', 'Peter'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark'];
  const matrix = [];
  for (let i = 0; i < memberCount; i++) {
    const name = `${firstNames[i % firstNames.length]} ${lastNames[(i * 3) % lastNames.length]}`;
    const row = { member_id: `mbr-${1000 + i}`, member_name: name, scores: {}, total: 0 };
    activities.forEach((a) => {
      const score = Math.floor(rand() * 10); // 0-9 engagement
      row.scores[a] = score;
      row.total += score;
    });
    matrix.push(row);
  }
  matrix.sort((a, b) => b.total - a.total);
  const activityTotals = {};
  activities.forEach((a) => {
    activityTotals[a] = matrix.reduce((sum, m) => sum + m.scores[a], 0);
  });
  const topMember = matrix[0];
  const mostPopularActivity = Object.entries(activityTotals).sort((a, b) => b[1] - a[1])[0];
  res.json({
    generated_at: '2026-05-18T12:00:00Z',
    period_label: 'Last 30 days',
    activities,
    member_count: memberCount,
    matrix,
    activity_totals: activityTotals,
    top_member: { name: topMember.member_name, total_score: topMember.total },
    most_popular_activity: { name: mostPopularActivity[0], total: mostPopularActivity[1] },
    legend: {
      '0-2': 'Inactive',
      '3-5': 'Casual',
      '6-7': 'Engaged',
      '8-9': 'Highly Engaged',
    },
  });
});

// ---------- 3) NON-VIZ: Bulletin / program PDF ----------
router.post('/bulletin-pdf', (req, res) => {
  const {
    service_date,
    service_name,
    presiding_minister,
    sermon_title,
    scripture_reading,
    hymns,
    announcements,
    prayer_requests,
  } = req.body || {};
  if (!service_date || !service_name) {
    return res.status(400).json({ error: 'service_date and service_name are required' });
  }
  const bulletinNumber = `BUL-${Date.now().toString().slice(-8)}`;
  const safeHymns = Array.isArray(hymns) && hymns.length ? hymns : ['Amazing Grace', 'How Great Thou Art', 'Be Thou My Vision'];
  const safeAnnouncements = Array.isArray(announcements) && announcements.length ? announcements : ['Fellowship lunch after service', 'Bible study Wednesday 7pm', 'Volunteer signup at welcome desk'];
  const safePrayer = Array.isArray(prayer_requests) && prayer_requests.length ? prayer_requests : ['Healing for the sick', 'Comfort for the bereaved', 'Wisdom for leadership'];
  const pdfLines = [
    '════════════════════════════════════════════════════════',
    '   SACRED GROUNDS FAITH COMMUNITY',
    '   Order of Service / Worship Bulletin',
    '════════════════════════════════════════════════════════',
    '',
    `Bulletin No: ${bulletinNumber}`,
    `Service:     ${service_name}`,
    `Date:        ${service_date}`,
    `Minister:    ${presiding_minister || 'Pastor Rev. M. Calloway'}`,
    '',
    '--- Order of Worship ---',
    '  1. Call to Worship & Welcome',
    '  2. Opening Hymn',
    `     "${safeHymns[0]}"`,
    '  3. Invocation Prayer',
    '  4. Scripture Reading',
    `     ${scripture_reading || 'John 3:16-21'}`,
    '  5. Congregational Hymn',
    `     "${safeHymns[1] || safeHymns[0]}"`,
    '  6. Pastoral Prayer',
    '  7. Sermon',
    `     "${sermon_title || 'Walking in Faith'}"`,
    '  8. Hymn of Response',
    `     "${safeHymns[2] || safeHymns[0]}"`,
    '  9. Offering & Tithes',
    '  10. Benediction',
    '',
    '--- Announcements ---',
    ...safeAnnouncements.map((a, i) => `  ${i + 1}. ${a}`),
    '',
    '--- Prayer Requests ---',
    ...safePrayer.map((p, i) => `  ${i + 1}. ${p}`),
    '',
    '════════════════════════════════════════════════════════',
    '  "Grace be with you all."  -  Hebrews 13:25',
    '════════════════════════════════════════════════════════',
  ];
  res.json({
    bulletin_number: bulletinNumber,
    service: {
      date: service_date,
      name: service_name,
      minister: presiding_minister || 'Pastor Rev. M. Calloway',
      sermon_title: sermon_title || 'Walking in Faith',
      scripture: scripture_reading || 'John 3:16-21',
    },
    hymns: safeHymns,
    announcements: safeAnnouncements,
    prayer_requests: safePrayer,
    pdf_preview: pdfLines.join('\n'),
    download_url: `/api/custom-views/bulletin-pdf/${bulletinNumber}.pdf`,
    generated_at: '2026-05-18T12:00:00Z',
    page_count: 2,
  });
});

// ---------- 4) NON-VIZ: Ministry roles / groups editor (CRUD) ----------
let _ministryRoles = [
  { id: 'min-001', ministry: 'Worship Team', role: 'Music Director', assignee: 'Sister Hannah Lewis', members: 12, schedule: 'Sundays 8am', active: true, updated_at: '2026-05-01T10:00:00Z' },
  { id: 'min-002', ministry: 'Youth Fellowship', role: 'Youth Pastor', assignee: 'Pastor Daniel Reed', members: 34, schedule: 'Fridays 7pm', active: true, updated_at: '2026-05-03T10:00:00Z' },
  { id: 'min-003', ministry: 'Outreach & Charity', role: 'Outreach Coordinator', assignee: 'Deacon Paul Mensah', members: 18, schedule: 'Saturdays 9am', active: true, updated_at: '2026-05-05T10:00:00Z' },
  { id: 'min-004', ministry: 'Childrens Ministry', role: 'Lead Teacher', assignee: 'Teacher Ruth Adams', members: 22, schedule: 'Sundays 10am', active: true, updated_at: '2026-05-07T10:00:00Z' },
  { id: 'min-005', ministry: 'Prayer Warriors', role: 'Prayer Lead', assignee: 'Elder Aaron Cole', members: 16, schedule: 'Wednesdays 6pm', active: true, updated_at: '2026-05-09T10:00:00Z' },
  { id: 'min-006', ministry: 'Hospitality', role: 'Greeter Captain', assignee: 'Sister Mary Okonkwo', members: 9, schedule: 'Sundays 9am', active: true, updated_at: '2026-05-11T10:00:00Z' },
];
let _nextId = 7;

router.get('/ministry-roles', (req, res) => {
  const activeOnly = req.query.active === 'true';
  const list = activeOnly ? _ministryRoles.filter((r) => r.active) : _ministryRoles;
  res.json({
    count: list.length,
    total_members: list.reduce((s, r) => s + (r.members || 0), 0),
    ministries: Array.from(new Set(_ministryRoles.map((r) => r.ministry))),
    roles: list,
  });
});

router.post('/ministry-roles', (req, res) => {
  const { ministry, role, assignee, members, schedule, active } = req.body || {};
  if (!ministry || !role) {
    return res.status(400).json({ error: 'ministry and role are required' });
  }
  const newRow = {
    id: `min-${String(_nextId++).padStart(3, '0')}`,
    ministry,
    role,
    assignee: assignee || 'Unassigned',
    members: Number.isFinite(Number(members)) ? Number(members) : 0,
    schedule: schedule || 'TBD',
    active: active !== false,
    updated_at: new Date().toISOString(),
  };
  _ministryRoles.push(newRow);
  res.status(201).json({ created: newRow, total: _ministryRoles.length });
});

router.put('/ministry-roles/:id', (req, res) => {
  const idx = _ministryRoles.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Role not found' });
  const allowed = ['ministry', 'role', 'assignee', 'members', 'schedule', 'active'];
  const body = req.body || {};
  allowed.forEach((k) => {
    if (k in body) _ministryRoles[idx][k] = body[k];
  });
  _ministryRoles[idx].updated_at = new Date().toISOString();
  res.json({ updated: _ministryRoles[idx] });
});

router.delete('/ministry-roles/:id', (req, res) => {
  const idx = _ministryRoles.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Role not found' });
  const removed = _ministryRoles.splice(idx, 1)[0];
  res.json({ deleted: removed, remaining: _ministryRoles.length });
});

module.exports = router;
