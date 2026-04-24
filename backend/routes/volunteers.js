const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../services/ai');

// GET /api/volunteers
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM volunteers ORDER BY name ASC';
    let params = [];

    if (search) {
      query = `SELECT * FROM volunteers WHERE name ILIKE $1 OR email ILIKE $1 OR assigned_ministry ILIKE $1 ORDER BY name ASC`;
      params = [`%${search}%`];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching volunteers:', err);
    res.status(500).json({ error: 'Failed to fetch volunteers' });
  }
});

// GET /api/volunteers/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM volunteers WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching volunteer:', err);
    res.status(500).json({ error: 'Failed to fetch volunteer' });
  }
});

// POST /api/volunteers
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, skills, availability, assigned_ministry, hours_logged, status, join_date, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO volunteers (name, email, phone, skills, availability, assigned_ministry, hours_logged, status, join_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, email, phone, skills || [], availability || [], assigned_ministry, hours_logged || 0, status || 'active', join_date, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating volunteer:', err);
    res.status(500).json({ error: 'Failed to create volunteer' });
  }
});

// PUT /api/volunteers/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, skills, availability, assigned_ministry, hours_logged, status, join_date, notes } = req.body;

    const result = await pool.query(
      `UPDATE volunteers SET name=$1, email=$2, phone=$3, skills=$4, availability=$5,
       assigned_ministry=$6, hours_logged=$7, status=$8, join_date=$9, notes=$10
       WHERE id=$11 RETURNING *`,
      [name, email, phone, skills, availability, assigned_ministry, hours_logged, status, join_date, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating volunteer:', err);
    res.status(500).json({ error: 'Failed to update volunteer' });
  }
});

// DELETE /api/volunteers/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM volunteers WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    res.json({ message: 'Volunteer deleted successfully' });
  } catch (err) {
    console.error('Error deleting volunteer:', err);
    res.status(500).json({ error: 'Failed to delete volunteer' });
  }
});

// POST /api/volunteers/ai-match
router.post('/ai-match', async (req, res) => {
  try {
    const { volunteer_data } = req.body;

    let volunteersInfo = '';
    if (volunteer_data) {
      volunteersInfo = JSON.stringify(volunteer_data);
    } else {
      const result = await pool.query('SELECT name, skills, availability, assigned_ministry, hours_logged FROM volunteers LIMIT 20');
      volunteersInfo = JSON.stringify(result.rows);
    }

    const systemPrompt = 'You are a volunteer coordinator. Based on skills and availability, suggest the best ministry assignments.';
    const prompt = `Based on the following volunteer data, suggest optimal ministry assignments and explain your reasoning:\n\n${volunteersInfo}`;

    const matches = await askAI(prompt, systemPrompt);
    res.json({ matches });
  } catch (err) {
    console.error('Error matching volunteers:', err);
    res.status(500).json({ error: 'Failed to match volunteers' });
  }
});

module.exports = router;
