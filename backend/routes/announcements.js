const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../services/ai');

// GET /api/announcements
router.get('/', async (req, res) => {
  try {
    const { category, priority, search } = req.query;
    let query = 'SELECT * FROM announcements ORDER BY publish_date DESC';
    let params = [];

    if (search) {
      query = 'SELECT * FROM announcements WHERE title ILIKE $1 OR content ILIKE $1 ORDER BY publish_date DESC';
      params = [`%${search}%`];
    } else if (category) {
      query = 'SELECT * FROM announcements WHERE category = $1 ORDER BY publish_date DESC';
      params = [category];
    } else if (priority) {
      query = 'SELECT * FROM announcements WHERE priority = $1 ORDER BY publish_date DESC';
      params = [priority];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching announcements:', err);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// GET /api/announcements/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM announcements WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching announcement:', err);
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
});

// POST /api/announcements
router.post('/', async (req, res) => {
  try {
    const { title, content, author, category, priority, publish_date, expiry_date, target_audience, status } = req.body;

    const result = await pool.query(
      `INSERT INTO announcements (title, content, author, category, priority, publish_date, expiry_date, target_audience, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, content, author, category, priority || 'normal', publish_date, expiry_date, target_audience, status || 'published']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating announcement:', err);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// PUT /api/announcements/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, author, category, priority, publish_date, expiry_date, target_audience, status } = req.body;

    const result = await pool.query(
      `UPDATE announcements SET title=$1, content=$2, author=$3, category=$4, priority=$5,
       publish_date=$6, expiry_date=$7, target_audience=$8, status=$9
       WHERE id=$10 RETURNING *`,
      [title, content, author, category, priority, publish_date, expiry_date, target_audience, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating announcement:', err);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// DELETE /api/announcements/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM announcements WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json({ message: 'Announcement deleted successfully' });
  } catch (err) {
    console.error('Error deleting announcement:', err);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

// POST /api/announcements/ai-draft
router.post('/ai-draft', async (req, res) => {
  try {
    const { topic, category, target_audience, tone, key_details } = req.body;

    const systemPrompt = 'You are a communications director for a religious organization. Draft a professional, warm announcement.';
    const prompt = `Draft an announcement with the following details:
- Topic: ${topic || 'General announcement'}
- Category: ${category || 'general'}
- Target audience: ${target_audience || 'all members'}
- Tone: ${tone || 'warm and professional'}
- Key details: ${key_details || 'Please include relevant information'}`;

    const draft = await askAI(prompt, systemPrompt);
    res.json({ draft });
  } catch (err) {
    console.error('Error drafting announcement:', err);
    res.status(500).json({ error: 'Failed to draft announcement' });
  }
});

module.exports = router;
