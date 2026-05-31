import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/homepage', async (req, res) => {
  try {
    const [banners] = await pool.query('SELECT * FROM homepage_content ORDER BY id ASC');
    const [featured] = await pool.query(
      `SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.status <> 'Out of Stock' ORDER BY p.created_at DESC LIMIT 8`
    );
    const [announcements] = await pool.query('SELECT * FROM announcements WHERE status = ? ORDER BY created_at DESC', ['Published']);
    res.json({ banners, featured, announcements });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not fetch homepage data' });
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
