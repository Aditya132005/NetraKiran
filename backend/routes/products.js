const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');
const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|jpg|png|webp|gif)/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

router.post('/upload-image', authenticate, adminOnly, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url });
});

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
    const { rows: images } = await pool.query(
      'SELECT * FROM product_images WHERE product_id=$1 ORDER BY sort_order, id',
      [req.params.id]
    );
    res.json({ ...product, images });
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

router.post('/:id/images', authenticate, adminOnly, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const { rows: [{ count }] } = await pool.query(
      'SELECT COUNT(*)::int as count FROM product_images WHERE product_id=$1',
      [req.params.id]
    );
    const { rows: [img] } = await pool.query(
      'INSERT INTO product_images (product_id, image_url, sort_order) VALUES ($1,$2,$3) RETURNING *',
      [req.params.id, url, count]
    );
    res.json(img);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/images/:imageId', authenticate, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM product_images WHERE id=$1', [req.params.imageId]);
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
