const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../services/ai');

// GET /api/facilities
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM facilities ORDER BY name ASC';
    let params = [];

    if (search) {
      query = 'SELECT * FROM facilities WHERE name ILIKE $1 OR description ILIKE $1 ORDER BY name ASC';
      params = [`%${search}%`];
    } else if (status) {
      query = 'SELECT * FROM facilities WHERE status = $1 ORDER BY name ASC';
      params = [status];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching facilities:', err);
    res.status(500).json({ error: 'Failed to fetch facilities' });
  }
});

// GET /api/facilities/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM facilities WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching facility:', err);
    res.status(500).json({ error: 'Failed to fetch facility' });
  }
});

// POST /api/facilities
router.post('/', async (req, res) => {
  try {
    const { name, description, capacity, amenities, hourly_rate, status, booking_date, booking_time, booked_by, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO facilities (name, description, capacity, amenities, hourly_rate, status, booking_date, booking_time, booked_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, description, capacity, amenities || [], hourly_rate, status || 'available', booking_date, booking_time, booked_by, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating facility:', err);
    res.status(500).json({ error: 'Failed to create facility' });
  }
});

// PUT /api/facilities/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, capacity, amenities, hourly_rate, status, booking_date, booking_time, booked_by, notes } = req.body;

    const result = await pool.query(
      `UPDATE facilities SET name=$1, description=$2, capacity=$3, amenities=$4, hourly_rate=$5,
       status=$6, booking_date=$7, booking_time=$8, booked_by=$9, notes=$10
       WHERE id=$11 RETURNING *`,
      [name, description, capacity, amenities, hourly_rate, status, booking_date, booking_time, booked_by, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating facility:', err);
    res.status(500).json({ error: 'Failed to update facility' });
  }
});

// DELETE /api/facilities/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM facilities WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    res.json({ message: 'Facility deleted successfully' });
  } catch (err) {
    console.error('Error deleting facility:', err);
    res.status(500).json({ error: 'Failed to delete facility' });
  }
});

// POST /api/facilities/ai-optimize
router.post('/ai-optimize', async (req, res) => {
  try {
    const { facility_data } = req.body;

    let facilitiesInfo = '';
    if (facility_data) {
      facilitiesInfo = JSON.stringify(facility_data);
    } else {
      const result = await pool.query('SELECT name, capacity, amenities, hourly_rate, status, booking_date, booking_time FROM facilities');
      facilitiesInfo = JSON.stringify(result.rows);
    }

    const systemPrompt = 'You are a facilities manager. Suggest optimal scheduling and usage for these facilities.';
    const prompt = `Analyze the following facility data and suggest optimal scheduling and usage strategies:\n\n${facilitiesInfo}`;

    const suggestions = await askAI(prompt, systemPrompt);
    res.json({ suggestions });
  } catch (err) {
    console.error('Error optimizing facilities:', err);
    res.status(500).json({ error: 'Failed to generate facility optimization suggestions' });
  }
});

module.exports = router;
