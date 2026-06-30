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
const uploadDir = path.join(__dirname, '../../uploads/categories');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.-]/g, '');
    cb(null, `${Date.now()}-${safe}`);
  },
});
const upload = multer({ storage });

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
  const image_path = req.file ? `uploads/categories/${req.file.filename}` : null;
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
  const image_path = req.file ? `uploads/categories/${req.file.filename}` : (existing_image_path || null);
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
