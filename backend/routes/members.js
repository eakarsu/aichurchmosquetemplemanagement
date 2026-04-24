const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../services/ai');

// GET /api/members/stats/summary
router.get('/stats/summary', async (req, res) => {
  try {
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM members');
    const activeResult = await pool.query("SELECT COUNT(*) as active FROM members WHERE status = 'active'");
    const typeResult = await pool.query(
      'SELECT membership_type, COUNT(*) as count FROM members GROUP BY membership_type ORDER BY count DESC'
    );
    const recentResult = await pool.query(
      "SELECT COUNT(*) as recent FROM members WHERE join_date >= NOW() - INTERVAL '30 days'"
    );

    res.json({
      total: parseInt(totalResult.rows[0].total),
      active: parseInt(activeResult.rows[0].active),
      recent_joins: parseInt(recentResult.rows[0].recent),
      by_type: typeResult.rows,
    });
  } catch (err) {
    console.error('Error fetching member stats:', err);
    res.status(500).json({ error: 'Failed to fetch member statistics' });
  }
});

// GET /api/members
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM members ORDER BY last_name, first_name';
    let params = [];

    if (search) {
      query = `SELECT * FROM members WHERE
        first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1
        ORDER BY last_name, first_name`;
      params = [`%${search}%`];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// GET /api/members/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM members WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching member:', err);
    res.status(500).json({ error: 'Failed to fetch member' });
  }
});

// POST /api/members
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, address, join_date, membership_type, status, groups, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO members (first_name, last_name, email, phone, address, join_date, membership_type, status, groups, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [first_name, last_name, email, phone, address, join_date, membership_type || 'regular', status || 'active', groups || [], notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating member:', err);
    res.status(500).json({ error: 'Failed to create member' });
  }
});

// PUT /api/members/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, address, join_date, membership_type, status, groups, notes } = req.body;

    const result = await pool.query(
      `UPDATE members SET first_name=$1, last_name=$2, email=$3, phone=$4, address=$5,
       join_date=$6, membership_type=$7, status=$8, groups=$9, notes=$10
       WHERE id=$11 RETURNING *`,
      [first_name, last_name, email, phone, address, join_date, membership_type, status, groups, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating member:', err);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

// DELETE /api/members/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM members WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    console.error('Error deleting member:', err);
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

// POST /api/members/ai-engagement
router.post('/ai-engagement', async (req, res) => {
  try {
    const { member_data } = req.body;

    let membersInfo = '';
    if (member_data) {
      membersInfo = JSON.stringify(member_data);
    } else {
      const result = await pool.query('SELECT first_name, last_name, membership_type, status, groups, join_date FROM members LIMIT 20');
      membersInfo = JSON.stringify(result.rows);
    }

    const systemPrompt = 'You are a congregation engagement specialist. Analyze member data and suggest personalized engagement strategies.';
    const prompt = `Analyze the following member data and suggest personalized engagement strategies to increase participation and community connection:\n\n${membersInfo}`;

    const suggestions = await askAI(prompt, systemPrompt);
    res.json({ suggestions });
  } catch (err) {
    console.error('Error generating engagement suggestions:', err);
    res.status(500).json({ error: 'Failed to generate engagement suggestions' });
  }
});

module.exports = router;
