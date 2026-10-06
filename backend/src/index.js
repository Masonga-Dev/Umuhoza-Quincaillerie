import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import salesRoutes from './routes/sales.js';
import reportRoutes from './routes/reports.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import supplierRoutes from './routes/suppliers.js';
import purchaseRoutes from './routes/purchases.js';
import subcategoryRoutes from './routes/subcategories.js';
import orderRoutes from './routes/orders.js';
import customerRoutes from './routes/customers.js';
import paymentRoutes from './routes/payments.js';
import notificationRoutes from './routes/notifications.js';
import { securityHeaders, rateLimit, corsOptions } from './middleware/security.js';
import { initDb } from './config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Serialize BigInt values from mysql2 v3 as numbers in all JSON responses
app.set('json replacer', (_, v) => (typeof v === 'bigint' ? Number(v) : v));

// ── Security (spec §28) ───────────────────────────────────────────────────────
app.use(securityHeaders);
app.use(cors(corsOptions()));
// Global budget: generous so the SPA (which fans out requests) stays usable.
app.use(rateLimit({ windowMs: 60_000, max: 600, prefix: 'global' }));
// Capture the raw body for webhook signature verification (payments.js)
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Tighter budgets for credential + checkout surfaces (brute-force / abuse)
app.use('/api/auth', rateLimit({ windowMs: 60_000, max: 20, prefix: 'auth' }));
app.use('/api/orders', rateLimit({ windowMs: 60_000, max: 60, prefix: 'orders' }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/subcategories', subcategoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Umuhoza Quincaillerie API is running.' });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });
