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
      `SELECT p.*, s.name AS supplier_name, u.name AS created_by_name
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
      `SELECT p.*, s.name AS supplier_name, u.name AS created_by_name
       FROM purchases p
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       LEFT JOIN users u ON u.id = p.created_by
       WHERE p.id=?`,
      [req.params.id]
    );
    if (!pRows.length) return res.status(404).json({ message: 'Purchase not found' });
    const purchase = pRows[0];
    const [items] = await pool.query(
      `SELECT pi.*, pr.name AS product_name, pr.sku AS product_sku,
              pv.color AS variant_color, pv.size AS variant_size, pv.sku AS variant_sku
       FROM purchase_items pi
       JOIN products pr ON pr.id = pi.product_id
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

export default router;
