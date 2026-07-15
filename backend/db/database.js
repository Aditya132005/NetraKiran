const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const isLocal = !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes('localhost') ||
  process.env.DATABASE_URL.includes('127.0.0.1');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      title TEXT DEFAULT 'Mr',
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      address TEXT,
      age INTEGER,
      gender TEXT,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      discount NUMERIC(5,2) DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      right_sph TEXT, right_cyl TEXT, right_axis TEXT, right_add TEXT,
      left_sph TEXT, left_cyl TEXT, left_axis TEXT, left_add TEXT,
      pd_distance TEXT, pd_near TEXT,
      add_vision_right TEXT, add_vision_left TEXT,
      vision_type TEXT DEFAULT 'Single Vision',
      doctor_name TEXT,
      power_source TEXT DEFAULT 'Shop',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      brand TEXT,
      frame_type TEXT,
      lens_type TEXT,
      price NUMERIC(10,2) NOT NULL,
      original_price NUMERIC(10,2),
      image_url TEXT,
      description TEXT,
      features TEXT,
      stock INTEGER DEFAULT 100,
      trending SMALLINT DEFAULT 0,
      gender TEXT DEFAULT 'unisex',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT DEFAULT 'pending',
      subtotal NUMERIC(10,2),
      discount_amount NUMERIC(10,2) DEFAULT 0,
      total_amount NUMERIC(10,2) NOT NULL,
      vision_type TEXT,
      prescription_id INTEGER,
      lens_type TEXT,
      special_instructions TEXT,
      estimated_delivery TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      product_image TEXT,
      quantity INTEGER DEFAULT 1,
      price NUMERIC(10,2) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_images (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      title VARCHAR(20),
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL UNIQUE,
      email VARCHAR(255) UNIQUE,
      age INTEGER,
      gender VARCHAR(20),
      address TEXT,
      discount NUMERIC(5,2) DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_visits (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      visit_date TIMESTAMP DEFAULT NOW(),
      notes TEXT,
      discount_given NUMERIC(5,2),
      total_amount NUMERIC(10,2),
      items_purchased TEXT
    )
  `);

  await pool.query(`
    ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL
  `);

  await pool.query(`
    ALTER TABLE prescriptions ALTER COLUMN user_id DROP NOT NULL
  `);

  await pool.query(`ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS prescription_type VARCHAR(20) DEFAULT 'lens'`);
  await pool.query(`ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS contact_lens_type VARCHAR(100)`);
  await pool.query(`ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS disposable_schedule VARCHAR(50)`);
  await pool.query(`ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS pack_quantity VARCHAR(20)`);
  await pool.query(`ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS num_lenses INTEGER`);

  // Challan History: link prescriptions to a specific visit + DV/NV row, and
  // give visits a frame/lens/advance/balance breakdown
  await pool.query(`ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS frame_name TEXT`);
  await pool.query(`ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS frame_mrp NUMERIC(10,2)`);
  await pool.query(`ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS frame_discount NUMERIC(10,2)`);
  await pool.query(`ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS lens_name TEXT`);
  await pool.query(`ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS lens_mrp NUMERIC(10,2)`);
  await pool.query(`ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS lens_discount NUMERIC(10,2)`);
  await pool.query(`ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS advance NUMERIC(10,2)`);
  await pool.query(`ALTER TABLE customer_visits ADD COLUMN IF NOT EXISTS balance NUMERIC(10,2)`);
  await pool.query(`ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS visit_id INTEGER REFERENCES customer_visits(id) ON DELETE CASCADE`);
  await pool.query(`ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS vision_row VARCHAR(10)`);

  // Seed admin
  const { rows: adminRows } = await pool.query("SELECT id FROM users WHERE role='admin' LIMIT 1");
  if (!adminRows.length) {
    await pool.query(
      `INSERT INTO users (title,name,email,phone,address,role,password_hash) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      ['Mr','Admin','admin@netrakiran.com','07011295507',
       'LGF/3, Retailx Shopping Complex, Indirapuram, Ghaziabad','admin',
       bcrypt.hashSync('Admin@123', 10)]
    );
    console.log('Admin created → admin@netrakiran.com / Admin@123');
  }

  // Seed products
  const { rows: [{ c }] } = await pool.query('SELECT COUNT(*)::int as c FROM products');
  if (c === 0) {
    const products = [
      { name:'Ray-Ban Classic Aviator', category:'frame', brand:'Ray-Ban', frame_type:'Full Rim', lens_type:null,
        price:3500, original_price:4500, trending:1, gender:'unisex', stock:15,
        image_url:'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80',
        description:'Iconic aviator style with premium lightweight metal frame.',
        features:'UV400,Anti-Glare,Lightweight,Adjustable Nose Pads' },
      { name:'Ray-Ban Wayfarer Acetate', category:'frame', brand:'Ray-Ban', frame_type:'Full Rim', lens_type:null,
        price:4200, original_price:5200, trending:1, gender:'unisex', stock:12,
        image_url:'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=500&q=80',
        description:'Classic wayfarer design in durable premium acetate.',
        features:'UV400,Anti-Glare,Durable Acetate,Classic Style' },
      { name:'Titan Rimless Elegance', category:'frame', brand:'Titan', frame_type:'Rimless', lens_type:null,
        price:2800, original_price:3500, trending:0, gender:'unisex', stock:20,
        image_url:'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=500&q=80',
        description:'Ultra-lightweight rimless frame for a clean, minimal look.',
        features:'Lightweight,Adjustable,Premium Metal,Comfortable' },
      { name:'Vogue Butterfly Half-Rim', category:'frame', brand:'Vogue', frame_type:'Half Rim', lens_type:null,
        price:2200, original_price:2800, trending:1, gender:'female', stock:18,
        image_url:'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=500&q=80',
        description:'Elegant butterfly-shaped frame for a feminine, stylish look.',
        features:'Lightweight,Anti-Scratch,Fashionable,Spring Hinges' },
      { name:'Oakley Sport Pro', category:'frame', brand:'Oakley', frame_type:'Full Rim', lens_type:null,
        price:5500, original_price:7000, trending:1, gender:'male', stock:10,
        image_url:'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=500&q=80',
        description:'High-performance sport frame with impact resistance.',
        features:'Impact Resistant,O-Matter Frame,Adjustable,Sport Fit' },
      { name:'Fastrack Hexagonal Trendy', category:'frame', brand:'Fastrack', frame_type:'Full Rim', lens_type:null,
        price:1800, original_price:2200, trending:1, gender:'unisex', stock:25,
        image_url:'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=500&q=80',
        description:'Modern hexagonal frames for the fashion-forward youth.',
        features:'Lightweight,Anti-Scratch,Trendy Design,Flexible Hinges' },
      { name:'John Jacobs Classic Rectangle', category:'frame', brand:'John Jacobs', frame_type:'Full Rim', lens_type:null,
        price:3200, original_price:4000, trending:0, gender:'unisex', stock:15,
        image_url:'https://images.unsplash.com/photo-1483181957632-8bda974cbc91?w=500&q=80',
        description:'Timeless rectangular frames crafted in premium acetate.',
        features:'Premium Acetate,UV Protection,Anti-Glare,Classic' },
      { name:'Lenskart Air Blue Shield', category:'frame', brand:'Lenskart', frame_type:'Full Rim', lens_type:null,
        price:1500, original_price:1999, trending:0, gender:'unisex', stock:30,
        image_url:'https://images.unsplash.com/photo-1547721064-da6cfb341d50?w=500&q=80',
        description:'Modern frame with built-in blue light blocking.',
        features:'Blue Light Block,Anti-Glare,Durable,Lightweight' },
      { name:'Vincent Chase Round Metal', category:'frame', brand:'Vincent Chase', frame_type:'Full Rim', lens_type:null,
        price:1999, original_price:2500, trending:1, gender:'unisex', stock:22,
        image_url:'https://images.unsplash.com/photo-1561992792-b2f54a30a1d7?w=500&q=80',
        description:'Trendy round metal frames inspired by vintage aesthetics.',
        features:'Lightweight Metal,UV Protection,Retro Style,Spring Hinges' },
      { name:'Ray-Ban Polarized Aviator', category:'sunglasses', brand:'Ray-Ban', frame_type:'Full Rim', lens_type:null,
        price:6500, original_price:8000, trending:1, gender:'unisex', stock:12,
        image_url:'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&q=80',
        description:'Premium polarized aviator sunglasses — the original icon.',
        features:'Polarized,UV400,Crystal Lens,Metal Frame' },
      { name:'Oakley Holbrook Sport', category:'sunglasses', brand:'Oakley', frame_type:'Full Rim', lens_type:null,
        price:7500, original_price:9000, trending:1, gender:'male', stock:8,
        image_url:'https://images.unsplash.com/photo-1473496169904-658ba7574b0d?w=500&q=80',
        description:'Sport-performance sunglasses with Prizm lens technology.',
        features:'Prizm Lens,UV400,Impact Resistant,O-Matter Frame' },
      { name:'Fastrack UV Wayfarer', category:'sunglasses', brand:'Fastrack', frame_type:'Full Rim', lens_type:null,
        price:2200, original_price:2800, trending:0, gender:'unisex', stock:20,
        image_url:'https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=500&q=80',
        description:'Stylish wayfarer sunglasses with 100% UV protection.',
        features:'UV400,Anti-Glare,Trendy,Durable' },
      { name:'Vogue Oversized Cat-Eye', category:'sunglasses', brand:'Vogue', frame_type:'Full Rim', lens_type:null,
        price:3800, original_price:4500, trending:1, gender:'female', stock:15,
        image_url:'https://images.unsplash.com/photo-1577803645773-f96470509666?w=500&q=80',
        description:'Glamorous oversized cat-eye sunglasses for bold style.',
        features:'UV400,Gradient Lens,Oversized,Acetate Frame' },
      { name:'Police Retro Square', category:'sunglasses', brand:'Police', frame_type:'Full Rim', lens_type:null,
        price:4200, original_price:5500, trending:1, gender:'male', stock:10,
        image_url:'https://images.unsplash.com/photo-1583394293254-93e2f5c5b2d1?w=500&q=80',
        description:'Bold retro square sunglasses with metal frame.',
        features:'UV400,Polarized,Metal Frame,Retro Style' },
      { name:'Single Vision CR39', category:'lens', brand:'Zeiss', frame_type:null, lens_type:'Single Vision',
        price:800, original_price:1000, trending:0, gender:'unisex', stock:200,
        image_url:'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=500&q=80',
        description:'Standard single vision lens for clear distance or near vision.',
        features:'Anti-Reflection,UV Protection,Hard Coat,Clear Vision' },
      { name:'Progressive Premium', category:'lens', brand:'Essilor', frame_type:null, lens_type:'Progressive',
        price:3500, original_price:4500, trending:1, gender:'unisex', stock:200,
        image_url:'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=500&q=80',
        description:'Premium progressive lens for all-distance vision — no line.',
        features:'Progressive,Anti-Reflection,UV Protection,Thin & Light' },
      { name:'Bifocal D-Seg', category:'lens', brand:'Hoya', frame_type:null, lens_type:'Bifocal',
        price:1500, original_price:2000, trending:0, gender:'unisex', stock:200,
        image_url:'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&q=80',
        description:'Traditional bifocal with clear segments for near and distance.',
        features:'Bifocal,Anti-Scratch,UV Protection,Hard Coat' },
      { name:'Photochromic Transition', category:'lens', brand:'Transitions', frame_type:null, lens_type:'Photochromic',
        price:2800, original_price:3500, trending:1, gender:'unisex', stock:200,
        image_url:'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=500&q=80',
        description:'Auto-darkens in sunlight, crystal clear indoors.',
        features:'Photochromic,UV400,Anti-Reflection,All-Day Comfort' },
      { name:'Blue Light Cut Lens', category:'lens', brand:'Zeiss', frame_type:null, lens_type:'Blue Cut',
        price:1800, original_price:2200, trending:1, gender:'unisex', stock:200,
        image_url:'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=500&q=80',
        description:'Blocks harmful blue light from screens — ideal for heavy device users.',
        features:'Blue Light Filter,Anti-Reflection,UV Protection,Clear' },
      { name:'Tinted Sun Lens', category:'lens', brand:'Hoya', frame_type:null, lens_type:'Tinted',
        price:1200, original_price:1600, trending:0, gender:'unisex', stock:200,
        image_url:'https://images.unsplash.com/photo-1476224203421-9ac39bcb3b47?w=500&q=80',
        description:'Stylish tinted lenses for outdoor UV protection.',
        features:'Tinted,UV Protection,Anti-Glare,Various Shades' },
    ];
    for (const p of products) {
      await pool.query(
        `INSERT INTO products (name,category,brand,frame_type,lens_type,price,original_price,image_url,description,features,stock,trending,gender)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [p.name,p.category,p.brand,p.frame_type,p.lens_type,p.price,p.original_price,
         p.image_url,p.description,p.features,p.stock,p.trending,p.gender]
      );
    }
    console.log(`${products.length} products seeded`);
  }

  console.log('Database ready');
}

module.exports = { pool, initDB };
