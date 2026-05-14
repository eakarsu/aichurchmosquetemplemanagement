/**
 * Reports & export (audit gap: missing reporting/export).
 *   GET /api/reports/summary             - counts of major resources
 *   GET /api/reports/donations.csv       - CSV donations export
 *   GET /api/reports/members.csv         - CSV members export
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

async function safeCount(table) {
  try {
    const r = await pool.query(`SELECT COUNT(*)::int AS c FROM ${table}`);
    return r.rows[0].c;
  } catch (_) { return 0; }
}

function csvCell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
}

async function tableToCsv(res, table, filename) {
  let rows = [];
  try {
    const r = await pool.query(`SELECT * FROM ${table} ORDER BY 1 DESC LIMIT 5000`);
    rows = r.rows;
  } catch (_) { rows = []; }
  const headers = rows.length ? Object.keys(rows[0]) : ['id'];
  const lines = [headers.join(',')];
  for (const row of rows) lines.push(headers.map(h => csvCell(row[h])).join(','));
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(lines.join('\n'));
}

router.get('/summary', async (req, res) => {
  try {
    const [members, donations, events, sermons, prayers, volunteers, attendance] = await Promise.all([
      safeCount('members'), safeCount('donations'), safeCount('events'),
      safeCount('sermons'), safeCount('prayers'), safeCount('volunteers'),
      safeCount('attendance')
    ]);
    res.json({ members, donations, events, sermons, prayers, volunteers, attendance });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/donations.csv', (req, res) => tableToCsv(res, 'donations', 'donations.csv'));
router.get('/members.csv', (req, res) => tableToCsv(res, 'members', 'members.csv'));
router.get('/events.csv', (req, res) => tableToCsv(res, 'events', 'events.csv'));
router.get('/attendance.csv', (req, res) => tableToCsv(res, 'attendance', 'attendance.csv'));

module.exports = router;
