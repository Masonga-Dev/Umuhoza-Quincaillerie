import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/homepage', async (req, res) => {
  try {
    const [sections] = await pool.query('SELECT * FROM homepage_content WHERE is_active=1 ORDER BY display_order ASC');
    const [featured] = await pool.query(
      `SELECT p.*, c.name AS category_name,
        (SELECT image_path FROM product_images WHERE product_id=p.id AND is_primary=1 LIMIT 1) AS image_path
       FROM products p LEFT JOIN categories c ON p.category_id=c.id
       WHERE p.status<>'Out of Stock' ORDER BY p.created_at DESC LIMIT 8`
    );
    const [announcements] = await pool.query("SELECT * FROM announcements WHERE status='Published' ORDER BY created_at DESC");
    const [gallery] = await pool.query('SELECT * FROM gallery ORDER BY created_at DESC LIMIT 8');
    const [settingsRows] = await pool.query('SELECT setting_key,setting_value FROM settings');
    const [productCount] = await pool.query('SELECT COUNT(*) AS total FROM products');
    const [categoryCount] = await pool.query('SELECT COUNT(*) AS total FROM categories');
    const [customerCount] = await pool.query('SELECT COUNT(DISTINCT sold_by) AS total FROM sales WHERE sold_by IS NOT NULL');
    const [categories] = await pool.query(
      `SELECT c.*, COUNT(p.id) AS product_count
       FROM categories c LEFT JOIN products p ON p.category_id=c.id
       GROUP BY c.id ORDER BY c.name ASC`
    );

    const settings = {};
    settingsRows.forEach(r => { settings[r.setting_key] = r.setting_value; });

    res.json({
      sections, featured, announcements, gallery, settings,
      categories,
      stats: {
        products: productCount[0]?.total ?? 0,
        categories: categoryCount[0]?.total ?? 0,
        customers: customerCount[0]?.total ?? 0,
        experience: settings.years_experience || '5',
      },
    });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch homepage data' }); }
});

router.get('/settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT setting_key,setting_value FROM settings');
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    res.json(settings);
  } catch (e) { res.status(500).json({ message: 'Could not fetch settings' }); }
});

router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, COUNT(p.id) AS product_count
       FROM categories c LEFT JOIN products p ON p.category_id=c.id
       GROUP BY c.id ORDER BY c.name ASC`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ message: 'Could not fetch categories' }); }
});

router.get('/products', async (req, res) => {
  const { q, category } = req.query;
  const filters = [], params = [];
  let sql = `SELECT p.*, c.name AS category_name,
    (SELECT image_path FROM product_images WHERE product_id=p.id AND is_primary=1 LIMIT 1) AS image_path
    FROM products p LEFT JOIN categories c ON p.category_id=c.id WHERE 1=1`;
  if (q) { filters.push('(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (category) { filters.push('p.category_id=?'); params.push(category); }
  if (filters.length) sql += ' AND ' + filters.join(' AND ');
  sql += ' ORDER BY p.created_at DESC';
  try {
    const [products] = await pool.query(sql, params);
    if (products.length) {
      const ids = products.map(p => p.id);
      const [variants] = await pool.query(`SELECT * FROM product_variants WHERE product_id IN (${ids.map(() => '?').join(',')})`, ids);
      products.forEach(p => { p.variants = variants.filter(v => v.product_id === p.id); });
    }
    res.json(products);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch products' }); }
});

router.get('/products/:id', async (req, res) => {
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

router.get('/gallery', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM gallery ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ message: 'Could not fetch gallery' }); }
});

router.get('/announcements', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM announcements WHERE status='Published' ORDER BY created_at DESC");
    res.json(rows);
  } catch (e) { res.status(500).json({ message: 'Could not fetch announcements' }); }
});

export default router;
