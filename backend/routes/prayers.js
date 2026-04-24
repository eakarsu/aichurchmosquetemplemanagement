const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../services/ai');

// GET /api/prayers
router.get('/', async (req, res) => {
  try {
    const { type, status } = req.query;
    let query = 'SELECT * FROM prayers ORDER BY created_at DESC';
    let params = [];

    if (type) {
      query = 'SELECT * FROM prayers WHERE request_type = $1 ORDER BY created_at DESC';
      params = [type];
    } else if (status) {
      query = 'SELECT * FROM prayers WHERE status = $1 ORDER BY created_at DESC';
      params = [status];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching prayers:', err);
    res.status(500).json({ error: 'Failed to fetch prayers' });
  }
});

// GET /api/prayers/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM prayers WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prayer request not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching prayer:', err);
    res.status(500).json({ error: 'Failed to fetch prayer request' });
  }
});

// POST /api/prayers
router.post('/', async (req, res) => {
  try {
    const { requester_name, request_type, prayer_text, is_anonymous, status } = req.body;

    const result = await pool.query(
      `INSERT INTO prayers (requester_name, request_type, prayer_text, is_anonymous, status, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [requester_name, request_type, prayer_text, is_anonymous || false, status || 'active']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating prayer:', err);
    res.status(500).json({ error: 'Failed to create prayer request' });
  }
});

// PUT /api/prayers/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { requester_name, request_type, prayer_text, is_anonymous, status, ai_guidance } = req.body;

    const result = await pool.query(
      `UPDATE prayers SET requester_name=$1, request_type=$2, prayer_text=$3, is_anonymous=$4,
       status=$5, ai_guidance=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [requester_name, request_type, prayer_text, is_anonymous, status, ai_guidance, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prayer request not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating prayer:', err);
    res.status(500).json({ error: 'Failed to update prayer request' });
  }
});

// DELETE /api/prayers/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM prayers WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prayer request not found' });
    }

    res.json({ message: 'Prayer request deleted successfully' });
  } catch (err) {
    console.error('Error deleting prayer:', err);
    res.status(500).json({ error: 'Failed to delete prayer request' });
  }
});

// POST /api/prayers/:id/ai-guidance
router.post('/:id/ai-guidance', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM prayers WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prayer request not found' });
    }

    const prayer = result.rows[0];

    const systemPrompt = 'You are a compassionate spiritual advisor. Provide gentle, non-denominational spiritual guidance and comfort for this prayer request.';
    const prompt = `Please provide spiritual guidance and comfort for this prayer request:
- Type: ${prayer.request_type}
- Request: ${prayer.prayer_text}`;

    const guidance = await askAI(prompt, systemPrompt);

    await pool.query('UPDATE prayers SET ai_guidance = $1, updated_at = NOW() WHERE id = $2', [guidance, id]);

    res.json({ guidance });
  } catch (err) {
    console.error('Error generating guidance:', err);
    res.status(500).json({ error: 'Failed to generate spiritual guidance' });
  }
});

// PUT /api/prayers/:id/pray
router.put('/:id/pray', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE prayers SET prayer_count = prayer_count + 1, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prayer request not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error incrementing prayer count:', err);
    res.status(500).json({ error: 'Failed to update prayer count' });
  }
});

module.exports = router;
