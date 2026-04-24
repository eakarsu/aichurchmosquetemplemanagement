const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../services/ai');

// GET /api/counseling - list all sessions
router.get('/', async (req, res) => {
  try {
    const { status, counselor, session_type, search } = req.query;
    let query = 'SELECT * FROM counseling ORDER BY session_date DESC';
    let params = [];

    if (search) {
      query = 'SELECT * FROM counseling WHERE client_name ILIKE $1 OR topic ILIKE $1 ORDER BY session_date DESC';
      params = [`%${search}%`];
    } else if (status) {
      query = 'SELECT * FROM counseling WHERE status = $1 ORDER BY session_date DESC';
      params = [status];
    } else if (counselor) {
      query = 'SELECT * FROM counseling WHERE counselor ILIKE $1 ORDER BY session_date DESC';
      params = [`%${counselor}%`];
    } else if (session_type) {
      query = 'SELECT * FROM counseling WHERE session_type = $1 ORDER BY session_date DESC';
      params = [session_type];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching counseling sessions:', err);
    res.status(500).json({ error: 'Failed to fetch counseling sessions' });
  }
});

// GET /api/counseling/:id - single session
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM counseling WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Counseling session not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching counseling session:', err);
    res.status(500).json({ error: 'Failed to fetch counseling session' });
  }
});

// POST /api/counseling - create
router.post('/', async (req, res) => {
  try {
    const { client_name, counselor, session_date, session_type, status, is_confidential, topic, notes, follow_up_date, duration } = req.body;

    const result = await pool.query(
      `INSERT INTO counseling (client_name, counselor, session_date, session_type, status, is_confidential, topic, notes, follow_up_date, duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [client_name, counselor, session_date, session_type, status || 'scheduled', is_confidential !== false, topic, notes, follow_up_date, duration || 60]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating counseling session:', err);
    res.status(500).json({ error: 'Failed to create counseling session' });
  }
});

// PUT /api/counseling/:id - update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { client_name, counselor, session_date, session_type, status, is_confidential, topic, notes, follow_up_date, duration } = req.body;

    const result = await pool.query(
      `UPDATE counseling SET client_name=$1, counselor=$2, session_date=$3, session_type=$4,
       status=$5, is_confidential=$6, topic=$7, notes=$8, follow_up_date=$9, duration=$10
       WHERE id=$11 RETURNING *`,
      [client_name, counselor, session_date, session_type, status, is_confidential, topic, notes, follow_up_date, duration, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Counseling session not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating counseling session:', err);
    res.status(500).json({ error: 'Failed to update counseling session' });
  }
});

// DELETE /api/counseling/:id - delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM counseling WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Counseling session not found' });
    }

    res.json({ message: 'Counseling session deleted successfully' });
  } catch (err) {
    console.error('Error deleting counseling session:', err);
    res.status(500).json({ error: 'Failed to delete counseling session' });
  }
});

// POST /api/counseling/ai-session-prep - AI prepares session notes
router.post('/ai-session-prep', async (req, res) => {
  try {
    const { session_type, topic, client_background, previous_sessions, specific_concerns } = req.body;

    const systemPrompt = 'You are a pastoral counseling advisor. Help prepare session discussion points and therapeutic approaches for the given counseling context. Be compassionate and professional.';
    const prompt = `Please help me prepare for an upcoming counseling session:
- Session type: ${session_type || 'pastoral'}
- Topic: ${topic || 'General pastoral counseling'}
- Client background: ${client_background || 'Not provided'}
- Previous session notes: ${previous_sessions || 'First session'}
- Specific concerns: ${specific_concerns || 'None specified'}

Please provide:
1. Suggested opening approach
2. Key discussion points
3. Therapeutic techniques to consider
4. Scripture or spiritual resources that may be helpful
5. Potential homework or follow-up actions`;

    const preparation = await askAI(prompt, systemPrompt);
    res.json({ preparation });
  } catch (err) {
    console.error('Error generating session preparation:', err);
    res.status(500).json({ error: 'Failed to generate session preparation' });
  }
});

module.exports = router;
