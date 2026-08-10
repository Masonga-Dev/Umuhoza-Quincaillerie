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
  let query = `SELECT s.*, u.name AS sold_by_name,
    COALESCE((SELECT SUM(sri.quantity) FROM sale_return_items sri JOIN sale_returns sr ON sr.id=sri.return_id WHERE sr.sale_id=s.id),0) AS total_returned
    FROM sales s LEFT JOIN users u ON s.sold_by=u.id`;
  const params = [], filters = [];
  if (q) { filters.push('(s.invoice_number LIKE ? OR u.name LIKE ? OR s.customer_name LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (filters.length) query += ' WHERE ' + filters.join(' AND ');
  query += ' ORDER BY s.sale_date DESC';
  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch sales' }); }
});

// ── Line-item export ─────────────────────────────────────────────────────────
router.get('/export', authMiddleware, async (req, res) => {
  const { period, from, to } = req.query;
  let dateFilter = '';
  const params = [];
  if (period === 'daily')   dateFilter = 'AND DATE(s.sale_date) = CURDATE()';
  if (period === 'weekly')  dateFilter = 'AND s.sale_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
  if (period === 'monthly') dateFilter = 'AND s.sale_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
  if (period === 'yearly')  dateFilter = 'AND YEAR(s.sale_date) = YEAR(CURDATE())';
  if (period === 'custom' && from && to) {
    dateFilter = 'AND s.sale_date >= ? AND s.sale_date <= ?';
    params.push(from, to + ' 23:59:59');
  }
  try {
    const [rows] = await pool.query(
      `SELECT
         s.invoice_number,
         s.sale_date,
         COALESCE(s.customer_name, '') AS customer_name,
         p.name                        AS product_name,
         COALESCE(pv.sku, p.sku, '')   AS sku,
         NULLIF(CONCAT_WS(' / ', NULLIF(pv.color,''), NULLIF(pv.size,'')), '') AS variant,
         COALESCE(c.name, '')          AS category,
         si.quantity,
         si.unit_price,
         si.subtotal,
         COALESCE(
           NULLIF(si.cost_price, 0),
           (SELECT pi.unit_cost
            FROM purchase_items pi
            JOIN purchases pu ON pu.id = pi.purchase_id
            WHERE pi.product_id = si.product_id
              AND (pi.product_variant_id <=> si.product_variant_id)
            ORDER BY pu.purchase_date DESC
            LIMIT 1),
           0
         )                             AS cost_price,
         (si.unit_price - COALESCE(
           NULLIF(si.cost_price, 0),
           (SELECT pi2.unit_cost
            FROM purchase_items pi2
            JOIN purchases pu2 ON pu2.id = pi2.purchase_id
            WHERE pi2.product_id = si.product_id
              AND (pi2.product_variant_id <=> si.product_variant_id)
            ORDER BY pu2.purchase_date DESC
            LIMIT 1),
           0
         )) * si.quantity              AS profit,
         s.payment_method,
         s.status,
         COALESCE(u.name, '')          AS served_by,
         s.total_amount                AS invoice_total
       FROM sale_items si
       JOIN sales s    ON s.id  = si.sale_id
       JOIN products p ON p.id  = si.product_id
       LEFT JOIN product_variants pv ON pv.id = si.product_variant_id
       LEFT JOIN categories c        ON c.id  = p.category_id
       LEFT JOIN users u             ON u.id  = s.sold_by
       WHERE 1=1 ${dateFilter}
       ORDER BY s.sale_date DESC, s.id, si.id`,
      params
    );
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not generate export' }); }
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
              pv.color AS variant_color, pv.size AS variant_size, pv.sku AS variant_sku,
              COALESCE((
                SELECT SUM(sri.quantity)
                FROM sale_return_items sri
                JOIN sale_returns sr ON sr.id = sri.return_id
                WHERE sr.sale_id = si.sale_id
                  AND sri.product_id = si.product_id
                  AND (sri.product_variant_id <=> si.product_variant_id)
              ), 0) AS already_returned
       FROM sale_items si
       JOIN products p ON p.id = si.product_id
       LEFT JOIN product_variants pv ON pv.id = si.product_variant_id
       WHERE si.sale_id = ?`,
      [req.params.id]
    );
    const [returns] = await pool.query(
      `SELECT sr.id, sr.notes, sr.refund_amount, sr.created_at,
              u.name AS created_by_name
       FROM sale_returns sr
       LEFT JOIN users u ON u.id = sr.created_by
       WHERE sr.sale_id = ? ORDER BY sr.created_at ASC`,
      [req.params.id]
    );
    for (const ret of returns) {
      const [ritems] = await pool.query(
        `SELECT sri.*, p.name AS product_name, pv.color AS variant_color, pv.size AS variant_size
         FROM sale_return_items sri
         JOIN products p ON p.id = sri.product_id
         LEFT JOIN product_variants pv ON pv.id = sri.product_variant_id
         WHERE sri.return_id = ?`,
        [ret.id]
      );
      ret.items = ritems;
    }
    sale.items = items;
    sale.returns = returns;
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
        const [vRows] = await conn.query('SELECT stock_quantity,minimum_stock,cost_price FROM product_variants WHERE id=? AND product_id=?', [variant_id, product_id]);
        if (!vRows.length) throw new Error(`Variant not found: ${variant_id}`);
        const newStock = vRows[0].stock_quantity - Number(quantity);
        if (newStock < 0) throw new Error(`Insufficient stock for variant ${variant_id}`);
        const status = determineStatus(newStock, vRows[0].minimum_stock);
        await conn.query('UPDATE product_variants SET stock_quantity=?,status=? WHERE id=?', [newStock, status, variant_id]);
        await conn.query(
          'INSERT INTO sale_items (sale_id,product_id,product_variant_id,quantity,unit_price,subtotal,cost_price) VALUES (?,?,?,?,?,?,?)',
          [sale.insertId, product_id, variant_id, quantity, unit_price, subtotal, Number(vRows[0].cost_price || 0)]
        );
        // Aggregate variant stock back to product row so all admin modules stay in sync
        const [agg] = await conn.query(
          'SELECT COALESCE(SUM(stock_quantity),0) AS total, COALESCE(MIN(minimum_stock),5) AS min_stk FROM product_variants WHERE product_id=?',
          [product_id]
        );
        await conn.query('UPDATE products SET stock_quantity=?,status=? WHERE id=?',
          [agg[0].total, determineStatus(agg[0].total, agg[0].min_stk), product_id]);
      } else {
        const [pRows] = await conn.query('SELECT stock_quantity,minimum_stock,cost_price FROM products WHERE id=?', [product_id]);
        if (!pRows.length) throw new Error(`Product not found: ${product_id}`);
        const newStock = pRows[0].stock_quantity - Number(quantity);
        if (newStock < 0) throw new Error(`Insufficient stock for product ${product_id}`);
        const status = determineStatus(newStock, pRows[0].minimum_stock);
        await conn.query('UPDATE products SET stock_quantity=?,status=? WHERE id=?', [newStock, status, product_id]);
        await conn.query(
          'INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,subtotal,cost_price) VALUES (?,?,?,?,?,?)',
          [sale.insertId, product_id, quantity, unit_price, subtotal, Number(pRows[0].cost_price || 0)]
        );
      }

      await conn.query(
        'INSERT INTO stock_transactions (product_id,product_variant_id,quantity,transaction_type,notes,created_by,transaction_date,created_at) VALUES (?,?,?,?,?,?,NOW(),NOW())',
        [product_id, item.variant_id || null, -Number(quantity), 'OUT', `Sale #${sale.insertId}`, req.user.id]
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

      // Enforce max returnable = sold qty - already returned
      const [[soldRow]] = await conn.query(
        `SELECT si.quantity AS sold_qty,
                COALESCE((
                  SELECT SUM(sri.quantity)
                  FROM sale_return_items sri
                  JOIN sale_returns sr ON sr.id = sri.return_id
                  WHERE sr.sale_id = ? AND sri.product_id = ?
                    AND (sri.product_variant_id <=> ?)
                ), 0) AS already_returned
         FROM sale_items si
         WHERE si.sale_id = ? AND si.product_id = ?
           AND (si.product_variant_id <=> ?)`,
        [req.params.id, product_id, product_variant_id || null,
         req.params.id, product_id, product_variant_id || null]
      );
      if (!soldRow) throw new Error(`Item not found in original sale`);
      const maxReturnable = Number(soldRow.sold_qty) - Number(soldRow.already_returned);
      if (qty > maxReturnable) throw new Error(`Cannot return ${qty} — only ${maxReturnable} returnable for "${product_id}"`);
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
