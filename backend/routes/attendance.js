const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../services/ai');

// GET /api/attendance/stats/summary - attendance stats (must be before /:id)
router.get('/stats/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS total_records,
        ROUND(AVG(total_attendees)) AS avg_attendees,
        SUM(total_attendees) AS total_attendees,
        SUM(new_visitors) AS total_new_visitors,
        SUM(online_viewers) AS total_online_viewers,
        SUM(offering_collected) AS total_offering,
        ROUND(AVG(offering_collected), 2) AS avg_offering,
        MAX(total_attendees) AS max_attendees,
        MIN(total_attendees) AS min_attendees
      FROM attendance
    `);

    const byType = await pool.query(`
      SELECT
        service_type,
        COUNT(*) AS count,
        ROUND(AVG(total_attendees)) AS avg_attendees,
        SUM(total_attendees) AS total_attendees
      FROM attendance
      GROUP BY service_type
      ORDER BY avg_attendees DESC
    `);

    const trend = await pool.query(`
      SELECT
        TO_CHAR(service_date, 'YYYY-MM') AS month,
        ROUND(AVG(total_attendees)) AS avg_attendees,
        SUM(new_visitors) AS new_visitors,
        SUM(online_viewers) AS online_viewers
      FROM attendance
      GROUP BY TO_CHAR(service_date, 'YYYY-MM')
      ORDER BY month
    `);

    res.json({
      summary: result.rows[0],
      by_service_type: byType.rows,
      monthly_trend: trend.rows,
    });
  } catch (err) {
    console.error('Error fetching attendance stats:', err);
    res.status(500).json({ error: 'Failed to fetch attendance stats' });
  }
});

// GET /api/attendance - list all attendance records
router.get('/', async (req, res) => {
  try {
    const { start, end } = req.query;
    let query = 'SELECT * FROM attendance ORDER BY service_date DESC';
    let params = [];

    if (start && end) {
      query = 'SELECT * FROM attendance WHERE service_date >= $1 AND service_date <= $2 ORDER BY service_date DESC';
      params = [start, end];
    } else if (start) {
      query = 'SELECT * FROM attendance WHERE service_date >= $1 ORDER BY service_date DESC';
      params = [start];
    } else if (end) {
      query = 'SELECT * FROM attendance WHERE service_date <= $1 ORDER BY service_date DESC';
      params = [end];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching attendance records:', err);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// GET /api/attendance/:id - single record
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM attendance WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching attendance record:', err);
    res.status(500).json({ error: 'Failed to fetch attendance record' });
  }
});

// POST /api/attendance - create
router.post('/', async (req, res) => {
  try {
    const { service_name, service_date, service_type, total_attendees, new_visitors, online_viewers, offering_collected, notes, weather } = req.body;

    const result = await pool.query(
      `INSERT INTO attendance (service_name, service_date, service_type, total_attendees, new_visitors, online_viewers, offering_collected, notes, weather)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [service_name, service_date, service_type, total_attendees, new_visitors || 0, online_viewers || 0, offering_collected || 0, notes, weather]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating attendance record:', err);
    res.status(500).json({ error: 'Failed to create attendance record' });
  }
});

// PUT /api/attendance/:id - update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { service_name, service_date, service_type, total_attendees, new_visitors, online_viewers, offering_collected, notes, weather } = req.body;

    const result = await pool.query(
      `UPDATE attendance SET service_name=$1, service_date=$2, service_type=$3, total_attendees=$4,
       new_visitors=$5, online_viewers=$6, offering_collected=$7, notes=$8, weather=$9
       WHERE id=$10 RETURNING *`,
      [service_name, service_date, service_type, total_attendees, new_visitors, online_viewers, offering_collected, notes, weather, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating attendance record:', err);
    res.status(500).json({ error: 'Failed to update attendance record' });
  }
});

// DELETE /api/attendance/:id - delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM attendance WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.json({ message: 'Attendance record deleted successfully' });
  } catch (err) {
    console.error('Error deleting attendance record:', err);
    res.status(500).json({ error: 'Failed to delete attendance record' });
  }
});

// POST /api/attendance/ai-insights - AI analyzes attendance trends
router.post('/ai-insights', async (req, res) => {
  try {
    const { question, date_range } = req.body;

    let query = 'SELECT * FROM attendance ORDER BY service_date DESC';
    let params = [];

    if (date_range && date_range.start && date_range.end) {
      query = 'SELECT * FROM attendance WHERE service_date >= $1 AND service_date <= $2 ORDER BY service_date DESC';
      params = [date_range.start, date_range.end];
    }

    const attendanceData = await pool.query(query, params);

    const systemPrompt = 'You are a church growth analyst. Analyze attendance data and provide insights on trends, patterns, and recommendations for increasing engagement.';
    const prompt = `Here is our attendance data:\n${JSON.stringify(attendanceData.rows, null, 2)}\n\n${question || 'Please analyze this attendance data and provide insights on trends, patterns, and recommendations for increasing engagement.'}`;

    const insights = await askAI(prompt, systemPrompt);
    res.json({ insights });
  } catch (err) {
    console.error('Error generating attendance insights:', err);
    res.status(500).json({ error: 'Failed to generate attendance insights' });
  }
});

module.exports = router;
