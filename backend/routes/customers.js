const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { search } = req.query;
    let q = "SELECT id,title,name,email,phone,address,age,gender,role,discount,notes,created_at FROM users WHERE role='customer'";
    const params = [];
    if (search) {
      q += ' AND (name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 OR address ILIKE $1)';
      params.push(`%${search}%`);
    }
    q += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== Number(req.params.id))
      return res.status(403).json({ error: 'Forbidden' });
    const { rows: [c] } = await pool.query(
      "SELECT id,title,name,email,phone,address,age,gender,discount,notes,created_at FROM users WHERE id=$1 AND role='customer'",
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
    const { title, name, email, phone, address, age, gender, discount, notes } = req.body;
    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.length) return res.status(400).json({ error: 'Email already registered' });

    const { rows: [{ id }] } = await pool.query(
      `INSERT INTO users (title,name,email,phone,address,age,gender,password_hash,role,discount,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'customer',$9,$10) RETURNING id`,
      [title||'Mr', name, email, phone||null, address||null, age||null, gender||null,
       bcrypt.hashSync('Netra@123', 10), discount||0, notes||null]
    );
    res.json({ id, tempPassword: 'Netra@123' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const { title, name, email, phone, address, age, gender, discount, notes } = req.body;
    await pool.query(
      "UPDATE users SET title=$1,name=$2,email=$3,phone=$4,address=$5,age=$6,gender=$7,discount=$8,notes=$9 WHERE id=$10 AND role='customer'",
      [title, name, email, phone, address, age, gender, discount||0, notes, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id=$1 AND role='customer'", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
