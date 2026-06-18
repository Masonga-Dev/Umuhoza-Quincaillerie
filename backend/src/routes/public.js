import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/homepage', async (req, res) => {
  try {
    const [sections] = await pool.query('SELECT * FROM homepage_content WHERE is_active=1 ORDER BY display_order ASC');
    const [featured] = await pool.query(
      `SELECT p.id, p.name, p.sku, p.description, p.selling_price, p.stock_quantity, p.status, p.category_id, c.name AS category_name,
        (SELECT image_path FROM product_images WHERE product_id=p.id ORDER BY is_primary DESC, created_at ASC LIMIT 1) AS image_path
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
      `SELECT c.id, c.name, c.name_rw, c.name_fr, c.description, c.description_rw, c.description_fr, c.image_path, COUNT(p.id) AS product_count,
        (SELECT pi.image_path FROM product_images pi
         JOIN products pp ON pp.id = pi.product_id
         WHERE pp.category_id = c.id
         ORDER BY pi.is_primary DESC, pi.created_at ASC LIMIT 1) AS representative_image
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
    const [cats] = await pool.query(
      `SELECT c.id, c.name, c.name_rw, c.name_fr, c.description, c.description_rw, c.description_fr, c.image_path,
        COUNT(DISTINCT p.id) AS product_count,
        (SELECT pi.image_path FROM product_images pi JOIN products pp ON pp.id = pi.product_id
         WHERE pp.category_id = c.id ORDER BY pi.is_primary DESC, pi.created_at ASC LIMIT 1) AS representative_image
       FROM categories c LEFT JOIN products p ON p.category_id=c.id
       GROUP BY c.id ORDER BY c.name ASC`
    );
    const [subs] = await pool.query(
      `SELECT s.id, s.category_id, s.name, s.name_rw, s.name_fr, s.image_path,
        COUNT(p.id) AS product_count,
        (SELECT pi.image_path FROM product_images pi JOIN products pp ON pp.id = pi.product_id
         WHERE pp.subcategory_id = s.id ORDER BY pi.is_primary DESC LIMIT 1) AS representative_image
       FROM subcategories s LEFT JOIN products p ON p.subcategory_id = s.id
       GROUP BY s.id ORDER BY s.category_id, s.name ASC`
    );
    const [[spRow]] = await pool.query("SELECT setting_value FROM settings WHERE setting_key='show_prices' LIMIT 1");
    const subMap = {};
    subs.forEach(s => { if (!subMap[s.category_id]) subMap[s.category_id] = []; subMap[s.category_id].push(s); });
    res.json({
      categories: cats.map(c => ({ ...c, subcategories: subMap[c.id] || [] })),
      show_prices: spRow?.setting_value ?? 'true',
    });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch categories' }); }
});

router.get('/subcategories', async (req, res) => {
  const { category_id } = req.query;
  try {
    let sql = `SELECT s.id, s.category_id, s.name, s.name_rw, s.name_fr, s.description, s.description_rw, s.description_fr, s.image_path,
      c.name AS category_name,
      COUNT(p.id) AS product_count,
      (SELECT pi.image_path FROM product_images pi JOIN products pp ON pp.id = pi.product_id
       WHERE pp.subcategory_id = s.id ORDER BY pi.is_primary DESC LIMIT 1) AS representative_image
     FROM subcategories s LEFT JOIN categories c ON s.category_id = c.id
     LEFT JOIN products p ON p.subcategory_id = s.id WHERE 1=1`;
    const params = [];
    if (category_id) { sql += ' AND s.category_id = ?'; params.push(category_id); }
    sql += ' GROUP BY s.id ORDER BY s.name ASC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch subcategories' }); }
});

router.get('/products', async (req, res) => {
  const { q, category, subcategory_id } = req.query;
  const filters = [], params = [];
  let sql = `SELECT p.id, p.name, p.sku, p.description, p.selling_price, p.stock_quantity, p.minimum_stock,
    CASE
      WHEN (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id) > 0
      THEN CASE WHEN (SELECT SUM(pv2.stock_quantity) FROM product_variants pv2 WHERE pv2.product_id = p.id) > 0 THEN 'In Stock' ELSE 'Out of Stock' END
      ELSE p.status
    END AS status,
    (SELECT MIN(pv3.selling_price) FROM product_variants pv3 WHERE pv3.product_id = p.id AND pv3.selling_price > 0) AS min_variant_price,
    p.category_id, p.subcategory_id, p.created_at, c.name AS category_name, s.name AS subcategory_name,
    (SELECT image_path FROM product_images WHERE product_id=p.id ORDER BY is_primary DESC, created_at ASC LIMIT 1) AS image_path
    FROM products p LEFT JOIN categories c ON p.category_id=c.id LEFT JOIN subcategories s ON p.subcategory_id=s.id WHERE 1=1`;
  if (q) { filters.push('(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (subcategory_id) { filters.push('p.subcategory_id=?'); params.push(subcategory_id); }
  else if (category) { filters.push('p.category_id=?'); params.push(category); }
  if (filters.length) sql += ' AND ' + filters.join(' AND ');
  sql += ' ORDER BY p.created_at DESC';
  try {
    const [products] = await pool.query(sql, params);
    if (products.length) {
      const ids = products.map(p => p.id);
      const [variants] = await pool.query(
        `SELECT id, product_id, color, size, sku, selling_price, cost_price, stock_quantity, minimum_stock, status FROM product_variants WHERE product_id IN (${ids.map(() => '?').join(',')}) ORDER BY created_at ASC`,
        ids
      );
      products.forEach(p => { p.variants = variants.filter(v => v.product_id === p.id); });
    }
    res.json(products);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch products' }); }
});

router.get('/products/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.name_rw, p.name_fr, p.sku, p.description, p.description_rw, p.description_fr,
              p.selling_price, p.stock_quantity, p.minimum_stock, p.status, p.category_id, p.subcategory_id, p.created_at,
              c.name AS category_name, s.name AS subcategory_name
       FROM products p LEFT JOIN categories c ON p.category_id=c.id LEFT JOIN subcategories s ON p.subcategory_id=s.id WHERE p.id=?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Product not found' });
    const product = rows[0];
    const [images] = await pool.query(
      'SELECT id, product_id, image_path, is_primary, created_at FROM product_images WHERE product_id=? ORDER BY is_primary DESC, created_at ASC',
      [req.params.id]
    );
    const [variants] = await pool.query(
      'SELECT id, product_id, color, size, sku, selling_price, stock_quantity, minimum_stock, status FROM product_variants WHERE product_id=? ORDER BY created_at ASC',
      [req.params.id]
    );
    const [[spRow]] = await pool.query("SELECT setting_value FROM settings WHERE setting_key='show_prices' LIMIT 1");
    product.images = images;
    product.variants = variants;
    product.image_path = images.find(i => i.is_primary)?.image_path || images[0]?.image_path || null;
    product.show_prices = spRow?.setting_value ?? 'true';
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
