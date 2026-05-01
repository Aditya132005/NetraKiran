const express = require('express');
const { pool } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category, trending, search } = req.query;
    let q = 'SELECT * FROM products WHERE stock > 0';
    const p = [];
    let n = 0;
    if (category && category !== 'all') { q += ` AND category=$${++n}`; p.push(category); }
    if (trending === 'true') { q += ' AND trending=1'; }
    if (search) { q += ` AND (name ILIKE $${++n} OR brand ILIKE $${n} OR description ILIKE $${n})`; p.push(`%${search}%`); }
    q += ' ORDER BY trending DESC, created_at DESC';
    const { rows } = await pool.query(q, p);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows: [product] } = await pool.query('SELECT * FROM products WHERE id=$1', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { name,category,brand,frame_type,lens_type,price,original_price,image_url,description,features,stock,trending,gender } = req.body;
    const { rows: [{ id }] } = await pool.query(
      `INSERT INTO products (name,category,brand,frame_type,lens_type,price,original_price,image_url,description,features,stock,trending,gender)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [name,category,brand||null,frame_type||null,lens_type||null,price,original_price||null,
       image_url||null,description||null,features||null,stock||100,trending?1:0,gender||'unisex']
    );
    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const { name,category,brand,frame_type,lens_type,price,original_price,image_url,description,features,stock,trending,gender } = req.body;
    await pool.query(
      `UPDATE products SET name=$1,category=$2,brand=$3,frame_type=$4,lens_type=$5,price=$6,
       original_price=$7,image_url=$8,description=$9,features=$10,stock=$11,trending=$12,gender=$13
       WHERE id=$14`,
      [name,category,brand,frame_type,lens_type,price,original_price,image_url,description,features,stock,trending?1:0,gender,req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
