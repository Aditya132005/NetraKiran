const express = require('express');
const { pool } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id,title,name,email,phone,role,created_at FROM users ORDER BY role DESC, created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/role', authenticate, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'customer'].includes(role))
      return res.status(400).json({ error: 'Invalid role' });
    if (Number(req.params.id) === req.user.id)
      return res.status(400).json({ error: 'Cannot change your own role' });
    await pool.query('UPDATE users SET role=$1 WHERE id=$2', [role, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
