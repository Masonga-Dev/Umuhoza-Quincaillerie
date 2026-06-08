import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/homepage', async (req, res) => {
  try {
    const [sections] = await pool.query(
      'SELECT * FROM homepage_content WHERE is_active = 1 ORDER BY display_order ASC'
    );
    const [featured] = await pool.query(
      `SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.status <> 'Out of Stock' ORDER BY p.created_at DESC LIMIT 8`
    );
    const [announcements] = await pool.query(
      'SELECT * FROM announcements WHERE status = ? ORDER BY created_at DESC',
      ['Published']
    );
    const [gallery] = await pool.query('SELECT * FROM gallery ORDER BY created_at DESC LIMIT 8');
    const [settingsRows] = await pool.query('SELECT setting_key, setting_value FROM settings');
    const [productCountRows] = await pool.query('SELECT COUNT(*) AS total FROM products');
    const [categoryCountRows] = await pool.query('SELECT COUNT(*) AS total FROM categories');
    const [customerCountRows] = await pool.query('SELECT COUNT(DISTINCT sold_by) AS total FROM sales WHERE sold_by IS NOT NULL');

    const settings = {};
    settingsRows.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });

    const stats = {
      products: productCountRows[0]?.total ?? 0,
      categories: categoryCountRows[0]?.total ?? 0,
      customers: customerCountRows[0]?.total ?? 0,
      experience: settings.years_experience || '5',
    };

    res.json({ sections, featured, announcements, gallery, settings, stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not fetch homepage data' });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings');
    const settings = {};
    rows.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not fetch settings' });
  }
});

router.get('/products', async (req, res) => {
  const { q, category } = req.query;
  const filters = [];
  const params = [];

  let sql = `SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1`;
  if (q) {
    filters.push('(p.name LIKE ? OR p.description LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (category) {
    filters.push('c.id = ?');
    params.push(category);
  }
  if (filters.length) {
    sql += ' AND ' + filters.join(' AND ');
  }
  sql += ' ORDER BY p.created_at DESC';

  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not fetch product catalog' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not fetch categories' });
  }
});

export default router;
