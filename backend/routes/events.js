const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../services/ai');

// GET /api/events
// Supports pagination via ?page=1&limit=20, search via ?search=, and filtering via ?category=
router.get('/', async (req, res) => {
  try {
    const { search, category, page, limit } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;

    let conditions = [];
    let params = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(`(title ILIKE $${paramIdx} OR description ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (category) {
      conditions.push(`category = $${paramIdx++}`);
      params.push(category);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // If no pagination params, return all records (legacy behaviour)
    if (!page && !limit) {
      const result = await pool.query(`SELECT * FROM events ${whereClause} ORDER BY event_date ASC`, params);
      return res.json(result.rows);
    }

    const dataParams = [...params, limitNum, offset];
    const [dataResult, countResult] = await Promise.all([
      pool.query(`SELECT * FROM events ${whereClause} ORDER BY event_date ASC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`, dataParams),
      pool.query(`SELECT COUNT(*) FROM events ${whereClause}`, params)
    ]);

    const total = parseInt(countResult.rows[0].count);
    res.json({
      data: dataResult.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// POST /api/events
router.post('/', async (req, res) => {
  try {
    const { title, description, event_date, end_date, location, category, max_attendees, current_attendees, organizer, status } = req.body;

    const result = await pool.query(
      `INSERT INTO events (title, description, event_date, end_date, location, category, max_attendees, current_attendees, organizer, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [title, description, event_date, end_date, location, category, max_attendees, current_attendees || 0, organizer, status || 'upcoming']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT /api/events/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, event_date, end_date, location, category, max_attendees, current_attendees, organizer, status } = req.body;

    const result = await pool.query(
      `UPDATE events SET title=$1, description=$2, event_date=$3, end_date=$4, location=$5,
       category=$6, max_attendees=$7, current_attendees=$8, organizer=$9, status=$10
       WHERE id=$11 RETURNING *`,
      [title, description, event_date, end_date, location, category, max_attendees, current_attendees, organizer, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE /api/events/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// POST /api/events/ai-generate-description
router.post('/ai-generate-description', async (req, res) => {
  try {
    const { title, category, date, location, audience } = req.body;

    const systemPrompt = 'You are an event coordinator for a religious organization. Create an engaging event description.';
    const prompt = `Create an engaging event description for:
- Event title: ${title || 'Community Event'}
- Category: ${category || 'general'}
- Date: ${date || 'upcoming'}
- Location: ${location || 'our facility'}
- Target audience: ${audience || 'all members and community'}`;

    const description = await askAI(prompt, systemPrompt);
    res.json({ description });
  } catch (err) {
    console.error('Error generating event description:', err);
    res.status(500).json({ error: 'Failed to generate event description' });
  }
});

module.exports = router;
