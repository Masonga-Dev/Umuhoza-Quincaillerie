import express from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

function determineStatus(qty, min = 5) {
  const q = Number(qty ?? 0), m = Number(min ?? 5);
  if (q <= 0) return 'Out of Stock';
  if (q <= m) return 'Low Stock';
  return 'In Stock';
}

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, s.name AS supplier_name,
              COALESCE(s.phone, s.email, '') AS supplier_contact,
              u.name AS created_by_name
       FROM purchases p
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       LEFT JOIN users u ON u.id = p.created_by
       ORDER BY p.purchase_date DESC`
    );
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch purchases' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [pRows] = await pool.query(
      `SELECT p.*, s.name AS supplier_name, u.name AS created_by_name,
              COALESCE((SELECT SUM(pr2.total_returned_cost) FROM purchase_returns pr2 WHERE pr2.purchase_id = p.id), 0) AS total_returned_cost
       FROM purchases p
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       LEFT JOIN users u ON u.id = p.created_by
       WHERE p.id=?`,
      [req.params.id]
    );
    if (!pRows.length) return res.status(404).json({ message: 'Purchase not found' });
    const purchase = pRows[0];
    const [items] = await pool.query(
      `SELECT pi.*,
              prod.name AS product_name, prod.sku AS product_sku,
              pv.color AS variant_color, pv.size AS variant_size, pv.sku AS variant_sku,
              COALESCE((
                SELECT SUM(pri.quantity)
                FROM purchase_return_items pri
                JOIN purchase_returns pret ON pret.id = pri.return_id
                WHERE pret.purchase_id = pi.purchase_id
                  AND pri.product_id = pi.product_id
                  AND (pri.product_variant_id <=> pi.product_variant_id)
              ), 0) AS returned_quantity
       FROM purchase_items pi
       JOIN products prod ON prod.id = pi.product_id
       LEFT JOIN product_variants pv ON pv.id = pi.product_variant_id
       WHERE pi.purchase_id=?`,
      [req.params.id]
    );
    purchase.items = items;
    res.json(purchase);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch purchase' }); }
});

router.post('/', async (req, res) => {
  const { supplier_id, reference_number, purchase_date, notes, items } = req.body;
  if (!items?.length) return res.status(400).json({ message: 'Purchase items are required' });

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const total_cost = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_cost), 0);
    const [r] = await conn.query(
      'INSERT INTO purchases (supplier_id,reference_number,total_cost,purchase_date,notes,created_by,created_at) VALUES (?,?,?,?,?,?,NOW())',
      [supplier_id || null, reference_number || null, total_cost, purchase_date || new Date(), notes || null, req.user.id]
    );
    const purchaseId = r.insertId;

    for (const item of items) {
      const { product_id, product_variant_id, quantity, unit_cost } = item;
      const subtotal = Number(quantity) * Number(unit_cost);

      await conn.query(
        'INSERT INTO purchase_items (purchase_id,product_id,product_variant_id,quantity,unit_cost,subtotal) VALUES (?,?,?,?,?,?)',
        [purchaseId, product_id, product_variant_id || null, quantity, unit_cost, subtotal]
      );

      if (product_variant_id) {
        await conn.query('UPDATE product_variants SET stock_quantity=stock_quantity+? WHERE id=?', [quantity, product_variant_id]);
        const [v] = await conn.query('SELECT stock_quantity,minimum_stock FROM product_variants WHERE id=?', [product_variant_id]);
        if (v.length) await conn.query('UPDATE product_variants SET status=? WHERE id=?', [determineStatus(v[0].stock_quantity, v[0].minimum_stock), product_variant_id]);
        // Aggregate variant stock back to the product row so all admin modules stay in sync
        const [agg] = await conn.query(
          'SELECT COALESCE(SUM(stock_quantity),0) AS total, COALESCE(MIN(minimum_stock),5) AS min_stk FROM product_variants WHERE product_id=?',
          [product_id]
        );
        await conn.query('UPDATE products SET stock_quantity=?,status=? WHERE id=?',
          [agg[0].total, determineStatus(agg[0].total, agg[0].min_stk), product_id]);
      } else {
        await conn.query('UPDATE products SET stock_quantity=stock_quantity+? WHERE id=?', [quantity, product_id]);
        const [p] = await conn.query('SELECT stock_quantity,minimum_stock FROM products WHERE id=?', [product_id]);
        if (p.length) await conn.query('UPDATE products SET status=? WHERE id=?', [determineStatus(p[0].stock_quantity, p[0].minimum_stock), product_id]);
      }

      await conn.query(
        'INSERT INTO stock_transactions (product_id,product_variant_id,quantity,transaction_type,notes,created_by,transaction_date,created_at) VALUES (?,?,?,?,?,?,NOW(),NOW())',
        [product_id, product_variant_id || null, quantity, 'IN', `Purchase #${purchaseId}`, req.user.id]
      );
    }

    await conn.commit();
    res.status(201).json({ id: purchaseId, message: 'Purchase recorded' });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ message: e.message || 'Could not record purchase' });
  } finally { conn.release(); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM purchase_items WHERE purchase_id=?', [req.params.id]);
    await pool.query('DELETE FROM purchases WHERE id=?', [req.params.id]);
    res.json({ message: 'Purchase deleted' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not delete purchase' }); }
});

// ── Return items to supplier ───────────────────────────────────────────────────
router.post('/:id/return', async (req, res) => {
  const { items, notes } = req.body;
  if (!items?.length) return res.status(400).json({ message: 'Return items are required' });

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const totalCost = items.reduce((s, i) => s + Number(i.unit_cost || 0) * Number(i.quantity || 0), 0);
    const [r] = await conn.query(
      'INSERT INTO purchase_returns (purchase_id,notes,total_returned_cost,created_by,created_at) VALUES (?,?,?,?,NOW())',
      [req.params.id, notes || null, totalCost, req.user.id]
    );
    const returnId = r.insertId;

    for (const item of items) {
      const { product_id, product_variant_id, quantity, unit_cost } = item;
      const qty = Number(quantity);
      if (!qty || !product_id) continue;

      await conn.query(
        'INSERT INTO purchase_return_items (return_id,product_id,product_variant_id,quantity,unit_cost,subtotal) VALUES (?,?,?,?,?,?)',
        [returnId, product_id, product_variant_id || null, qty, Number(unit_cost || 0), qty * Number(unit_cost || 0)]
      );

      if (product_variant_id) {
        await conn.query('UPDATE product_variants SET stock_quantity=GREATEST(0,stock_quantity-?) WHERE id=?', [qty, product_variant_id]);
        const [v] = await conn.query('SELECT stock_quantity,minimum_stock FROM product_variants WHERE id=?', [product_variant_id]);
        if (v.length) await conn.query('UPDATE product_variants SET status=? WHERE id=?', [determineStatus(v[0].stock_quantity, v[0].minimum_stock), product_variant_id]);
        const [agg] = await conn.query('SELECT COALESCE(SUM(stock_quantity),0) AS total,COALESCE(MIN(minimum_stock),5) AS min_stk FROM product_variants WHERE product_id=?', [product_id]);
        await conn.query('UPDATE products SET stock_quantity=?,status=? WHERE id=?', [agg[0].total, determineStatus(agg[0].total, agg[0].min_stk), product_id]);
      } else {
        await conn.query('UPDATE products SET stock_quantity=GREATEST(0,stock_quantity-?) WHERE id=?', [qty, product_id]);
        const [p] = await conn.query('SELECT stock_quantity,minimum_stock FROM products WHERE id=?', [product_id]);
        if (p.length) await conn.query('UPDATE products SET status=? WHERE id=?', [determineStatus(p[0].stock_quantity, p[0].minimum_stock), product_id]);
      }

      await conn.query(
        'INSERT INTO stock_transactions (product_id,product_variant_id,quantity,transaction_type,notes,created_by,transaction_date,created_at) VALUES (?,?,?,?,?,?,NOW(),NOW())',
        [product_id, product_variant_id || null, -qty, 'RETURN_OUT', `Return to supplier — Purchase #${req.params.id}`, req.user.id]
      );
    }

    await conn.commit();
    res.status(201).json({ id: returnId, message: 'Return recorded, stock reduced' });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ message: e.message || 'Could not record return' });
  } finally { conn.release(); }
});

export default router;
