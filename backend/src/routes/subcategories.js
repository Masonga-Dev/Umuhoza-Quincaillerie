import express from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import makeUpload from '../middleware/upload.js';

const router = express.Router();
const upload = makeUpload('subcategories');

// GET /subcategories?category_id=X
router.get('/', async (req, res) => {
  const { category_id } = req.query;
  try {
    // Check if subcategory_id column exists on products before joining
    const [cols] = await pool.query(`SHOW COLUMNS FROM products LIKE 'subcategory_id'`);
    const hasCol = cols.length > 0;

    let sql = hasCol
      ? `SELECT s.*, c.name AS category_name, COUNT(p.id) AS product_count
         FROM subcategories s
         LEFT JOIN categories c ON s.category_id = c.id
         LEFT JOIN products p ON p.subcategory_id = s.id
         WHERE 1=1`
      : `SELECT s.*, c.name AS category_name, 0 AS product_count
         FROM subcategories s
         LEFT JOIN categories c ON s.category_id = c.id
         WHERE 1=1`;

    const params = [];
    if (category_id) { sql += ' AND s.category_id = ?'; params.push(category_id); }
    sql += hasCol ? ' GROUP BY s.id ORDER BY s.category_id, s.name ASC' : ' ORDER BY s.category_id, s.name ASC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ message: e.message }); }
});

// POST /subcategories
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  const { category_id, name, name_rw, name_fr, description, description_rw, description_fr } = req.body;
  if (!category_id) return res.status(400).json({ message: 'Category is required' });
  if (!name?.trim()) return res.status(400).json({ message: 'Subcategory name is required' });
  const image_path = req.file ? req.file.path : null;
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
  const image_path = req.file ? req.file.path : (existing_image_path || null);
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

// Temporary debug endpoint — remove after confirming live DB state
router.get('/debug', async (req, res) => {
  try {
    const [tables] = await pool.query(`SHOW TABLES LIKE 'subcategories'`);
    const [prodCols] = await pool.query(`SHOW COLUMNS FROM products LIKE 'subcategory_id'`);
    const [subCols] = await pool.query(`SHOW COLUMNS FROM subcategories`);
    res.json({
      subcategories_table_exists: tables.length > 0,
      products_has_subcategory_id: prodCols.length > 0,
      subcategories_columns: subCols.map(c => c.Field),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
