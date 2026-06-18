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
  if (q) { filters.push('(s.invoice_number LIKE ? OR u.name LIKE ? OR s.customer_name LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
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
       LEFT JOIN product_variants pv ON pv.id = si.product_variant_id
       WHERE si.sale_id = ?`,
      [req.params.id]
    );
    sale.items = items;
    res.json(sale);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch sale' }); }
});

router.post('/', authMiddleware, async (req, res) => {
  const { items, total_amount, payment_method, customer_name } = req.body;
  if (!items?.length) return res.status(400).json({ message: 'Sale items are required' });

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const year = new Date().getFullYear();
    const [maxRow] = await conn.query(
      "SELECT MAX(CAST(SUBSTRING_INDEX(invoice_number, '-', -1) AS UNSIGNED)) AS max_num FROM sales WHERE invoice_number LIKE ?",
      [`INV-${year}-%`]
    );
    const nextNum = (Number(maxRow[0]?.max_num) || 0) + 1;
    const invoiceNumber = `INV-${year}-${String(nextNum).padStart(4, '0')}`;
    const [sale] = await conn.query(
      'INSERT INTO sales (invoice_number,total_amount,payment_method,customer_name,sold_by,sale_date,created_at) VALUES (?,?,?,?,?,NOW(),NOW())',
      [invoiceNumber, total_amount, payment_method || 'Cash', customer_name || null, req.user.id]
    );

    for (const item of items) {
      const { product_id, variant_id, quantity, unit_price } = item;
      const subtotal = Number(quantity) * Number(unit_price);

      if (variant_id) {
        const [vRows] = await conn.query('SELECT stock_quantity,minimum_stock FROM product_variants WHERE id=? AND product_id=?', [variant_id, product_id]);
        if (!vRows.length) throw new Error(`Variant not found: ${variant_id}`);
        const newStock = vRows[0].stock_quantity - Number(quantity);
        if (newStock < 0) throw new Error(`Insufficient stock for variant ${variant_id}`);
        const status = determineStatus(newStock, vRows[0].minimum_stock);
        await conn.query('UPDATE product_variants SET stock_quantity=?,status=? WHERE id=?', [newStock, status, variant_id]);
        await conn.query(
          'INSERT INTO sale_items (sale_id,product_id,product_variant_id,quantity,unit_price,subtotal) VALUES (?,?,?,?,?,?)',
          [sale.insertId, product_id, variant_id, quantity, unit_price, subtotal]
        );
        // Aggregate variant stock back to product row so all admin modules stay in sync
        const [agg] = await conn.query(
          'SELECT COALESCE(SUM(stock_quantity),0) AS total, COALESCE(MIN(minimum_stock),5) AS min_stk FROM product_variants WHERE product_id=?',
          [product_id]
        );
        await conn.query('UPDATE products SET stock_quantity=?,status=? WHERE id=?',
          [agg[0].total, determineStatus(agg[0].total, agg[0].min_stk), product_id]);
      } else {
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
        'INSERT INTO stock_transactions (product_id,quantity,transaction_type,created_by,transaction_date,created_at) VALUES (?,?,?,?,NOW(),NOW())',
        [product_id, -Number(quantity), 'OUT', req.user.id]
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

router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    await pool.query("UPDATE sales SET status='Cancelled' WHERE id=?", [req.params.id]);
    res.json({ message: 'Sale cancelled' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not cancel sale' }); }
});

// ── Customer return ────────────────────────────────────────────────────────────
router.post('/:id/return', authMiddleware, async (req, res) => {
  const { items, notes, refund_amount } = req.body;
  if (!items?.length) return res.status(400).json({ message: 'Return items are required' });

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const [r] = await conn.query(
      'INSERT INTO sale_returns (sale_id,notes,refund_amount,created_by,created_at) VALUES (?,?,?,?,NOW())',
      [req.params.id, notes || null, Number(refund_amount || 0), req.user.id]
    );
    const returnId = r.insertId;

    for (const item of items) {
      const { product_id, product_variant_id, quantity, unit_price } = item;
      const qty = Number(quantity);
      if (!qty || !product_id) continue;

      await conn.query(
        'INSERT INTO sale_return_items (return_id,product_id,product_variant_id,quantity,unit_price,subtotal) VALUES (?,?,?,?,?,?)',
        [returnId, product_id, product_variant_id || null, qty, Number(unit_price || 0), qty * Number(unit_price || 0)]
      );

      // Customer returns item → stock increases
      if (product_variant_id) {
        await conn.query('UPDATE product_variants SET stock_quantity=stock_quantity+? WHERE id=?', [qty, product_variant_id]);
        const [v] = await conn.query('SELECT stock_quantity,minimum_stock FROM product_variants WHERE id=?', [product_variant_id]);
        if (v.length) await conn.query('UPDATE product_variants SET status=? WHERE id=?', [determineStatus(v[0].stock_quantity, v[0].minimum_stock), product_variant_id]);
        const [agg] = await conn.query('SELECT COALESCE(SUM(stock_quantity),0) AS total,COALESCE(MIN(minimum_stock),5) AS min_stk FROM product_variants WHERE product_id=?', [product_id]);
        await conn.query('UPDATE products SET stock_quantity=?,status=? WHERE id=?', [agg[0].total, determineStatus(agg[0].total, agg[0].min_stk), product_id]);
      } else {
        await conn.query('UPDATE products SET stock_quantity=stock_quantity+? WHERE id=?', [qty, product_id]);
        const [p] = await conn.query('SELECT stock_quantity,minimum_stock FROM products WHERE id=?', [product_id]);
        if (p.length) await conn.query('UPDATE products SET status=? WHERE id=?', [determineStatus(p[0].stock_quantity, p[0].minimum_stock), product_id]);
      }

      await conn.query(
        'INSERT INTO stock_transactions (product_id,product_variant_id,quantity,transaction_type,notes,created_by,transaction_date,created_at) VALUES (?,?,?,?,?,?,NOW(),NOW())',
        [product_id, product_variant_id || null, qty, 'RETURN_IN', `Customer return — Sale #${req.params.id}`, req.user.id]
      );
    }

    await conn.commit();
    res.status(201).json({ id: returnId, message: 'Return recorded, stock restored' });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ message: e.message || 'Could not record return' });
  } finally { conn.release(); }
});

export default router;
