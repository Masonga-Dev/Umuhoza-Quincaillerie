import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDirectory = path.join(__dirname, '../../uploads/products');
if (!fs.existsSync(uploadDirectory)) fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.-]/g, '');
    cb(null, `${Date.now()}-${safe}`);
  },
});
const upload = multer({ storage });

function determineStatus(qty, min = 5) {
  const q = Number(qty ?? 0), m = Number(min ?? 5);
  if (q <= 0) return 'Out of Stock';
  if (q <= m) return 'Low Stock';
  return 'In Stock';
}

async function deleteFile(imagePath) {
  if (!imagePath) return;
  try {
    const full = path.join(__dirname, '../../', imagePath);
    if (fs.existsSync(full)) await fs.promises.unlink(full);
  } catch {}
}

// ── Legacy single upload (backward compat) ────────────────────────────────────
router.post('/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
  res.status(201).json({ image_path: `uploads/products/${req.file.filename}` });
});

// ── Product list ──────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { q, category, status, page = 1, pageSize = 50 } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);
  const filters = [], params = [];
  if (q) { filters.push('(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (category) { filters.push('p.category_id = ?'); params.push(category); }
  if (status) { filters.push('p.status = ?'); params.push(status); }
  const where = filters.length ? `AND ${filters.join(' AND ')}` : '';
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name,
        (SELECT image_path FROM product_images WHERE product_id=p.id AND is_primary=1 LIMIT 1) AS image_path
       FROM products p LEFT JOIN categories c ON p.category_id=c.id
       WHERE 1=1 ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );
    const [cnt] = await pool.query(`SELECT COUNT(*) AS total FROM products p WHERE 1=1 ${where}`, params);
    res.json({ data: rows, total: cnt[0].total, page: Number(page), pageSize: Number(pageSize) });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch products' }); }
});

// ── Single product with images + variants ─────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id=c.id WHERE p.id=?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Product not found' });
    const product = rows[0];
    const [images] = await pool.query(
      'SELECT * FROM product_images WHERE product_id=? ORDER BY is_primary DESC, created_at ASC',
      [req.params.id]
    );
    const [variants] = await pool.query(
      'SELECT * FROM product_variants WHERE product_id=? ORDER BY created_at ASC',
      [req.params.id]
    );
    product.images = images;
    product.variants = variants;
    product.image_path = images.find(i => i.is_primary)?.image_path || images[0]?.image_path || null;
    res.json(product);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch product' }); }
});

// ── Create product ────────────────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  const { category_id, sku, name, name_rw, name_fr, description, description_rw, description_fr, cost_price, selling_price, stock_quantity, minimum_stock, image_path } = req.body;
  if (!name || !sku || !category_id) return res.status(400).json({ message: 'Name, SKU and category are required' });
  const status = determineStatus(stock_quantity, minimum_stock);
  try {
    const [ex] = await pool.query('SELECT id FROM products WHERE sku=?', [sku]);
    if (ex.length) return res.status(400).json({ message: 'SKU already exists' });
    const [result] = await pool.query(
      'INSERT INTO products (category_id,sku,name,name_rw,name_fr,description,description_rw,description_fr,cost_price,selling_price,stock_quantity,minimum_stock,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())',
      [category_id, sku, name, name_rw || null, name_fr || null, description || '', description_rw || null, description_fr || null, Number(cost_price ?? 0), Number(selling_price ?? 0), Number(stock_quantity ?? 0), Number(minimum_stock ?? 5), status]
    );
    if (image_path) {
      await pool.query('INSERT INTO product_images (product_id,image_path,is_primary,created_at) VALUES (?,?,1,NOW())', [result.insertId, image_path]);
    }
    res.status(201).json({ id: result.insertId, message: 'Product created' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not create product' }); }
});

// ── Update product ────────────────────────────────────────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
  const { category_id, sku, name, name_rw, name_fr, description, description_rw, description_fr, cost_price, selling_price, stock_quantity, minimum_stock } = req.body;
  if (!name || !sku || !category_id) return res.status(400).json({ message: 'Name, SKU and category are required' });
  const status = determineStatus(stock_quantity, minimum_stock);
  try {
    const [ex] = await pool.query('SELECT id FROM products WHERE sku=? AND id<>?', [sku, req.params.id]);
    if (ex.length) return res.status(400).json({ message: 'SKU already exists' });
    await pool.query(
      'UPDATE products SET category_id=?,sku=?,name=?,name_rw=?,name_fr=?,description=?,description_rw=?,description_fr=?,cost_price=?,selling_price=?,stock_quantity=?,minimum_stock=?,status=? WHERE id=?',
      [category_id, sku, name, name_rw || null, name_fr || null, description || '', description_rw || null, description_fr || null, Number(cost_price ?? 0), Number(selling_price ?? 0), Number(stock_quantity ?? 0), Number(minimum_stock ?? 5), status, req.params.id]
    );
    res.json({ message: 'Product updated' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not update product' }); }
});

// ── Delete product ────────────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const [imgs] = await pool.query('SELECT image_path FROM product_images WHERE product_id=?', [req.params.id]);
    for (const r of imgs) await deleteFile(r.image_path);
    await pool.query('DELETE FROM product_images WHERE product_id=?', [req.params.id]);
    await pool.query('DELETE FROM products WHERE id=?', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not delete product' }); }
});

// ── Multi-image management ────────────────────────────────────────────────────
router.post('/:id/images', authMiddleware, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
  const image_path = `uploads/products/${req.file.filename}`;
  const makePrimary = req.body.is_primary === 'true' || req.body.is_primary === '1';
  try {
    const [existing] = await pool.query('SELECT id FROM product_images WHERE product_id=?', [req.params.id]);
    const isFirst = existing.length === 0;
    if (makePrimary || isFirst) {
      await pool.query('UPDATE product_images SET is_primary=0 WHERE product_id=?', [req.params.id]);
    }
    const [r] = await pool.query(
      'INSERT INTO product_images (product_id,image_path,is_primary,created_at) VALUES (?,?,?,NOW())',
      [req.params.id, image_path, (makePrimary || isFirst) ? 1 : 0]
    );
    res.status(201).json({ id: r.insertId, image_path, is_primary: (makePrimary || isFirst) ? 1 : 0 });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not save image' }); }
});

router.put('/:id/images/:imgId/primary', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE product_images SET is_primary=0 WHERE product_id=?', [req.params.id]);
    await pool.query('UPDATE product_images SET is_primary=1 WHERE id=? AND product_id=?', [req.params.imgId, req.params.id]);
    res.json({ message: 'Primary updated' });
  } catch (e) { res.status(500).json({ message: 'Could not set primary' }); }
});

router.delete('/:id/images/:imgId', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT image_path, is_primary FROM product_images WHERE id=? AND product_id=?', [req.params.imgId, req.params.id]);
    if (rows.length) {
      await deleteFile(rows[0].image_path);
      await pool.query('DELETE FROM product_images WHERE id=?', [req.params.imgId]);
      if (rows[0].is_primary) {
        await pool.query('UPDATE product_images SET is_primary=1 WHERE product_id=? LIMIT 1', [req.params.id]);
      }
    }
    res.json({ message: 'Image deleted' });
  } catch (e) { res.status(500).json({ message: 'Could not delete image' }); }
});

// ── Variant CRUD ──────────────────────────────────────────────────────────────
router.get('/:id/variants', authMiddleware, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM product_variants WHERE product_id=? ORDER BY created_at ASC', [req.params.id]);
  res.json(rows);
});

router.post('/:id/variants', authMiddleware, async (req, res) => {
  const { color, size, sku, selling_price, cost_price, stock_quantity, minimum_stock } = req.body;
  const status = determineStatus(stock_quantity, minimum_stock);
  try {
    const [r] = await pool.query(
      'INSERT INTO product_variants (product_id,color,size,sku,selling_price,cost_price,stock_quantity,minimum_stock,status) VALUES (?,?,?,?,?,?,?,?,?)',
      [req.params.id, color || null, size || null, sku || null, Number(selling_price ?? 0), Number(cost_price ?? 0), Number(stock_quantity ?? 0), Number(minimum_stock ?? 5), status]
    );
    res.status(201).json({ id: r.insertId, message: 'Variant created' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not create variant' }); }
});

router.put('/:id/variants/:vid', authMiddleware, async (req, res) => {
  const { color, size, sku, selling_price, cost_price, stock_quantity, minimum_stock } = req.body;
  const status = determineStatus(stock_quantity, minimum_stock);
  try {
    await pool.query(
      'UPDATE product_variants SET color=?,size=?,sku=?,selling_price=?,cost_price=?,stock_quantity=?,minimum_stock=?,status=? WHERE id=? AND product_id=?',
      [color || null, size || null, sku || null, Number(selling_price ?? 0), Number(cost_price ?? 0), Number(stock_quantity ?? 0), Number(minimum_stock ?? 5), status, req.params.vid, req.params.id]
    );
    res.json({ message: 'Variant updated' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not update variant' }); }
});

router.delete('/:id/variants/:vid', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM product_variants WHERE id=? AND product_id=?', [req.params.vid, req.params.id]);
    res.json({ message: 'Variant deleted' });
  } catch (e) { res.status(500).json({ message: 'Could not delete variant' }); }
});

export default router;
