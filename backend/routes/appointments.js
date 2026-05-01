const express = require('express');
const { pool } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const { rows } = await pool.query('SELECT * FROM appointments ORDER BY date DESC, time DESC');
      res.json(rows);
    } else {
      const { rows } = await pool.query(
        'SELECT * FROM appointments WHERE user_id=$1 ORDER BY date DESC', [req.user.id]
      );
      res.json(rows);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { user_id, name, phone, email, date, time, notes } = req.body;
    if (!name || !phone || !date || !time)
      return res.status(400).json({ error: 'Name, phone, date and time are required' });
    const { rows: [{ id }] } = await pool.query(
      `INSERT INTO appointments (user_id,name,phone,email,date,time,notes,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending') RETURNING id`,
      [user_id||null, name, phone, email||null, date, time, notes||null]
    );
    res.json({ id, message: 'Appointment booked!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const { status, notes } = req.body;
    await pool.query('UPDATE appointments SET status=$1,notes=$2 WHERE id=$3', [status, notes, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM appointments WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
