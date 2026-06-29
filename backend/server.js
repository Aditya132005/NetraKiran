require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const allowed =
      origin.includes('localhost') ||
      origin.includes('vercel.app') ||
      origin === process.env.FRONTEND_URL;
    if (allowed) cb(null, true);
    else { console.warn('CORS blocked:', origin); cb(new Error('Not allowed by CORS')); }
  },
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',              require('./routes/auth'));
app.use('/api/customers',         require('./routes/customers'));
app.use('/api/customer-profiles', require('./routes/customerProfiles'));
app.use('/api/prescriptions',     require('./routes/prescriptions'));
app.use('/api/products',          require('./routes/products'));
app.use('/api/orders',            require('./routes/orders'));
app.use('/api/appointments',      require('./routes/appointments'));
app.use('/api/dashboard',         require('./routes/dashboard'));
app.use('/api/admins',            require('./routes/admins'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', shop: 'Netra Kiran Optics' }));

initDB()
  .then(() => app.listen(PORT, () => console.log(`\n✨ Netra Kiran Optics API → http://localhost:${PORT}\n`)))
  .catch(err => { console.error('DB init failed:', err.message); process.exit(1); });
