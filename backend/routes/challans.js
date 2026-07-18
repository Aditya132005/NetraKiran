const express = require('express');
const { pool } = require('../db/database');
const router = express.Router();

const FIELDS = [
  'date_of_booking', 'date_of_delivery',
  'right_sph', 'right_cyl', 'right_axis', 'right_vision', 'right_add',
  'left_sph', 'left_cyl', 'left_axis', 'left_vision', 'left_add',
  'frame_name', 'frame_mrp', 'frame_discount_pct',
  'lens_name', 'lens_mrp', 'lens_discount_pct', 'lens_type',
  'advance', 'advance_payment_mode', 'notes'
];

function pick(body) {
  const out = {};
  for (const f of FIELDS) out[f] = body[f] !== undefined && body[f] !== '' ? body[f] : null;
  return out;
}

// GET /customer/:customerId — list all challans for a customer, most recent first
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM challans WHERE customer_id=$1 ORDER BY created_at DESC',
      [req.params.customerId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / — create new challan
router.post('/', async (req, res) => {
  try {
    const { customer_id } = req.body;
    if (!customer_id) return res.status(400).json({ error: 'customer_id is required' });
    const data = pick(req.body);

    const { rows: [{ next_job_no }] } = await pool.query(
      'SELECT COALESCE(MAX(job_no), 0) + 1 AS next_job_no FROM challans'
    );

    const columns = ['customer_id', 'job_no', ...FIELDS];
    const values = [customer_id, next_job_no, ...FIELDS.map(f => data[f])];
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(',');

    const { rows: [challan] } = await pool.query(
      `INSERT INTO challans (${columns.join(',')}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    res.json(challan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id — update challan
router.put('/:id', async (req, res) => {
  try {
    const data = pick(req.body);
    const setClause = FIELDS.map((f, i) => `${f}=$${i + 1}`).join(',');
    const values = FIELDS.map(f => data[f]);

    const { rows: [challan] } = await pool.query(
      `UPDATE challans SET ${setClause} WHERE id=$${FIELDS.length + 1} RETURNING *`,
      [...values, req.params.id]
    );
    if (!challan) return res.status(404).json({ error: 'Challan not found' });
    res.json(challan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM challans WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Challan not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
