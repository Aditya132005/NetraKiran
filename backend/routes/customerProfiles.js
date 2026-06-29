const express = require('express');
const { pool } = require('../db/database');
const router = express.Router();

// POST /register — create new customer (phone unique check)
router.post('/register', async (req, res) => {
  try {
    const { title, full_name, phone, email, age, gender, address, discount, notes } = req.body;
    if (!full_name || !phone)
      return res.status(400).json({ error: 'Full name and phone number are required' });

    const { rows: existing } = await pool.query(
      'SELECT id FROM customers WHERE phone=$1', [phone]
    );
    if (existing.length)
      return res.status(400).json({ error: 'A customer with this phone number is already registered' });

    const { rows: [{ id }] } = await pool.query(
      `INSERT INTO customers (title, full_name, phone, email, age, gender, address, discount, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [title || null, full_name, phone, email || null, age || null,
       gender || null, address || null, discount || 0, notes || null]
    );
    const { rows: [customer] } = await pool.query('SELECT * FROM customers WHERE id=$1', [id]);
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /search?q= — search by name, phone, email
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) return res.json([]);
    const { rows } = await pool.query(
      `SELECT id, title, full_name, phone, email, created_at
       FROM customers
       WHERE full_name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [`%${q.trim()}%`]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id — full profile with prescriptions and visits
router.get('/:id', async (req, res) => {
  try {
    const { rows: [customer] } = await pool.query(
      'SELECT * FROM customers WHERE id=$1', [req.params.id]
    );
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const { rows: prescriptions } = await pool.query(
      'SELECT * FROM prescriptions WHERE customer_id=$1 ORDER BY created_at DESC',
      [req.params.id]
    );
    const { rows: visits } = await pool.query(
      'SELECT * FROM customer_visits WHERE customer_id=$1 ORDER BY visit_date DESC',
      [req.params.id]
    );

    res.json({ ...customer, prescriptions, visits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/prescriptions — add a new prescription for this customer
router.post('/:id/prescriptions', async (req, res) => {
  try {
    const {
      right_sph, right_cyl, right_axis, right_add,
      left_sph, left_cyl, left_axis, left_add,
      pd_distance, pd_near, add_vision_right, add_vision_left,
      vision_type, doctor_name, power_source, notes
    } = req.body;
    const { rows: [rx] } = await pool.query(
      `INSERT INTO prescriptions
        (customer_id, right_sph, right_cyl, right_axis, right_add,
         left_sph, left_cyl, left_axis, left_add,
         pd_distance, pd_near, add_vision_right, add_vision_left,
         vision_type, doctor_name, power_source, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [req.params.id,
       right_sph||null, right_cyl||null, right_axis||null, right_add||null,
       left_sph||null, left_cyl||null, left_axis||null, left_add||null,
       pd_distance||null, pd_near||null, add_vision_right||null, add_vision_left||null,
       vision_type||'Single Vision', doctor_name||null, power_source||'Shop', notes||null]
    );
    res.json(rx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/visits — record a new visit
router.post('/:id/visits', async (req, res) => {
  try {
    const { notes, discount_given, total_amount, items_purchased, visit_date } = req.body;
    const { rows: [visit] } = await pool.query(
      `INSERT INTO customer_visits (customer_id, visit_date, notes, discount_given, total_amount, items_purchased)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.id, visit_date || new Date(), notes || null, discount_given || null,
       total_amount || null, items_purchased || null]
    );
    res.json(visit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /visits/:visitId — update a visit record
router.put('/visits/:visitId', async (req, res) => {
  try {
    const { visit_date, notes, discount_given, total_amount, items_purchased } = req.body;
    const { rows: [visit] } = await pool.query(
      `UPDATE customer_visits
       SET visit_date=$1, notes=$2, discount_given=$3, total_amount=$4, items_purchased=$5
       WHERE id=$6 RETURNING *`,
      [visit_date || new Date(), notes||null, discount_given||null,
       total_amount||null, items_purchased||null, req.params.visitId]
    );
    if (!visit) return res.status(404).json({ error: 'Visit not found' });
    res.json(visit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id — update customer info
router.put('/:id', async (req, res) => {
  try {
    const { title, full_name, phone, email, age, gender, address, discount, notes } = req.body;
    await pool.query(
      `UPDATE customers
       SET title=$1, full_name=$2, phone=$3, email=$4, age=$5, gender=$6, address=$7, discount=$8, notes=$9
       WHERE id=$10`,
      [title || null, full_name, phone, email || null, age || null,
       gender || null, address || null, discount || 0, notes || null, req.params.id]
    );
    const { rows: [customer] } = await pool.query('SELECT * FROM customers WHERE id=$1', [req.params.id]);
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
