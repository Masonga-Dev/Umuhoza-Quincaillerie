import express from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// GET /api/customers?q=
router.get('/', async (req, res) => {
  const { q } = req.query;
  let sql = `SELECT c.*,
      (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS order_count,
      (SELECT COALESCE(SUM(o.total_amount),0) FROM orders o
        WHERE o.customer_id = c.id AND o.status <> 'Cancelled') AS total_spent
    FROM customers c`;
  const params = [];
  if (q) {
    sql += ' WHERE (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY c.created_at DESC';
  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch customers' }); }
});

// GET /api/customers/:id (with order history)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Customer not found' });
    const customer = rows[0];
    const [orders] = await pool.query(
      'SELECT id, order_number, status, payment_status, total_amount, placed_at FROM orders WHERE customer_id = ? ORDER BY placed_at DESC',
      [customer.id]
    );
    customer.orders = orders;
    res.json(customer);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch customer' }); }
});

// POST /api/customers
router.post('/', async (req, res) => {
  const { name, phone, email, province, district, sector, address_details, notes } = req.body || {};
  if (!String(name || '').trim()) return res.status(400).json({ message: 'Customer name is required' });
  if (!String(phone || '').trim()) return res.status(400).json({ message: 'Customer phone is required' });
  try {
    const [result] = await pool.query(
      'INSERT INTO customers (name, phone, email, province, district, sector, address_details, notes) VALUES (?,?,?,?,?,?,?,?)',
      [String(name).trim(), String(phone).trim(), email || null, province || null, district || null,
       sector || null, address_details || null, notes || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Customer created' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'A customer with this phone already exists' });
    console.error(e);
    res.status(500).json({ message: 'Could not create customer' });
  }
});

// PUT /api/customers/:id
router.put('/:id', async (req, res) => {
  const { name, phone, email, province, district, sector, address_details, notes } = req.body || {};
  if (!String(name || '').trim()) return res.status(400).json({ message: 'Customer name is required' });
  if (!String(phone || '').trim()) return res.status(400).json({ message: 'Customer phone is required' });
  try {
    const [existing] = await pool.query('SELECT id FROM customers WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: 'Customer not found' });
    await pool.query(
      'UPDATE customers SET name=?, phone=?, email=?, province=?, district=?, sector=?, address_details=?, notes=? WHERE id=?',
      [String(name).trim(), String(phone).trim(), email || null, province || null, district || null,
       sector || null, address_details || null, notes || null, req.params.id]
    );
    res.json({ message: 'Customer updated' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'A customer with this phone already exists' });
    console.error(e);
    res.status(500).json({ message: 'Could not update customer' });
  }
});

// DELETE /api/customers/:id — orders FK is ON DELETE RESTRICT, so only
// customers without orders can be removed through this endpoint.
router.delete('/:id', async (req, res) => {
  try {
    const [orderCount] = await pool.query('SELECT COUNT(*) AS n FROM orders WHERE customer_id = ?', [req.params.id]);
    if (Number(orderCount[0].n) > 0) {
      return res.status(409).json({ message: 'Customer has orders — delete or cancel them first' });
    }
    const [result] = await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Customer not found' });
    res.json({ message: 'Customer deleted' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not delete customer' }); }
});

export default router;
