import express from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not fetch categories' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { name, description } = req.body;
  try {
    const [result] = await pool.query('INSERT INTO categories (name, description, created_at) VALUES (?, ?, NOW())', [name, description]);
    res.status(201).json({ id: result.insertId, message: 'Category created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not create category' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { name, description } = req.body;
  try {
    await pool.query('UPDATE categories SET name = ?, description = ? WHERE id = ?', [name, description, req.params.id]);
    res.json({ message: 'Category updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not update category' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not delete category' });
  }
});

export default router;
