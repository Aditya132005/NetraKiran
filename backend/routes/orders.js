const express = require('express');
const { pool } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    let rows;
    if (req.user.role === 'admin') {
      ({ rows } = await pool.query(
        `SELECT o.*, u.name as customer_name, u.phone as customer_phone, u.email as customer_email
         FROM orders o JOIN users u ON o.user_id=u.id ORDER BY o.created_at DESC`
      ));
    } else {
      ({ rows } = await pool.query(
        'SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]
      ));
    }
    const result = await Promise.all(rows.map(async o => {
      const { rows: items } = await pool.query('SELECT * FROM order_items WHERE order_id=$1', [o.id]);
      return { ...o, items };
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows: [o] } = await pool.query(
      `SELECT o.*,u.name as customer_name,u.email as customer_email,u.phone as customer_phone
       FROM orders o JOIN users u ON o.user_id=u.id WHERE o.id=$1`,
      [req.params.id]
    );
    if (!o) return res.status(404).json({ error: 'Order not found' });
    if (req.user.role !== 'admin' && req.user.id !== o.user_id)
      return res.status(403).json({ error: 'Forbidden' });
    const { rows: items } = await pool.query('SELECT * FROM order_items WHERE order_id=$1', [o.id]);
    res.json({ ...o, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  const { items, subtotal, discount_amount, total_amount, vision_type, prescription_id, lens_type, special_instructions } = req.body;
  if (!items?.length) return res.status(400).json({ error: 'No items in order' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [{ id: orderId }] } = await client.query(
      `INSERT INTO orders (user_id,status,subtotal,discount_amount,total_amount,vision_type,prescription_id,lens_type,special_instructions)
       VALUES ($1,'pending',$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [req.user.id, subtotal, discount_amount||0, total_amount,
       vision_type||null, prescription_id||null, lens_type||null, special_instructions||null]
    );
    for (const i of items) {
      await client.query(
        'INSERT INTO order_items (order_id,product_id,product_name,product_image,quantity,price) VALUES ($1,$2,$3,$4,$5,$6)',
        [orderId, i.product_id||null, i.product_name, i.product_image||null, i.quantity||1, i.price]
      );
    }
    await client.query('COMMIT');
    res.json({ id: orderId, message: 'Order placed successfully!' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put('/:id/status', authenticate, adminOnly, async (req, res) => {
  try {
    const { status, estimated_delivery } = req.body;
    await pool.query(
      'UPDATE orders SET status=$1,estimated_delivery=$2,updated_at=NOW() WHERE id=$3',
      [status, estimated_delivery||null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
