const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../services/ai');

// GET /api/small-groups - list all groups
router.get('/', async (req, res) => {
  try {
    const { category, status, search } = req.query;
    let query = 'SELECT * FROM small_groups ORDER BY name ASC';
    let params = [];

    if (search) {
      query = 'SELECT * FROM small_groups WHERE name ILIKE $1 OR description ILIKE $1 ORDER BY name ASC';
      params = [`%${search}%`];
    } else if (category) {
      query = 'SELECT * FROM small_groups WHERE category = $1 ORDER BY name ASC';
      params = [category];
    } else if (status) {
      query = 'SELECT * FROM small_groups WHERE status = $1 ORDER BY name ASC';
      params = [status];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching small groups:', err);
    res.status(500).json({ error: 'Failed to fetch small groups' });
  }
});

// GET /api/small-groups/:id - single group
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM small_groups WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Small group not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching small group:', err);
    res.status(500).json({ error: 'Failed to fetch small group' });
  }
});

// POST /api/small-groups - create
router.post('/', async (req, res) => {
  try {
    const { name, description, leader, meeting_day, meeting_time, location, category, max_members, current_members, curriculum, status, start_date, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO small_groups (name, description, leader, meeting_day, meeting_time, location, category, max_members, current_members, curriculum, status, start_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [name, description, leader, meeting_day, meeting_time, location, category, max_members, current_members || 0, curriculum, status || 'active', start_date, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating small group:', err);
    res.status(500).json({ error: 'Failed to create small group' });
  }
});

// PUT /api/small-groups/:id - update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, leader, meeting_day, meeting_time, location, category, max_members, current_members, curriculum, status, start_date, notes } = req.body;

    const result = await pool.query(
      `UPDATE small_groups SET name=$1, description=$2, leader=$3, meeting_day=$4, meeting_time=$5,
       location=$6, category=$7, max_members=$8, current_members=$9, curriculum=$10,
       status=$11, start_date=$12, notes=$13
       WHERE id=$14 RETURNING *`,
      [name, description, leader, meeting_day, meeting_time, location, category, max_members, current_members, curriculum, status, start_date, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Small group not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating small group:', err);
    res.status(500).json({ error: 'Failed to update small group' });
  }
});

// DELETE /api/small-groups/:id - delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM small_groups WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Small group not found' });
    }

    res.json({ message: 'Small group deleted successfully' });
  } catch (err) {
    console.error('Error deleting small group:', err);
    res.status(500).json({ error: 'Failed to delete small group' });
  }
});

// POST /api/small-groups/ai-curriculum - AI suggests curriculum
router.post('/ai-curriculum', async (req, res) => {
  try {
    const { group_name, category, current_curriculum, member_count, duration_weeks, focus_area } = req.body;

    const systemPrompt = 'You are a small group ministry expert. Suggest engaging curriculum topics and discussion guides for small groups.';
    const prompt = `Please suggest a curriculum for the following small group:
- Group name: ${group_name || 'General small group'}
- Category: ${category || 'bible_study'}
- Current/previous curriculum: ${current_curriculum || 'None specified'}
- Number of members: ${member_count || 'Not specified'}
- Desired duration: ${duration_weeks || '8-12'} weeks
- Focus area: ${focus_area || 'General spiritual growth'}

Please provide a detailed curriculum outline with weekly topics, discussion questions, and suggested activities.`;

    const curriculum = await askAI(prompt, systemPrompt);
    res.json({ curriculum });
  } catch (err) {
    console.error('Error generating curriculum suggestion:', err);
    res.status(500).json({ error: 'Failed to generate curriculum suggestion' });
  }
});

module.exports = router;
