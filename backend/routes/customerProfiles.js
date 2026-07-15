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
      vision_type, doctor_name, power_source, notes,
      prescription_type, contact_lens_type, disposable_schedule, pack_quantity, num_lenses
    } = req.body;
    const { rows: [rx] } = await pool.query(
      `INSERT INTO prescriptions
        (customer_id, right_sph, right_cyl, right_axis, right_add,
         left_sph, left_cyl, left_axis, left_add,
         pd_distance, pd_near, add_vision_right, add_vision_left,
         vision_type, doctor_name, power_source, notes,
         prescription_type, contact_lens_type, disposable_schedule, pack_quantity, num_lenses)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING *`,
      [req.params.id,
       right_sph||null, right_cyl||null, right_axis||null, right_add||null,
       left_sph||null, left_cyl||null, left_axis||null, left_add||null,
       pd_distance||null, pd_near||null, add_vision_right||null, add_vision_left||null,
       vision_type||'Single Vision', doctor_name||null, power_source||'Shop', notes||null,
       prescription_type||'lens', contact_lens_type||null, disposable_schedule||null, pack_quantity||null, num_lenses||null]
    );
    res.json(rx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function calcChallanTotals({ frame_mrp, frame_discount, lens_mrp, lens_discount, advance }) {
  const total = (Number(frame_mrp) || 0) + (Number(lens_mrp) || 0)
    - (Number(frame_discount) || 0) - (Number(lens_discount) || 0);
  const balance = total - (Number(advance) || 0);
  return { total_amount: total, balance };
}

// Replace the DV/NV prescription rows linked to a visit
async function saveVisitPrescriptions(customerId, visitId, visionType, dv, nv) {
  await pool.query('DELETE FROM prescriptions WHERE visit_id=$1', [visitId]);
  for (const [rowLabel, row] of [['DV', dv], ['NV', nv]]) {
    if (!row) continue;
    const hasData = ['right_sph','right_cyl','right_axis','left_sph','left_cyl','left_axis']
      .some(f => row[f] !== undefined && row[f] !== null && row[f] !== '');
    if (!hasData) continue;
    await pool.query(
      `INSERT INTO prescriptions
        (customer_id, visit_id, vision_row, right_sph, right_cyl, right_axis,
         left_sph, left_cyl, left_axis, vision_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [customerId, visitId, rowLabel,
       row.right_sph || null, row.right_cyl || null, row.right_axis || null,
       row.left_sph || null, row.left_cyl || null, row.left_axis || null,
       visionType || 'Single Vision']
    );
  }
}

// POST /:id/visits — record a new challan (visit + prescription + frame/lens/payment)
router.post('/:id/visits', async (req, res) => {
  try {
    const {
      visit_date, notes, vision_type, dv, nv,
      frame_name, frame_mrp, frame_discount,
      lens_name, lens_mrp, lens_discount, advance
    } = req.body;
    const { total_amount, balance } = calcChallanTotals(req.body);

    const { rows: [visit] } = await pool.query(
      `INSERT INTO customer_visits
        (customer_id, visit_date, notes, total_amount,
         frame_name, frame_mrp, frame_discount, lens_name, lens_mrp, lens_discount, advance, balance)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [req.params.id, visit_date || new Date(), notes || null, total_amount,
       frame_name || null, frame_mrp || null, frame_discount || null,
       lens_name || null, lens_mrp || null, lens_discount || null,
       advance || null, balance]
    );

    await saveVisitPrescriptions(req.params.id, visit.id, vision_type, dv, nv);
    const { rows: prescriptions } = await pool.query(
      'SELECT * FROM prescriptions WHERE visit_id=$1 ORDER BY vision_row', [visit.id]
    );
    res.json({ ...visit, prescriptions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /visits/:visitId — update a challan (visit + prescription + frame/lens/payment)
router.put('/visits/:visitId', async (req, res) => {
  try {
    const {
      visit_date, notes, vision_type, dv, nv,
      frame_name, frame_mrp, frame_discount,
      lens_name, lens_mrp, lens_discount, advance
    } = req.body;
    const { total_amount, balance } = calcChallanTotals(req.body);

    const { rows: [visit] } = await pool.query(
      `UPDATE customer_visits
       SET visit_date=$1, notes=$2, total_amount=$3,
           frame_name=$4, frame_mrp=$5, frame_discount=$6,
           lens_name=$7, lens_mrp=$8, lens_discount=$9, advance=$10, balance=$11
       WHERE id=$12 RETURNING *`,
      [visit_date || new Date(), notes || null, total_amount,
       frame_name || null, frame_mrp || null, frame_discount || null,
       lens_name || null, lens_mrp || null, lens_discount || null,
       advance || null, balance, req.params.visitId]
    );
    if (!visit) return res.status(404).json({ error: 'Visit not found' });

    await saveVisitPrescriptions(visit.customer_id, visit.id, vision_type, dv, nv);
    const { rows: prescriptions } = await pool.query(
      'SELECT * FROM prescriptions WHERE visit_id=$1 ORDER BY vision_row', [visit.id]
    );
    res.json({ ...visit, prescriptions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /visits/:visitId
router.delete('/visits/:visitId', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM customer_visits WHERE id=$1 RETURNING id', [req.params.visitId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Visit not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /prescriptions/:prescriptionId — update a prescription
router.put('/prescriptions/:prescriptionId', async (req, res) => {
  try {
    const {
      right_sph, right_cyl, right_axis, right_add,
      left_sph, left_cyl, left_axis, left_add,
      pd_distance, pd_near, add_vision_right, add_vision_left,
      vision_type, doctor_name, power_source, notes,
      prescription_type, contact_lens_type, disposable_schedule, pack_quantity, num_lenses
    } = req.body;
    const { rows: [rx] } = await pool.query(
      `UPDATE prescriptions
       SET right_sph=$1, right_cyl=$2, right_axis=$3, right_add=$4,
           left_sph=$5, left_cyl=$6, left_axis=$7, left_add=$8,
           pd_distance=$9, pd_near=$10, add_vision_right=$11, add_vision_left=$12,
           vision_type=$13, doctor_name=$14, power_source=$15, notes=$16,
           prescription_type=$17, contact_lens_type=$18, disposable_schedule=$19,
           pack_quantity=$20, num_lenses=$21
       WHERE id=$22 RETURNING *`,
      [right_sph||null, right_cyl||null, right_axis||null, right_add||null,
       left_sph||null, left_cyl||null, left_axis||null, left_add||null,
       pd_distance||null, pd_near||null, add_vision_right||null, add_vision_left||null,
       vision_type||'Single Vision', doctor_name||null, power_source||'Shop', notes||null,
       prescription_type||'lens', contact_lens_type||null, disposable_schedule||null,
       pack_quantity||null, num_lenses||null,
       req.params.prescriptionId]
    );
    if (!rx) return res.status(404).json({ error: 'Prescription not found' });
    res.json(rx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /prescriptions/:prescriptionId
router.delete('/prescriptions/:prescriptionId', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM prescriptions WHERE id=$1 RETURNING id', [req.params.prescriptionId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Prescription not found' });
    res.json({ ok: true });
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
