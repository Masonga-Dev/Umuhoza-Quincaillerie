import express from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import makeUpload from '../middleware/upload.js';

const router = express.Router();
const upload = makeUpload('categories');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, COUNT(DISTINCT p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not fetch categories' });
  }
});

router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  const { name, name_rw, name_fr, description, description_rw, description_fr } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Category name is required' });
  const image_path = req.file ? req.file.path : null;
  try {
    const [result] = await pool.query(
      'INSERT INTO categories (name, name_rw, name_fr, description, description_rw, description_fr, image_path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [name, name_rw || null, name_fr || null, description || null, description_rw || null, description_fr || null, image_path]
    );
    res.status(201).json({ id: result.insertId, message: 'Category created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not create category' });
  }
});

router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  const { name, name_rw, name_fr, description, description_rw, description_fr, existing_image_path } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Category name is required' });
  const image_path = req.file ? req.file.path : (existing_image_path || null);
  try {
    await pool.query(
      'UPDATE categories SET name=?, name_rw=?, name_fr=?, description=?, description_rw=?, description_fr=?, image_path=? WHERE id=?',
      [name, name_rw || null, name_fr || null, description || null, description_rw || null, description_fr || null, image_path, req.params.id]
    );
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
