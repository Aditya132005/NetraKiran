const express = require('express');
const { pool } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { search } = req.query;
    let q = 'SELECT id,title,full_name,phone,email,age,gender,address,discount,notes,created_at FROM customers';
    const params = [];
    if (search) {
      q += ' WHERE (full_name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 OR address ILIKE $1)';
      params.push(`%${search}%`);
    }
    q += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const { rows: [c] } = await pool.query(
      'SELECT id,title,full_name,phone,email,age,gender,address,discount,notes,created_at FROM customers WHERE id=$1',
      [req.params.id]
    );
    if (!c) return res.status(404).json({ error: 'Customer not found' });
    res.json(c);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { title, full_name, phone, email, age, gender, address, discount, notes } = req.body;
    if (!full_name || !phone) return res.status(400).json({ error: 'Full name and phone are required' });
    const { rows: existing } = await pool.query('SELECT id FROM customers WHERE phone=$1', [phone]);
    if (existing.length) return res.status(400).json({ error: 'Phone number already registered' });
    const { rows: [{ id }] } = await pool.query(
      `INSERT INTO customers (title, full_name, phone, email, age, gender, address, discount, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [title||null, full_name, phone, email||null, age||null, gender||null, address||null, discount||0, notes||null]
    );
    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const { title, full_name, phone, email, age, gender, address, discount, notes } = req.body;
    await pool.query(
      `UPDATE customers SET title=$1, full_name=$2, phone=$3, email=$4, age=$5, gender=$6, address=$7, discount=$8, notes=$9 WHERE id=$10`,
      [title||null, full_name, phone, email||null, age||null, gender||null, address||null, discount||0, notes||null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
