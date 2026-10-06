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

function bad(message) { const e = new Error(message); e.statusCode = 400; return e; }

// Race-safe reference numbers via the sequences table (row-locked until commit)
async function nextSequence(conn, name) {
  await conn.query('INSERT IGNORE INTO sequences (name, last_number) VALUES (?, 0)', [name]);
  await conn.query('UPDATE sequences SET last_number = last_number + 1 WHERE name = ?', [name]);
  const [[row]] = await conn.query('SELECT last_number FROM sequences WHERE name = ?', [name]);
  return Number(row?.last_number) || 1;
}

const PAYMENT_METHODS = ['MTN', 'Airtel', 'Card', 'Cash'];
const FULFILLMENT_TYPES = ['Delivery', 'Pickup'];

// ── Public checkout ───────────────────────────────────────────────────────────
// Client sends only product_id / product_variant_id / quantity — every price,
// cost and stock figure is read server-side under row locks.
router.post('/', async (req, res) => {
  const {
    customer = {}, items, fulfillment_type = 'Delivery',
    delivery_fee = 0, discount = 0, tax = 0,
    payment_method = 'Cash', delivery_instructions = null, notes = null,
  } = req.body || {};

  const name = String(customer.name || '').trim();
  const phone = String(customer.phone || '').trim();
  if (!name) return res.status(400).json({ message: 'Customer name is required' });
  if (!phone) return res.status(400).json({ message: 'Customer phone is required' });
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: 'Order items are required' });

  const fulfillment = FULFILLMENT_TYPES.includes(fulfillment_type) ? fulfillment_type : 'Delivery';
  const payMethod = PAYMENT_METHODS.includes(payment_method) ? payment_method : 'Cash';

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    // ── Customer upsert (matched on unique phone) ──
    const email = String(customer.email || '').trim() || null;
    const province = String(customer.province || '').trim() || null;
    const district = String(customer.district || '').trim() || null;
    const sector = String(customer.sector || '').trim() || null;
    const address_details = String(customer.address_details || '').trim() || null;

    let customerId;
    const [existing] = await conn.query('SELECT id FROM customers WHERE phone = ? LIMIT 1', [phone]);
    if (existing.length) {
      customerId = existing[0].id;
      await conn.query(
        'UPDATE customers SET name=?, email=?, province=?, district=?, sector=?, address_details=? WHERE id=?',
        [name, email, province, district, sector, address_details, customerId]
      );
    } else {
      try {
        const [r] = await conn.query(
          'INSERT INTO customers (name, phone, email, province, district, sector, address_details) VALUES (?,?,?,?,?,?,?)',
          [name, phone, email, province, district, sector, address_details]
        );
        customerId = r.insertId;
      } catch (dup) {
        if (dup.code !== 'ER_DUP_ENTRY') throw dup;
        const [again] = await conn.query('SELECT id FROM customers WHERE phone = ? LIMIT 1', [phone]);
        customerId = again[0].id;
      }
    }

    // ── Order shell (totals + stock flags filled in below) ──
    const year = new Date().getFullYear();
    const orderSeq = await nextSequence(conn, 'ORD');
    const orderNumber = `ORD-${year}-${String(orderSeq).padStart(4, '0')}`;
    const [orderResult] = await conn.query(
      `INSERT INTO orders (order_number, customer_id, fulfillment_type, status, payment_status,
         customer_name, customer_phone, customer_email, province, district, sector, address_details,
         delivery_instructions, subtotal, delivery_fee, discount, tax, total_amount, stock_deducted, notes)
       VALUES (?,?,?, 'Pending','Pending', ?,?,?,?,?,?,?,?,?,?,?,?,?,0,?)`,
      [orderNumber, customerId, fulfillment, name, phone, email, province, district, sector,
       address_details, delivery_instructions || null, 0, Math.max(0, Number(delivery_fee) || 0),
       Math.max(0, Number(discount) || 0), Math.max(0, Number(tax) || 0), 0, notes || null]
    );
    const orderId = orderResult.insertId;

    // ── Items: lock → validate → price → deduct ──
    let subtotal = 0;
    for (const item of items) {
      const productId = Number(item.product_id);
      const variantId = item.product_variant_id ? Number(item.product_variant_id) : null;
      const qty = Number(item.quantity);
      if (!productId) throw bad('Each item needs a product_id');
      if (!Number.isInteger(qty) || qty < 1 || qty > 10000) throw bad('Item quantity must be between 1 and 10000');

      let unitPrice, unitCost, productName, sku, variantLabel, before, after, minStock;

      if (variantId) {
        const [vr] = await conn.query(
          `SELECT pv.*, p.name AS product_name, p.sku AS product_sku
           FROM product_variants pv JOIN products p ON p.id = pv.product_id
           WHERE pv.id = ? AND pv.product_id = ? FOR UPDATE`,
          [variantId, productId]
        );
        if (!vr.length) throw bad(`Variant ${variantId} not found for product ${productId}`);
        const v = vr[0];
        if (!Number(v.is_active)) throw bad(`"${v.product_name}" variant is no longer available`);
        if (Number(v.stock_quantity) < qty) throw bad(`Insufficient stock for "${v.product_name}" (${v.stock_quantity} left)`);
        unitPrice = Number(v.selling_price);
        unitCost = Number(v.cost_price);
        productName = v.product_name;
        sku = v.sku || v.product_sku;
        variantLabel = [v.color, v.size, v.unit].filter(Boolean).join(' / ') || null;
        before = Number(v.stock_quantity);
        after = before - qty;
        minStock = Number(v.minimum_stock);
        await conn.query('UPDATE product_variants SET stock_quantity=?, status=? WHERE id=?',
          [after, determineStatus(after, minStock), variantId]);
        const [agg] = await conn.query(
          'SELECT COALESCE(SUM(stock_quantity),0) AS total, COALESCE(MIN(minimum_stock),5) AS min_stk FROM product_variants WHERE product_id=?',
          [productId]
        );
        await conn.query('UPDATE products SET stock_quantity=?, status=? WHERE id=?',
          [agg[0].total, determineStatus(agg[0].total, agg[0].min_stk), productId]);
      } else {
        const [pr] = await conn.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [productId]);
        if (!pr.length) throw bad(`Product ${productId} not found`);
        const p = pr[0];
        const [vCount] = await conn.query(
          'SELECT COUNT(*) AS n FROM product_variants WHERE product_id = ? AND is_active = 1', [productId]);
        if (Number(vCount[0].n) > 0) throw bad(`"${p.name}" has variants — please select one`);
        if (Number(p.stock_quantity) < qty) throw bad(`Insufficient stock for "${p.name}" (${p.stock_quantity} left)`);
        unitPrice = Number(p.selling_price);
        unitCost = Number(p.cost_price);
        productName = p.name;
        sku = p.sku;
        variantLabel = null;
        before = Number(p.stock_quantity);
        after = before - qty;
        minStock = Number(p.minimum_stock);
        await conn.query('UPDATE products SET stock_quantity=?, status=? WHERE id=?',
          [after, determineStatus(after, minStock), productId]);
      }

      const lineSubtotal = unitPrice * qty;
      subtotal += lineSubtotal;
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_variant_id, product_name, variant_label, sku,
           unit_price, unit_cost, quantity, subtotal)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [orderId, productId, variantId, productName, variantLabel, sku, unitPrice, unitCost, qty, lineSubtotal]
      );
      await conn.query(
        `INSERT INTO stock_transactions
           (product_id, product_variant_id, quantity, transaction_type, reference_type, reference_id,
            stock_before, stock_after, notes, transaction_date, created_at)
         VALUES (?,?,?, 'ONLINE_ORDER','ORDER', ?,?,?,?,NOW(),NOW())`,
        [productId, variantId, -qty, orderId, before, after, `Order ${orderNumber}`]
      );

      // Threshold-crossing alert (only when the status actually changes)
      const newStatus = determineStatus(after, minStock);
      if (newStatus !== determineStatus(before, minStock)) {
        await conn.query(
          `INSERT INTO notifications (type, title, body, reference_type, reference_id)
           VALUES (?,?,?,'product',?)`,
          [newStatus === 'Out of Stock' ? 'out_of_stock' : 'low_stock',
           `${newStatus}: ${productName}`,
           `Stock is now ${after} after order ${orderNumber}.`, productId]
        );
      }
    }

    // ── Totals (discount clamped so the total can never go negative) ──
    const fee = Math.max(0, Number(delivery_fee) || 0);
    const disc = Math.min(Math.max(0, Number(discount) || 0), subtotal + fee);
    const taxAmt = Math.max(0, Number(tax) || 0);
    const total = Math.max(0, subtotal + fee - disc + taxAmt);
    await conn.query(
      'UPDATE orders SET subtotal=?, delivery_fee=?, discount=?, tax=?, total_amount=?, stock_deducted=1 WHERE id=?',
      [subtotal, fee, disc, taxAmt, total, orderId]
    );

    // ── Payment intent ──
    const paySeq = await nextSequence(conn, 'PAY');
    const paymentReference = `PAY-${year}-${String(paySeq).padStart(4, '0')}`;
    await conn.query(
      `INSERT INTO payments (payment_reference, order_id, provider, payment_method, amount, currency, status)
       VALUES (?,?,?,?,?, 'RWF','Pending')`,
      [paymentReference, orderId, payMethod === 'Cash' ? 'Cash' : 'IremboPay', payMethod, total]
    );

    // ── Admin alert ──
    await conn.query(
      `INSERT INTO notifications (type, title, body, reference_type, reference_id)
       VALUES ('new_order', ?, ?, 'order', ?)`,
      [`New order ${orderNumber}`, `${name} — ${items.length} item(s), RWF ${total.toLocaleString('en-US')}`, orderId]
    );

    await conn.commit();
    res.status(201).json({
      id: orderId,
      order_number: orderNumber,
      payment_reference: paymentReference,
      payment_status: 'Pending',
      total_amount: total,
      message: 'Order placed successfully',
    });
  } catch (e) {
    await conn.rollback();
    console.error('checkout failed:', e.message, '\nSQL:', e.sql || '(none)');
    res.status(e.statusCode || 500).json({ message: e.message || 'Could not place order' });
  } finally {
    conn.release();
  }
});

// ── Public tracking (phone-gated to prevent enumeration) ─────────────────────
router.get('/track', async (req, res) => {
  const { order_number, phone } = req.query;
  if (!order_number || !phone) {
    return res.status(400).json({ message: 'order_number and phone are required' });
  }
  try {
    const [rows] = await pool.query(
      `SELECT id, order_number, status, payment_status, fulfillment_type, total_amount, currency, placed_at
       FROM orders WHERE order_number = ? AND customer_phone = ? LIMIT 1`,
      [order_number, String(phone).trim()]
    );
    if (!rows.length) return res.status(404).json({ message: 'Order not found' });
    const [orderItems] = await pool.query(
      'SELECT product_name, variant_label, quantity, subtotal FROM order_items WHERE order_id = ?',
      [rows[0].id]
    );
    res.json({ ...rows[0], items: orderItems });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch order' }); }
});

// ── Admin: list ───────────────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  const { status, payment_status, q } = req.query;
  let sql = `SELECT o.*, (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
             FROM orders o`;
  const params = [], filters = [];
  if (status) { filters.push('o.status = ?'); params.push(status); }
  if (payment_status) { filters.push('o.payment_status = ?'); params.push(payment_status); }
  if (q) {
    filters.push('(o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (filters.length) sql += ' WHERE ' + filters.join(' AND ');
  sql += ' ORDER BY o.placed_at DESC, o.id DESC';
  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch orders' }); }
});

// ── Admin: detail ─────────────────────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Order not found' });
    const order = rows[0];
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC', [order.id]);
    const [payments] = await pool.query('SELECT * FROM payments WHERE order_id = ? ORDER BY id ASC', [order.id]);
    order.items = items;
    order.payments = payments;
    res.json(order);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch order' }); }
});

// ── Lifecycle ─────────────────────────────────────────────────────────────────
const ALLOWED_TRANSITIONS = {
  'Pending':          ['Confirmed', 'Cancelled'],
  'Confirmed':        ['Processing', 'Ready for Pickup', 'Out for Delivery', 'Completed', 'Cancelled'],
  'Processing':       ['Ready for Pickup', 'Out for Delivery', 'Completed', 'Cancelled'],
  'Ready for Pickup': ['Completed', 'Cancelled'],
  'Out for Delivery': ['Completed', 'Cancelled'],
  'Completed':        ['Cancelled'],
  'Cancelled':        [],
};

// Creates the unified-ledger sale row when an order completes. Stock is NOT
// touched here — it was already deducted exactly once at checkout.
async function linkSaleForOrder(conn, order, userId) {
  if (order.linked_sale_id) return order.linked_sale_id;
  const year = new Date().getFullYear();
  const [[maxRow]] = await conn.query(
    "SELECT MAX(CAST(SUBSTRING_INDEX(invoice_number, '-', -1) AS UNSIGNED)) AS max_num FROM sales WHERE invoice_number LIKE ?",
    [`INV-${year}-%`]
  );
  const nextNum = (Number(maxRow?.max_num) || 0) + 1;
  const invoiceNumber = `INV-${year}-${String(nextNum).padStart(4, '0')}`;

  const [[payRow]] = await conn.query(
    'SELECT payment_method FROM payments WHERE order_id = ? ORDER BY id ASC LIMIT 1', [order.id]);
  const pm = payRow?.payment_method;
  const saleMethod = pm === 'Cash' ? 'Cash' : (pm === 'Card' ? 'Bank Transfer' : 'Mobile Money');

  const [sale] = await conn.query(
    `INSERT INTO sales (invoice_number, total_amount, payment_method, customer_name, customer_id,
        order_id, sales_channel, sold_by, sale_date, created_at)
     VALUES (?,?,?,?,?,?, 'Online', ?, NOW(), NOW())`,
    [invoiceNumber, order.total_amount, saleMethod, order.customer_name, order.customer_id,
     order.id, userId]
  );

  const [oitems] = await conn.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  for (const it of oitems) {
    await conn.query(
      `INSERT INTO sale_items (sale_id, product_id, product_variant_id, quantity, unit_price, cost_price, subtotal)
       VALUES (?,?,?,?,?,?,?)`,
      [sale.insertId, it.product_id, it.product_variant_id, it.quantity,
       it.unit_price, it.unit_cost, it.subtotal]
    );
  }
  await conn.query('UPDATE orders SET linked_sale_id = ? WHERE id = ?', [sale.insertId, order.id]);
  return sale.insertId;
}

// Restores stock exactly once when a cancelled order had stock deducted
async function restoreStock(conn, orderId, orderNumber) {
  const [items] = await conn.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
  for (const it of items) {
    if (it.product_variant_id) {
      const [v] = await conn.query('SELECT stock_quantity, minimum_stock FROM product_variants WHERE id = ?', [it.product_variant_id]);
      if (!v.length) continue;
      const before = Number(v[0].stock_quantity);
      const after = before + Number(it.quantity);
      await conn.query('UPDATE product_variants SET stock_quantity=?, status=? WHERE id=?',
        [after, determineStatus(after, v[0].minimum_stock), it.product_variant_id]);
      const [agg] = await conn.query(
        'SELECT COALESCE(SUM(stock_quantity),0) AS total, COALESCE(MIN(minimum_stock),5) AS min_stk FROM product_variants WHERE product_id=?',
        [it.product_id]);
      await conn.query('UPDATE products SET stock_quantity=?, status=? WHERE id=?',
        [agg[0].total, determineStatus(agg[0].total, agg[0].min_stk), it.product_id]);
      await conn.query(
        `INSERT INTO stock_transactions
           (product_id, product_variant_id, quantity, transaction_type, reference_type, reference_id,
            stock_before, stock_after, notes, transaction_date, created_at)
         VALUES (?,?,?, 'IN','ORDER',?,?,?,?,NOW(),NOW())`,
        [it.product_id, it.product_variant_id, it.quantity, orderId, before, after,
         `Stock restored — order ${orderNumber} cancelled`]
      );
    } else {
      const [p] = await conn.query('SELECT stock_quantity, minimum_stock FROM products WHERE id = ?', [it.product_id]);
      if (!p.length) continue;
      const before = Number(p[0].stock_quantity);
      const after = before + Number(it.quantity);
      await conn.query('UPDATE products SET stock_quantity=?, status=? WHERE id=?',
        [after, determineStatus(after, p[0].minimum_stock), it.product_id]);
      await conn.query(
        `INSERT INTO stock_transactions
           (product_id, product_variant_id, quantity, transaction_type, reference_type, reference_id,
            stock_before, stock_after, notes, transaction_date, created_at)
         VALUES (?,?,?, 'IN','ORDER',?,?,?,?,NOW(),NOW())`,
        [it.product_id, null, it.quantity, orderId, before, after,
         `Stock restored — order ${orderNumber} cancelled`]
      );
    }
  }
}




// ── Admin: status transition ──────────────────────────────────────────────────
router.patch('/:id/status', authMiddleware, async (req, res) => {
  const { status, notes } = req.body || {};
  if (!status) return res.status(400).json({ message: 'status is required' });

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const [rows] = await conn.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!rows.length) { await conn.rollback(); return res.status(404).json({ message: 'Order not found' }); }
    const order = rows[0];

    if (order.status === status) {
      await conn.commit();
      return res.json({ message: 'Order status unchanged', status: order.status });
    }
    const allowed = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      await conn.rollback();
      return res.status(400).json({ message: `Cannot move order from "${order.status}" to "${status}"` });
    }

    let linkedSaleId = order.linked_sale_id;
    let confirmedBy = order.confirmed_by;

    if (status === 'Cancelled') {
      // Restore stock exactly once
      if (Number(order.stock_deducted)) {
        await restoreStock(conn, order.id, order.order_number);
        await conn.query('UPDATE orders SET stock_deducted = 0 WHERE id = ?', [order.id]);
      }
      // Void unpaid payment intents; Paid/Refunded stay for manual handling
      await conn.query(
        "UPDATE payments SET status='Cancelled' WHERE order_id = ? AND status IN ('Pending','Processing')",
        [order.id]
      );
      if (['Pending', 'Processing'].includes(order.payment_status)) {
        await conn.query("UPDATE orders SET payment_status='Cancelled' WHERE id = ?", [order.id]);
      }
      // Retire the unified-ledger sale (no stock ops here — handled above)
      if (order.linked_sale_id) {
        await conn.query("UPDATE sales SET status='Cancelled' WHERE id = ? AND status <> 'Cancelled'", [order.linked_sale_id]);
      }
    }

    if (status === 'Confirmed' && !confirmedBy) confirmedBy = req.user.id;
    if (status === 'Completed') linkedSaleId = await linkSaleForOrder(conn, order, req.user.id);

    await conn.query(
      'UPDATE orders SET status=?, confirmed_by=?, linked_sale_id=?, notes=? WHERE id=?',
      [status, confirmedBy, linkedSaleId, notes !== undefined && notes !== null ? notes : order.notes, order.id]
    );

    await conn.commit();
    const [updated] = await pool.query('SELECT * FROM orders WHERE id = ?', [order.id]);
    res.json({ message: `Order ${status.toLowerCase()}`, order: updated[0] });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ message: e.message || 'Could not update order status' });
  } finally {
    conn.release();
  }
});

export default router;


