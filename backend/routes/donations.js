const express = require('express');
const router = express.Router();
const pool = require('../db');
const { askAI } = require('../services/ai');

// GET /api/donations/stats/summary
router.get('/stats/summary', async (req, res) => {
  try {
    const totalResult = await pool.query('SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM donations');
    const categoryResult = await pool.query(
      'SELECT category, COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM donations GROUP BY category ORDER BY total DESC'
    );
    const monthlyResult = await pool.query(
      `SELECT TO_CHAR(date, 'YYYY-MM') as month, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
       FROM donations GROUP BY TO_CHAR(date, 'YYYY-MM') ORDER BY month DESC LIMIT 12`
    );
    const avgResult = await pool.query('SELECT COALESCE(AVG(amount), 0) as average FROM donations');

    res.json({
      total: parseFloat(totalResult.rows[0].total),
      count: parseInt(totalResult.rows[0].count),
      average: parseFloat(avgResult.rows[0].average),
      by_category: categoryResult.rows,
      by_month: monthlyResult.rows,
    });
  } catch (err) {
    console.error('Error fetching donation stats:', err);
    res.status(500).json({ error: 'Failed to fetch donation statistics' });
  }
});

// GET /api/donations
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM donations ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching donations:', err);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

// GET /api/donations/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM donations WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching donation:', err);
    res.status(500).json({ error: 'Failed to fetch donation' });
  }
});

// POST /api/donations
router.post('/', async (req, res) => {
  try {
    const { donor_name, donor_email, amount, date, category, payment_method, tax_receipt_sent, tax_receipt_number, notes, recurring } = req.body;

    const result = await pool.query(
      `INSERT INTO donations (donor_name, donor_email, amount, date, category, payment_method, tax_receipt_sent, tax_receipt_number, notes, recurring)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [donor_name, donor_email, amount, date, category, payment_method, tax_receipt_sent || false, tax_receipt_number, notes, recurring || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating donation:', err);
    res.status(500).json({ error: 'Failed to create donation' });
  }
});

// PUT /api/donations/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { donor_name, donor_email, amount, date, category, payment_method, tax_receipt_sent, tax_receipt_number, notes, recurring } = req.body;

    const result = await pool.query(
      `UPDATE donations SET donor_name=$1, donor_email=$2, amount=$3, date=$4, category=$5,
       payment_method=$6, tax_receipt_sent=$7, tax_receipt_number=$8, notes=$9, recurring=$10
       WHERE id=$11 RETURNING *`,
      [donor_name, donor_email, amount, date, category, payment_method, tax_receipt_sent, tax_receipt_number, notes, recurring, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating donation:', err);
    res.status(500).json({ error: 'Failed to update donation' });
  }
});

// DELETE /api/donations/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM donations WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    res.json({ message: 'Donation deleted successfully' });
  } catch (err) {
    console.error('Error deleting donation:', err);
    res.status(500).json({ error: 'Failed to delete donation' });
  }
});

// POST /api/donations/:id/generate-receipt
router.post('/:id/generate-receipt', async (req, res) => {
  try {
    const { id } = req.params;
    const donation = await pool.query('SELECT * FROM donations WHERE id = $1', [id]);

    if (donation.rows.length === 0) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    const receiptNumber = `TR-${Date.now()}-${id}`;

    const result = await pool.query(
      'UPDATE donations SET tax_receipt_sent = true, tax_receipt_number = $1 WHERE id = $2 RETURNING *',
      [receiptNumber, id]
    );

    res.json({
      message: 'Tax receipt generated successfully',
      receipt_number: receiptNumber,
      donation: result.rows[0],
    });
  } catch (err) {
    console.error('Error generating receipt:', err);
    res.status(500).json({ error: 'Failed to generate tax receipt' });
  }
});

// POST /api/donations/ai-thank-you
router.post('/ai-thank-you', async (req, res) => {
  try {
    const { donor_name, amount, category, date } = req.body;

    const systemPrompt = 'You are a warm, gracious religious organization representative. Write a heartfelt thank you letter for a donation.';
    const prompt = `Write a personalized thank you letter for a donation with the following details:
- Donor name: ${donor_name || 'Valued Donor'}
- Amount: $${amount || 'generous'}
- Category: ${category || 'general'}
- Date: ${date || 'recently'}`;

    const letter = await askAI(prompt, systemPrompt);
    res.json({ letter });
  } catch (err) {
    console.error('Error generating thank you letter:', err);
    res.status(500).json({ error: 'Failed to generate thank you letter' });
  }
});

module.exports = router;
