const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET /api/calendar/events?month=MM&year=YYYY
 * Returns all events for the specified month and year.
 * Defaults to the current month/year if not provided.
 */
router.get('/events', async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();

    if (month < 1 || month > 12) {
      return res.status(400).json({ error: 'month must be between 1 and 12' });
    }
    if (year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'year must be between 2000 and 2100' });
    }

    // First day and last day of the requested month
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // month, 0 = last day of previous month

    const result = await pool.query(
      `SELECT
        id, title, description, event_date, end_date, location,
        category, max_attendees, current_attendees, organizer, status
       FROM events
       WHERE event_date >= $1 AND event_date <= $2
       ORDER BY event_date ASC`,
      [startDate, endDate]
    );

    res.json({
      month,
      year,
      start_date: startDate,
      end_date: endDate,
      total_events: result.rows.length,
      events: result.rows
    });
  } catch (err) {
    console.error('Calendar events error:', err);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

/**
 * GET /api/calendar/upcoming
 * Returns all events in the next 30 days from today.
 */
router.get('/upcoming', async (req, res) => {
  try {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT
        id, title, description, event_date, end_date, location,
        category, max_attendees, current_attendees, organizer, status
       FROM events
       WHERE event_date >= $1 AND event_date <= $2
       ORDER BY event_date ASC`,
      [startDate, endDate]
    );

    res.json({
      from: startDate,
      to: endDate,
      total_events: result.rows.length,
      events: result.rows
    });
  } catch (err) {
    console.error('Upcoming events error:', err);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});

module.exports = router;
