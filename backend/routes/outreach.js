const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../services/ai');

// GET /api/outreach/stats/summary - outreach impact stats (must be before /:id)
router.get('/stats/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS total_programs,
        SUM(budget) AS total_budget,
        SUM(spent) AS total_spent,
        SUM(beneficiaries) AS total_beneficiaries,
        SUM(volunteers_needed) AS total_volunteers_needed,
        SUM(volunteers_assigned) AS total_volunteers_assigned,
        COUNT(*) FILTER (WHERE status = 'active') AS active_programs,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_programs,
        COUNT(*) FILTER (WHERE status = 'planning') AS planning_programs
      FROM outreach
    `);

    const byStatus = await pool.query(`
      SELECT
        status,
        COUNT(*) AS count,
        SUM(budget) AS total_budget,
        SUM(spent) AS total_spent,
        SUM(beneficiaries) AS total_beneficiaries
      FROM outreach
      GROUP BY status
      ORDER BY count DESC
    `);

    const topPrograms = await pool.query(`
      SELECT program_name, beneficiaries, budget, spent, volunteers_assigned, status
      FROM outreach
      ORDER BY beneficiaries DESC
      LIMIT 5
    `);

    res.json({
      summary: result.rows[0],
      by_status: byStatus.rows,
      top_programs_by_impact: topPrograms.rows,
    });
  } catch (err) {
    console.error('Error fetching outreach stats:', err);
    res.status(500).json({ error: 'Failed to fetch outreach stats' });
  }
});

// GET /api/outreach - list all programs
router.get('/', async (req, res) => {
  try {
    const { status, coordinator, search } = req.query;
    let query = 'SELECT * FROM outreach ORDER BY start_date DESC';
    let params = [];

    if (search) {
      query = 'SELECT * FROM outreach WHERE program_name ILIKE $1 OR description ILIKE $1 ORDER BY start_date DESC';
      params = [`%${search}%`];
    } else if (status) {
      query = 'SELECT * FROM outreach WHERE status = $1 ORDER BY start_date DESC';
      params = [status];
    } else if (coordinator) {
      query = 'SELECT * FROM outreach WHERE coordinator ILIKE $1 ORDER BY start_date DESC';
      params = [`%${coordinator}%`];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching outreach programs:', err);
    res.status(500).json({ error: 'Failed to fetch outreach programs' });
  }
});

// GET /api/outreach/:id - single program
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM outreach WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Outreach program not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching outreach program:', err);
    res.status(500).json({ error: 'Failed to fetch outreach program' });
  }
});

// POST /api/outreach - create
router.post('/', async (req, res) => {
  try {
    const { program_name, description, coordinator, start_date, end_date, target_community, budget, spent, volunteers_needed, volunteers_assigned, beneficiaries, status, impact_notes } = req.body;

    const result = await pool.query(
      `INSERT INTO outreach (program_name, description, coordinator, start_date, end_date, target_community, budget, spent, volunteers_needed, volunteers_assigned, beneficiaries, status, impact_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [program_name, description, coordinator, start_date, end_date, target_community, budget, spent || 0, volunteers_needed, volunteers_assigned || 0, beneficiaries || 0, status || 'active', impact_notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating outreach program:', err);
    res.status(500).json({ error: 'Failed to create outreach program' });
  }
});

// PUT /api/outreach/:id - update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { program_name, description, coordinator, start_date, end_date, target_community, budget, spent, volunteers_needed, volunteers_assigned, beneficiaries, status, impact_notes } = req.body;

    const result = await pool.query(
      `UPDATE outreach SET program_name=$1, description=$2, coordinator=$3, start_date=$4, end_date=$5,
       target_community=$6, budget=$7, spent=$8, volunteers_needed=$9, volunteers_assigned=$10,
       beneficiaries=$11, status=$12, impact_notes=$13
       WHERE id=$14 RETURNING *`,
      [program_name, description, coordinator, start_date, end_date, target_community, budget, spent, volunteers_needed, volunteers_assigned, beneficiaries, status, impact_notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Outreach program not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating outreach program:', err);
    res.status(500).json({ error: 'Failed to update outreach program' });
  }
});

// DELETE /api/outreach/:id - delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM outreach WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Outreach program not found' });
    }

    res.json({ message: 'Outreach program deleted successfully' });
  } catch (err) {
    console.error('Error deleting outreach program:', err);
    res.status(500).json({ error: 'Failed to delete outreach program' });
  }
});

// POST /api/outreach/ai-impact - AI analyzes impact and suggests improvements
router.post('/ai-impact', async (req, res) => {
  try {
    const { question, program_id } = req.body;

    let outreachData;
    if (program_id) {
      outreachData = await pool.query('SELECT * FROM outreach WHERE id = $1', [program_id]);
    } else {
      outreachData = await pool.query('SELECT * FROM outreach ORDER BY start_date DESC');
    }

    const systemPrompt = 'You are a community outreach strategist. Analyze the outreach program data and provide impact analysis with suggestions for improvement and growth.';
    const prompt = `Here is our outreach program data:\n${JSON.stringify(outreachData.rows, null, 2)}\n\n${question || 'Please analyze our outreach programs and provide an impact assessment with suggestions for improvement, growth opportunities, and resource optimization.'}`;

    const analysis = await askAI(prompt, systemPrompt);
    res.json({ analysis });
  } catch (err) {
    console.error('Error generating outreach impact analysis:', err);
    res.status(500).json({ error: 'Failed to generate outreach impact analysis' });
  }
});

module.exports = router;
