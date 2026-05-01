const express = require('express');
const { pool } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/customer/:userId', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== Number(req.params.userId))
      return res.status(403).json({ error: 'Forbidden' });
    const { rows } = await pool.query(
      'SELECT * FROM prescriptions WHERE user_id=$1 ORDER BY created_at DESC',
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const {
      user_id, right_sph, right_cyl, right_axis, right_add,
      left_sph, left_cyl, left_axis, left_add,
      pd_distance, pd_near, add_vision_right, add_vision_left,
      vision_type, doctor_name, power_source, notes
    } = req.body;

    const targetId = req.user.role === 'admin' ? user_id : req.user.id;
    const { rows: [{ id }] } = await pool.query(
      `INSERT INTO prescriptions
         (user_id,right_sph,right_cyl,right_axis,right_add,
          left_sph,left_cyl,left_axis,left_add,pd_distance,pd_near,
          add_vision_right,add_vision_left,vision_type,doctor_name,power_source,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id`,
      [targetId, right_sph, right_cyl, right_axis, right_add,
       left_sph, left_cyl, left_axis, left_add,
       pd_distance, pd_near, add_vision_right, add_vision_left,
       vision_type||'Single Vision', doctor_name, power_source||'Shop', notes]
    );
    const { rows: [rx] } = await pool.query('SELECT * FROM prescriptions WHERE id=$1', [id]);
    res.json(rx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const {
      right_sph, right_cyl, right_axis, right_add,
      left_sph, left_cyl, left_axis, left_add,
      pd_distance, pd_near, add_vision_right, add_vision_left,
      vision_type, doctor_name, power_source, notes
    } = req.body;
    await pool.query(
      `UPDATE prescriptions SET
         right_sph=$1,right_cyl=$2,right_axis=$3,right_add=$4,
         left_sph=$5,left_cyl=$6,left_axis=$7,left_add=$8,
         pd_distance=$9,pd_near=$10,add_vision_right=$11,add_vision_left=$12,
         vision_type=$13,doctor_name=$14,power_source=$15,notes=$16
       WHERE id=$17`,
      [right_sph, right_cyl, right_axis, right_add,
       left_sph, left_cyl, left_axis, left_add,
       pd_distance, pd_near, add_vision_right, add_vision_left,
       vision_type, doctor_name, power_source, notes, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM prescriptions WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
