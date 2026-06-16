import express from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM suppliers ORDER BY name ASC');
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch suppliers' }); }
});

router.post('/', async (req, res) => {
  const { name, contact_person, phone, email, address, notes } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Supplier name is required' });
  try {
    const [r] = await pool.query(
      'INSERT INTO suppliers (name, contact_person, phone, email, address, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [name, contact_person || null, phone || null, email || null, address || null, notes || null]
    );
    res.status(201).json({ id: r.insertId, message: 'Supplier created' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not create supplier' }); }
});

router.put('/:id', async (req, res) => {
  const { name, contact_person, phone, email, address, notes, is_active } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Supplier name is required' });
  try {
    await pool.query(
      'UPDATE suppliers SET name=?, contact_person=?, phone=?, email=?, address=?, notes=?, is_active=? WHERE id=?',
      [name, contact_person || null, phone || null, email || null, address || null, notes || null, is_active !== false ? 1 : 0, req.params.id]
    );
    res.json({ message: 'Supplier updated' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not update supplier' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM suppliers WHERE id=?', [req.params.id]);
    res.json({ message: 'Supplier deleted' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not delete supplier' }); }
});

export default router;
