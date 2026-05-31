import express from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const query = `
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC
  `;

  try {
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not fetch products' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not fetch product' });
  }
});

function determineStatus(stockQuantity) {
  if (stockQuantity <= 0) return 'Out of Stock';
  if (stockQuantity <= 5) return 'Low Stock';
  return 'In Stock';
}

router.post('/', authMiddleware, async (req, res) => {
  const { category_id, name, description, stock_quantity } = req.body;
  const status = determineStatus(Number(stock_quantity ?? 0));
  try {
    const [result] = await pool.query(
      'INSERT INTO products (category_id, name, description, stock_quantity, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [category_id, name, description, stock_quantity ?? 0, status]
    );
    res.status(201).json({ id: result.insertId, message: 'Product created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not create product' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { category_id, name, description, stock_quantity } = req.body;
  const status = determineStatus(Number(stock_quantity ?? 0));
  try {
    await pool.query(
      'UPDATE products SET category_id = ?, name = ?, description = ?, stock_quantity = ?, status = ? WHERE id = ?',
      [category_id, name, description, stock_quantity ?? 0, status, req.params.id]
    );
    res.json({ message: 'Product updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not update product' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not delete product' });
  }
});

export default router;
