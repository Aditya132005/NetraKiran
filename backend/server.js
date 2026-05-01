const express = require('express');
const cors = require('cors');
const { initDB } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/customers',    require('./routes/customers'));
app.use('/api/prescriptions',require('./routes/prescriptions'));
app.use('/api/products',     require('./routes/products'));
app.use('/api/orders',       require('./routes/orders'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/dashboard',    require('./routes/dashboard'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', shop: 'Netra Kiran Optics' }));

initDB()
  .then(() => app.listen(PORT, () => console.log(`\n✨ Netra Kiran Optics API → http://localhost:${PORT}\n`)))
  .catch(err => { console.error('DB init failed:', err.message); process.exit(1); });
