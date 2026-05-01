const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/database');
const { JWT_SECRET, authenticate } = require('../middleware/auth');
const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { title, name, email, phone, address, age, gender, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' });

    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.length) return res.status(400).json({ error: 'Email already registered' });

    const hash = bcrypt.hashSync(password, 10);
    const { rows: [{ id }] } = await pool.query(
      `INSERT INTO users (title,name,email,phone,address,age,gender,password_hash,role)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'customer') RETURNING id`,
      [title||'Mr', name, email, phone||null, address||null, age||null, gender||null, hash]
    );

    const { rows: [user] } = await pool.query(
      'SELECT id,title,name,email,role,discount FROM users WHERE id=$1', [id]
    );
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows: [user] } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password_hash, ...safe } = user;
    res.json({ token, user: safe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows: [user] } = await pool.query(
      'SELECT id,title,name,email,phone,address,age,gender,role,discount,notes,created_at FROM users WHERE id=$1',
      [req.user.id]
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/profile', authenticate, async (req, res) => {
  try {
    const { title, name, phone, address, age, gender } = req.body;
    await pool.query(
      'UPDATE users SET title=$1,name=$2,phone=$3,address=$4,age=$5,gender=$6 WHERE id=$7',
      [title, name, phone, address, age, gender, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
