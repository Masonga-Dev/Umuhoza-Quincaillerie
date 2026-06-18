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
const uploadDir = path.join(__dirname, '../../uploads/subcategories');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.-]/g, '');
    cb(null, `${Date.now()}-${safe}`);
  },
});
const upload = multer({ storage });

// GET /subcategories?category_id=X
router.get('/', async (req, res) => {
  const { category_id } = req.query;
  try {
    let sql = `SELECT s.*, c.name AS category_name, COUNT(p.id) AS product_count
      FROM subcategories s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN products p ON p.subcategory_id = s.id
      WHERE 1=1`;
    const params = [];
    if (category_id) { sql += ' AND s.category_id = ?'; params.push(category_id); }
    sql += ' GROUP BY s.id ORDER BY s.category_id, s.name ASC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch subcategories' }); }
});

// POST /subcategories
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  const { category_id, name, name_rw, name_fr, description, description_rw, description_fr } = req.body;
  if (!category_id) return res.status(400).json({ message: 'Category is required' });
  if (!name?.trim()) return res.status(400).json({ message: 'Subcategory name is required' });
  const image_path = req.file ? `uploads/subcategories/${req.file.filename}` : null;
  try {
    const [result] = await pool.query(
      'INSERT INTO subcategories (category_id, name, name_rw, name_fr, description, description_rw, description_fr, image_path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [category_id, name, name_rw || null, name_fr || null, description || null, description_rw || null, description_fr || null, image_path]
    );
    res.status(201).json({ id: result.insertId, message: 'Subcategory created' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not create subcategory' }); }
});

// PUT /subcategories/:id
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  const { category_id, name, name_rw, name_fr, description, description_rw, description_fr, existing_image_path } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Subcategory name is required' });
  const image_path = req.file ? `uploads/subcategories/${req.file.filename}` : (existing_image_path || null);
  try {
    await pool.query(
      'UPDATE subcategories SET category_id=?, name=?, name_rw=?, name_fr=?, description=?, description_rw=?, description_fr=?, image_path=? WHERE id=?',
      [category_id, name, name_rw || null, name_fr || null, description || null, description_rw || null, description_fr || null, image_path, req.params.id]
    );
    res.json({ message: 'Subcategory updated' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not update subcategory' }); }
});

// DELETE /subcategories/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE products SET subcategory_id = NULL WHERE subcategory_id = ?', [req.params.id]);
    await pool.query('DELETE FROM subcategories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Subcategory deleted' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not delete subcategory' }); }
});

export default router;
