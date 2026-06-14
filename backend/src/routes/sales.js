import express from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

function determineStatus(qty, min = 5) {
  const q = Number(qty ?? 0), m = Number(min ?? 5);
  if (q <= 0) return 'Out of Stock';
  if (q <= m) return 'Low Stock';
  return 'In Stock';
}

router.get('/', authMiddleware, async (req, res) => {
  const { q } = req.query;
  let query = 'SELECT s.*, u.name AS sold_by_name FROM sales s LEFT JOIN users u ON s.sold_by=u.id';
  const params = [], filters = [];
  if (q) { filters.push('(s.invoice_number LIKE ? OR u.name LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (filters.length) query += ' WHERE ' + filters.join(' AND ');
  query += ' ORDER BY s.sale_date DESC';
  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch sales' }); }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [saleRows] = await pool.query(
      'SELECT s.*, u.name AS sold_by_name FROM sales s LEFT JOIN users u ON s.sold_by=u.id WHERE s.id=?',
      [req.params.id]
    );
    if (!saleRows.length) return res.status(404).json({ message: 'Sale not found' });
    const sale = saleRows[0];
    const [items] = await pool.query(
      `SELECT si.*, p.name AS product_name, p.sku AS product_sku,
              pv.color AS variant_color, pv.size AS variant_size, pv.sku AS variant_sku
       FROM sale_items si
       JOIN products p ON p.id = si.product_id
       LEFT JOIN product_variants pv ON pv.id = si.variant_id
       WHERE si.sale_id = ?`,
      [req.params.id]
    );
    sale.items = items;
    res.json(sale);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch sale' }); }
});

router.post('/', authMiddleware, async (req, res) => {
  const { items, total_amount } = req.body;
  if (!items?.length) return res.status(400).json({ message: 'Sale items are required' });

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const [cnt] = await conn.query('SELECT COUNT(*) AS total FROM sales WHERE DATE(sale_date)=CURDATE()');
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(cnt[0].total + 1).padStart(3, '0')}`;
    const [sale] = await conn.query(
      'INSERT INTO sales (invoice_number,total_amount,sold_by,sale_date,created_at) VALUES (?,?,?,NOW(),NOW())',
      [invoiceNumber, total_amount, req.user.id]
    );

    for (const item of items) {
      const { product_id, variant_id, quantity, unit_price } = item;
      const subtotal = Number(quantity) * Number(unit_price);

      if (variant_id) {
        // Deduct from variant stock
        const [vRows] = await conn.query('SELECT stock_quantity,minimum_stock FROM product_variants WHERE id=? AND product_id=?', [variant_id, product_id]);
        if (!vRows.length) throw new Error(`Variant not found: ${variant_id}`);
        const newStock = vRows[0].stock_quantity - Number(quantity);
        if (newStock < 0) throw new Error(`Insufficient stock for variant ${variant_id}`);
        const status = determineStatus(newStock, vRows[0].minimum_stock);
        await conn.query('UPDATE product_variants SET stock_quantity=?,status=? WHERE id=?', [newStock, status, variant_id]);
        await conn.query(
          'INSERT INTO sale_items (sale_id,product_id,variant_id,quantity,unit_price,subtotal) VALUES (?,?,?,?,?,?)',
          [sale.insertId, product_id, variant_id, quantity, unit_price, subtotal]
        );
      } else {
        // Deduct from product stock
        const [pRows] = await conn.query('SELECT stock_quantity,minimum_stock FROM products WHERE id=?', [product_id]);
        if (!pRows.length) throw new Error(`Product not found: ${product_id}`);
        const newStock = pRows[0].stock_quantity - Number(quantity);
        if (newStock < 0) throw new Error(`Insufficient stock for product ${product_id}`);
        const status = determineStatus(newStock, pRows[0].minimum_stock);
        await conn.query('UPDATE products SET stock_quantity=?,status=? WHERE id=?', [newStock, status, product_id]);
        await conn.query(
          'INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,subtotal) VALUES (?,?,?,?,?)',
          [sale.insertId, product_id, quantity, unit_price, subtotal]
        );
      }

      await conn.query(
        'INSERT INTO stock_transactions (product_id,quantity,transaction_type,transaction_date,created_at) VALUES (?,?,?,NOW(),NOW())',
        [product_id, -Number(quantity), 'OUT']
      );
    }

    await conn.commit();
    res.status(201).json({ invoice_number: invoiceNumber, message: 'Sale recorded' });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ message: e.message || 'Could not record sale' });
  } finally {
    conn.release();
  }
});

export default router;
