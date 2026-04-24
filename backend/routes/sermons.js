const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../services/ai');

// GET /api/sermons
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM sermons ORDER BY date DESC';
    let params = [];

    if (search) {
      query = `SELECT * FROM sermons WHERE
        title ILIKE $1 OR speaker ILIKE $1 OR scripture_text ILIKE $1 OR transcript ILIKE $1
        ORDER BY date DESC`;
      params = [`%${search}%`];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching sermons:', err);
    res.status(500).json({ error: 'Failed to fetch sermons' });
  }
});

// GET /api/sermons/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM sermons WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching sermon:', err);
    res.status(500).json({ error: 'Failed to fetch sermon' });
  }
});

// POST /api/sermons
router.post('/', async (req, res) => {
  try {
    const { title, speaker, date, duration, scripture_text, transcript, summary, tags, audio_url, status } = req.body;

    const result = await pool.query(
      `INSERT INTO sermons (title, speaker, date, duration, scripture_text, transcript, summary, tags, audio_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [title, speaker, date, duration, scripture_text, transcript, summary, tags || [], audio_url, status || 'archived']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating sermon:', err);
    res.status(500).json({ error: 'Failed to create sermon' });
  }
});

// PUT /api/sermons/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, speaker, date, duration, scripture_text, transcript, summary, tags, audio_url, status } = req.body;

    const result = await pool.query(
      `UPDATE sermons SET title=$1, speaker=$2, date=$3, duration=$4, scripture_text=$5,
       transcript=$6, summary=$7, tags=$8, audio_url=$9, status=$10 WHERE id=$11 RETURNING *`,
      [title, speaker, date, duration, scripture_text, transcript, summary, tags, audio_url, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating sermon:', err);
    res.status(500).json({ error: 'Failed to update sermon' });
  }
});

// DELETE /api/sermons/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM sermons WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    res.json({ message: 'Sermon deleted successfully' });
  } catch (err) {
    console.error('Error deleting sermon:', err);
    res.status(500).json({ error: 'Failed to delete sermon' });
  }
});

// POST /api/sermons/:id/ai-summarize
router.post('/:id/ai-summarize', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM sermons WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    const sermon = result.rows[0];
    const transcript = sermon.transcript || sermon.scripture_text || '';

    if (!transcript) {
      return res.status(400).json({ error: 'No transcript or scripture text available to summarize' });
    }

    const systemPrompt = 'You are a religious text analyst. Summarize this sermon highlighting key themes, scripture references, and main takeaways.';
    const prompt = `Please summarize the following sermon titled "${sermon.title}" by ${sermon.speaker}:\n\n${transcript}`;

    const summary = await askAI(prompt, systemPrompt);

    await pool.query('UPDATE sermons SET summary = $1 WHERE id = $2', [summary, id]);

    res.json({ summary });
  } catch (err) {
    console.error('Error summarizing sermon:', err);
    res.status(500).json({ error: 'Failed to summarize sermon' });
  }
});

// POST /api/sermons/ai-generate-topics
router.post('/ai-generate-topics', async (req, res) => {
  try {
    const { theme, audience, season } = req.body;

    const systemPrompt = 'You are a knowledgeable religious advisor. Suggest sermon topics with brief outlines.';
    let prompt = 'Please suggest 5 sermon topics with brief outlines.';

    if (theme) prompt += ` Focus on the theme: ${theme}.`;
    if (audience) prompt += ` Target audience: ${audience}.`;
    if (season) prompt += ` Season/occasion: ${season}.`;

    const topics = await askAI(prompt, systemPrompt);
    res.json({ topics });
  } catch (err) {
    console.error('Error generating topics:', err);
    res.status(500).json({ error: 'Failed to generate sermon topics' });
  }
});

module.exports = router;
