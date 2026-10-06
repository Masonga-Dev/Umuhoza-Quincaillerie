/**
 * Phase 3 verification — orders / customers / payments / notifications.
 * Usage: node orchestrate-phase3.mjs   (spawns server + runs this)
 *        node verify-phase3.mjs        (server must already be running)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const BASE = `http://localhost:${process.env.PORT || 4000}`;
const pass = [], warn = [], fail = [];
const ok = (m) => pass.push(m), bad = (m) => fail.push(m), note = (m) => warn.push(m);
const writeReport = (txt) => { try { fs.writeFileSync(path.join(__dirname, 'phase3-report.txt'), txt); } catch {} };
process.on('uncaughtException', (e) => { writeReport('CRASH: ' + e.stack); process.exit(1); });
process.on('unhandledRejection', (e) => { writeReport('CRASH: ' + (e?.stack || e)); process.exit(1); });

const jwt = (await import('jsonwebtoken')).default;
const token = jwt.sign(
  { id: 1, name: 'Phase3 Verify', email: 'p3@verify.rw', role: 'admin' },
  process.env.JWT_SECRET, { expiresIn: '15m' }
);
const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

const J = async (url, opts = {}) => {
  const r = await fetch(BASE + url, { ...opts, headers: { ...(opts.headers || {}) } });
  const text = await r.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  return { status: r.status, body };
};

const conn = await mysql.createConnection({
  host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, port: Number(process.env.DB_PORT) || 3306,
  ...(process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && { ssl: { rejectUnauthorized: false } }),
});

const PHONE = '0788000003';
const cleanup = { orders: [], sales: [], paymentEvents: [], notifications: [], customer: null, stockTx: [] };
let orderA = null, orderB = null, V = null;
let variantStockBefore = 0, productStockBefore = 0;

// ── 0. pick a variant-backed product with stock ────────────────────────────────
{
  const [pick] = await conn.query(
    `SELECT pv.id AS variant_id, pv.product_id, pv.stock_quantity, pv.selling_price, p.stock_quantity AS product_stock
     FROM product_variants pv JOIN products p ON p.id = pv.product_id
     WHERE pv.is_active = 1 AND pv.stock_quantity >= 3
     ORDER BY pv.product_id LIMIT 1`
  );
  if (!pick.length) { bad('no active variant with stock >= 3 available for testing'); }
  else {
    V = pick[0];
    variantStockBefore = Number(V.stock_quantity);
    productStockBefore = Number(V.product_stock);
    note(`test variant ${V.variant_id} (product ${V.product_id}) stock=${variantStockBefore}`);
  }
}

// ── 1. checkout: server-side pricing + stock deduction ─────────────────────────
if (V) {
  const create = await J('/api/orders', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: { name: 'Phase3 Verify', phone: PHONE, email: 'p3@verify.rw',
                  province: 'Kigali', district: 'Gasabo', sector: 'Kacyiru', address_details: 'Test Ave 1' },
      items: [{ product_id: V.product_id, product_variant_id: V.variant_id, quantity: 1, unit_price: 1 }],
      fulfillment_type: 'Delivery', delivery_fee: 2000, discount: 500, tax: 0, payment_method: 'MTN',
    }),
  });
  if (create.status !== 201) bad(`checkout => ${create.status}: ${JSON.stringify(create.body)}`);
  else {
    ok('checkout => 201');
    orderA = create.body;
    cleanup.orders.push(orderA.id);
    /^ORD-\d{4}-\d{4,}$/.test(orderA.order_number) ? ok(`order_number ${orderA.order_number}`) : bad(`bad order_number: ${orderA.order_number}`);
    /^PAY-\d{4}-\d{4,}$/.test(orderA.payment_reference) ? ok(`payment_reference ${orderA.payment_reference}`) : bad(`bad payment_reference: ${orderA.payment_reference}`);
    Number(orderA.total_amount) === Number(V.selling_price) + 2000 - 500
      ? ok(`total computed server-side (${orderA.total_amount} = ${V.selling_price} + 2000 - 500)`)
      : bad(`total mismatch: got ${orderA.total_amount}, expected ${Number(V.selling_price) + 1500}`);
  }
}

// ── 2. DB state after checkout ─────────────────────────────────────────────────
if (orderA?.id && V) {
  const [[ord]] = await conn.query('SELECT * FROM orders WHERE id=?', [orderA.id]);
  Number(ord.stock_deducted) === 1 ? ok('stock_deducted=1') : bad(`stock_deducted=${ord.stock_deducted}`);
  Number(ord.subtotal) === Number(V.selling_price)
    ? ok('subtotal ignores client unit_price (server-priced)')
    : bad(`subtotal=${ord.subtotal} but variant price=${V.selling_price}`);

  const [[cust]] = await conn.query('SELECT id FROM customers WHERE phone=?', [PHONE]);
  if (cust) { cleanup.customer = cust.id; ok('customer upserted'); } else bad('customer not created');

  const [[vs]] = await conn.query('SELECT stock_quantity FROM product_variants WHERE id=?', [V.variant_id]);
  Number(vs.stock_quantity) === variantStockBefore - 1
    ? ok(`variant stock deducted once (${variantStockBefore} → ${vs.stock_quantity})`)
    : bad(`variant stock=${vs.stock_quantity}, expected ${variantStockBefore - 1}`);

  const [[ps]] = await conn.query('SELECT stock_quantity FROM products WHERE id=?', [V.product_id]);
  Number(ps.stock_quantity) === productStockBefore - 1
    ? ok('product aggregate stock synced')
    : bad(`product stock=${ps.stock_quantity}, expected ${productStockBefore - 1}`);

  const [stx] = await conn.query(
    `SELECT * FROM stock_transactions WHERE reference_type='ORDER' AND reference_id=? AND transaction_type='ONLINE_ORDER'`, [orderA.id]);
  if (stx.length) {
    ok('ONLINE_ORDER stock transaction with ORDER reference');
    Number(stx[0].stock_after) === Number(stx[0].stock_before) - 1
      ? ok('stock_before/stock_after recorded correctly') : bad(`before/after wrong: ${stx[0].stock_before}→${stx[0].stock_after}`);
    stx.forEach(t => cleanup.stockTx.push(t.id));
  } else bad('missing ONLINE_ORDER stock transaction');

  const [pay] = await conn.query('SELECT * FROM payments WHERE order_id=?', [orderA.id]);
  pay.length === 1 && pay[0].status === 'Pending' && pay[0].payment_method === 'MTN'
    ? ok(`payment intent created (${pay[0].payment_reference}, Pending, MTN)`) : bad(`payments for order: ${JSON.stringify(pay.map(p=>[p.payment_reference,p.status]))}`);

  const [notif] = await conn.query(
    "SELECT * FROM notifications WHERE reference_type='order' AND reference_id=? AND type='new_order'", [orderA.id]);
  notif.length ? ok('new_order notification created') : bad('missing new_order notification');
}

// ── 3. public tracking: phone-gated ────────────────────────────────────────────
if (orderA) {
  const t1 = await J(`/api/orders/track?order_number=${orderA.order_number}&phone=${PHONE}`);
  t1.status === 200 && Array.isArray(t1.body?.items) && t1.body.items.length === 1
    ? ok('tracking with correct phone => 200 + items') : bad(`tracking => ${t1.status}: ${JSON.stringify(t1.body)}`);
  const t2 = await J(`/api/orders/track?order_number=${orderA.order_number}&phone=0000000000`);
  t2.status === 404 ? ok('tracking with wrong phone => 404 (no enumeration)') : bad(`wrong-phone tracking => ${t2.status}`);
}


// ── 4. lifecycle: invalid transition, confirm, complete → linked sale ──────────
if (orderA) {
  const skip = await J(`/api/orders/${orderA.id}/status`, { method: 'PATCH', headers: H, body: JSON.stringify({ status: 'Completed' }) });
  skip.status === 400 ? ok('invalid transition Pending → Completed => 400') : bad(`Pending → Completed => ${skip.status}`);

  const conf = await J(`/api/orders/${orderA.id}/status`, { method: 'PATCH', headers: H, body: JSON.stringify({ status: 'Confirmed' }) });
  conf.status === 200 ? ok('transition Pending → Confirmed') : bad(`confirm => ${conf.status}: ${JSON.stringify(conf.body)}`);

  const stockBeforeComplete = await conn.query('SELECT stock_quantity FROM product_variants WHERE id=?', [V.variant_id]);

  const comp = await J(`/api/orders/${orderA.id}/status`, { method: 'PATCH', headers: H, body: JSON.stringify({ status: 'Completed' }) });
  if (comp.status !== 200) bad(`complete => ${comp.status}: ${JSON.stringify(comp.body)}`);
  else {
    ok('transition Confirmed → Completed');
    const [[ord2]] = await conn.query('SELECT * FROM orders WHERE id=?', [orderA.id]);
    if (ord2.linked_sale_id) {
      cleanup.sales.push(ord2.linked_sale_id);
      const [[sale]] = await conn.query('SELECT * FROM sales WHERE id=?', [ord2.linked_sale_id]);
      sale.sales_channel === 'Online' && Number(sale.order_id) === orderA.id
        ? ok(`linked sale created (invoice ${sale.invoice_number}, channel Online)`)
        : bad(`linked sale wrong: channel=${sale.sales_channel} order_id=${sale.order_id}`);
      const [sitems] = await conn.query('SELECT * FROM sale_items WHERE sale_id=?', [ord2.linked_sale_id]);
      sitems.length === 1 ? ok('sale_items copied from order_items') : bad(`sale_items count=${sitems.length}`);
    } else bad('no linked_sale_id after completion');

    const [[vs2]] = await conn.query('SELECT stock_quantity FROM product_variants WHERE id=?', [V.variant_id]);
    Number(vs2.stock_quantity) === Number(stockBeforeComplete[0][0].stock_quantity)
      ? ok('completion did NOT re-deduct stock (deducted once at checkout)')
      : bad(`stock changed on completion: ${stockBeforeComplete[0][0].stock_quantity} → ${vs2.stock_quantity}`);
  }

  const back = await J(`/api/orders/${orderA.id}/status`, { method: 'PATCH', headers: H, body: JSON.stringify({ status: 'Confirmed' }) });
  back.status === 400 ? ok('invalid transition Completed → Confirmed => 400') : bad(`Completed → Confirmed => ${back.status}`);
}


// ── 5. payment webhook: success + idempotent replay ────────────────────────────
if (V) {
  // second order so checkout/webhook paths each run once
  const create2 = await J('/api/orders', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: { name: 'Phase3 Verify', phone: PHONE },
      items: [{ product_id: V.product_id, product_variant_id: V.variant_id, quantity: 1 }],
      payment_method: 'Cash', fulfillment_type: 'Pickup',
    }),
  });
  if (create2.status !== 201) bad(`second checkout => ${create2.status}`);
  else { orderB = create2.body; cleanup.orders.push(orderB.id); ok('second checkout (Cash/Pickup) => 201'); }

  if (orderB) {
    const wh = await J('/api/payments/webhook', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_reference: orderB.payment_reference, status: 'Paid',
        provider_transaction_id: 'TEST-TXN-P3-1', event_type: 'payment.success' }),
    });
    wh.status === 200 ? ok('webhook Paid => 200') : bad(`webhook => ${wh.status}: ${JSON.stringify(wh.body)}`);

    const [[ordB]] = await conn.query('SELECT payment_status FROM orders WHERE id=?', [orderB.id]);
    ordB.payment_status === 'Paid' ? ok('order payment_status mirrored to Paid') : bad(`order payment_status=${ordB.payment_status}`);
    const [[paid]] = await conn.query('SELECT * FROM payments WHERE payment_reference=?', [orderB.payment_reference]);
    paid.status === 'Paid' && paid.paid_at && paid.verified_at
      ? ok('payment marked Paid with paid_at + verified_at') : bad(`payment row: status=${paid.status} paid_at=${paid.paid_at}`);

    // replay must not change anything (idempotency)
    const replay = await J('/api/payments/webhook', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_reference: orderB.payment_reference, status: 'Failed',
        provider_transaction_id: 'TEST-TXN-P3-1', event_type: 'payment.failed' }),
    });
    replay.status === 200 ? ok('replayed webhook => 200 (acknowledged)') : bad(`replay => ${replay.status}`);
    const [[after]] = await conn.query('SELECT status FROM payments WHERE payment_reference=?', [orderB.payment_reference]);
    after.status === 'Paid'
      ? ok('idempotency: terminal Paid not downgraded by replayed Failed event')
      : bad(`idempotency broken: status=${after.status}`);

    const [events] = await conn.query('SELECT * FROM payment_events WHERE payment_reference=?', [orderB.payment_reference]);
    events.length >= 2 ? ok(`payment_events audit trail (${events.length} rows)`) : bad(`payment_events=${events.length}`);
    cleanup.paymentEvents.push(...events.map(e => e.id));

    // public status poll
    const poll = await J(`/api/payments/${orderB.payment_reference}/status`);
    poll.status === 200 && poll.body.status === 'Paid'
      ? ok('public payment status poll => 200/Paid') : bad(`poll => ${poll.status}: ${JSON.stringify(poll.body)}`);
  }
}


// ── 6. cancellation restores stock exactly once ────────────────────────────────
if (orderA && V) {
  const [[stockNow]] = await conn.query('SELECT stock_quantity FROM product_variants WHERE id=?', [V.variant_id]);
  const expectedAfterCancels = variantStockBefore; // both test orders cancelled → fully restored
  const [[inv]] = await conn.query('SELECT linked_sale_id FROM orders WHERE id=?', [orderA.id]);

  const cancel = await J(`/api/orders/${orderA.id}/status`, { method: 'PATCH', headers: H, body: JSON.stringify({ status: 'Cancelled' }) });
  cancel.status === 200 ? ok('transition Completed → Cancelled') : bad(`cancel => ${cancel.status}: ${JSON.stringify(cancel.body)}`);

  const [[ordC]] = await conn.query('SELECT stock_deducted FROM orders WHERE id=?', [orderA.id]);
  Number(ordC.stock_deducted) === 0 ? ok('stock_deducted reset to 0 after cancel') : bad(`stock_deducted=${ordC.stock_deducted}`);

  if (inv.linked_sale_id) {
    const [[saleC]] = await conn.query('SELECT status FROM sales WHERE id=?', [inv.linked_sale_id]);
    saleC.status === 'Cancelled' ? ok('linked sale retired (Cancelled)') : bad(`linked sale status=${saleC.status}`);
  }

  if (orderB) {
    const cb = await J(`/api/orders/${orderB.id}/status`, { method: 'PATCH', headers: H, body: JSON.stringify({ status: 'Cancelled' }) });
    cb.status === 200 ? ok('second order cancelled (stock restored)') : bad(`cancel B => ${cb.status}`);
    // its payment was already terminal (Paid) — must NOT be voided
    const [[payB]] = await conn.query('SELECT status FROM payments WHERE payment_reference=?', [orderB.payment_reference]);
    payB.status === 'Paid' ? ok('Paid payment not voided by cancellation') : bad(`payment B status=${payB.status} (should stay Paid)`);
  }

  const [[stockEnd]] = await conn.query('SELECT stock_quantity FROM product_variants WHERE id=?', [V.variant_id]);
  Number(stockEnd.stock_quantity) === expectedAfterCancels
    ? ok(`stock fully restored after both cancellations (${stockEnd.stock_quantity})`)
    : bad(`stock after cancels=${stockEnd.stock_quantity}, expected ${expectedAfterCancels}`);

  const [restx] = await conn.query(
    "SELECT * FROM stock_transactions WHERE reference_type='ORDER' AND reference_id=? AND transaction_type='IN'", [orderA.id]);
  restx.length ? ok('restock recorded as IN transaction with ORDER reference') : bad('missing restock transaction');
  restx.forEach(t => cleanup.stockTx.push(t.id));
}

// ── 7. admin surfaces: orders list, customers, notifications ───────────────────
{
  const list = await J('/api/orders', { headers: H });
  list.status === 200 && Array.isArray(list.body)
    ? ok(`admin orders list => 200 (${list.body.length} rows)`) : bad(`admin orders list => ${list.status}`);

  const filt = await J('/api/orders?status=Cancelled', { headers: H });
  filt.status === 200 && Array.isArray(filt.body)
    ? ok('admin orders filtered by status => 200') : bad(`filtered list => ${filt.status}`);

  if (orderA) {
    const det = await J(`/api/orders/${orderA.id}`, { headers: H });
    det.status === 200 && Array.isArray(det.body?.items) && Array.isArray(det.body?.payments)
      ? ok('admin order detail => 200 with items + payments') : bad(`order detail => ${det.status}`);
    const noAuth = await J(`/api/orders/${orderA.id}`);
    noAuth.status === 401 ? ok('admin order detail without token => 401') : bad(`no-auth detail => ${noAuth.status}`);
  }

  const cust = await J('/api/customers?q=Phase3', { headers: H });
  cust.status === 200 && Array.isArray(cust.body) && cust.body.length
    ? ok(`admin customers list => 200 (found ${cust.body.length})`) : bad(`customers list => ${cust.status}: ${JSON.stringify(cust.body)}`);

  if (cleanup.customer) {
    const [ordersOf] = await conn.query('SELECT COUNT(*) n FROM orders WHERE customer_id=?', [cleanup.customer]);
    const del = await J(`/api/customers/${cleanup.customer}`, { method: 'DELETE', headers: H });
    // orders exist (test orders not yet hard-deleted) → must refuse
    if (Number(ordersOf[0].n) > 0) {
      del.status === 409 ? ok('customer with orders cannot be deleted => 409') : bad(`delete with orders => ${del.status}`);
    } else {
      del.status === 200 ? ok('customer without orders deleted') : bad(`delete => ${del.status}`);
    }
  }

  const notif = await J('/api/notifications?unread=1', { headers: H });
  if (notif.status === 200 && notif.body?.notifications) {
    ok(`notifications list => 200 (unread_count=${notif.body.unread_count})`);
    const testNotif = notif.body.notifications.find(n => n.type === 'new_order' && n.reference_id === orderA?.id);
    if (testNotif) {
      cleanup.notifications.push(testNotif.id);
      const rd = await J(`/api/notifications/${testNotif.id}/read`, { method: 'PATCH', headers: H });
      rd.status === 200 ? ok('mark notification read => 200') : bad(`mark read => ${rd.status}`);
    }
  } else bad(`notifications list => ${notif.status}`);

  const cnt = await J('/api/notifications/unread-count', { headers: H });
  cnt.status === 200 && typeof cnt.body?.unread_count === 'number'
    ? ok('unread-count => 200') : bad(`unread-count => ${cnt.status}`);
}


// ── 8. regression: phase 1/2 endpoints still healthy ───────────────────────────
{
  const eps = [
    ['/api/public/products', false], ['/api/public/categories', false], ['/api/public/homepage', false],
    ['/api/products', true], ['/api/sales', true], ['/api/purchases', true],
    ['/api/categories', true], ['/api/subcategories', true],
  ];
  let allOk = true;
  for (const [e, auth] of eps) {
    const r = await J(e, auth ? { headers: H } : {});
    if (r.status !== 200) { bad(`REGRESSION ${e} => ${r.status}`); allOk = false; }
  }
  if (allOk) ok(`all ${eps.length} regression endpoints => 200`);

  const pub = await J('/api/public/products');
  JSON.stringify(pub.body).includes('cost_price')
    ? bad('phase 2 regression: public products expose cost_price again')
    : ok('phase 2 guarantee holds: no cost_price in public responses');
}

// ── 9. cleanup: remove every artifact tied to the test phone (this run AND any
//      leftovers from a previously crashed run) ─────────────────────────────────
{
  try {
    const [ords] = await conn.query('SELECT id, order_number FROM orders WHERE customer_phone = ?', [PHONE]);
    const orderIds = ords.map(o => o.id);
    if (orderIds.length) {
      const [saleRows] = await conn.query('SELECT id FROM sales WHERE order_id IN (?)', [orderIds]);
      const saleIds = saleRows.map(s => s.id);
      const [payRows] = await conn.query('SELECT payment_reference FROM payments WHERE order_id IN (?)', [orderIds]);
      const payRefs = payRows.map(p => p.payment_reference);

      await conn.query('DELETE FROM order_items WHERE order_id IN (?)', [orderIds]);
      await conn.query('DELETE FROM sale_items WHERE sale_id IN (?)', [saleIds.length ? saleIds : [0]]);
      if (saleIds.length) await conn.query('DELETE FROM sales WHERE id IN (?)', [saleIds]);
      await conn.query('DELETE FROM payments WHERE order_id IN (?)', [orderIds]);
      if (payRefs.length) await conn.query('DELETE FROM payment_events WHERE payment_reference IN (?)', [payRefs]);
      await conn.query('DELETE FROM stock_transactions WHERE reference_type="ORDER" AND reference_id IN (?)', [orderIds]);
      await conn.query('DELETE FROM notifications WHERE reference_type="order" AND reference_id IN (?)', [orderIds]);
      for (const o of ords) {
        await conn.query('DELETE FROM notifications WHERE reference_type="product" AND body LIKE ?', [`%${o.order_number}%`]);
      }
      await conn.query('DELETE FROM orders WHERE id IN (?)', [orderIds]);
      ok(`cleanup: removed ${orderIds.length} test order(s) + payments, sales, stock txs, events, notifications`);
    }

    // Verify no live stock effect remains (restores from cancellation must be net-zero)
    if (V) {
      const [[vf]] = await conn.query('SELECT stock_quantity FROM product_variants WHERE id=?', [V.variant_id]);
      Number(vf.stock_quantity) === variantStockBefore
        ? ok('cleanup verified: stock back to pre-test value')
        : bad(`cleanup: variant stock=${vf.stock_quantity}, expected ${variantStockBefore}`);
    }

    // Customer delete only if no orders remain anywhere (FK is RESTRICT)
    const [[custRow]] = await conn.query('SELECT id FROM customers WHERE phone = ?', [PHONE]);
    if (custRow) {
      const [[cnt]] = await conn.query('SELECT COUNT(*) n FROM orders WHERE customer_id = ?', [custRow.id]);
      if (Number(cnt.n) === 0) {
        await conn.query('DELETE FROM customers WHERE id = ?', [custRow.id]);
        ok('cleanup: test customer removed');
      } else note(`cleanup: test customer kept (${cnt.n} orders still reference it)`);
    }
  } catch (e) { note(`cleanup issue: ${e.message}`); }
}

await conn.end();

// ── report ─────────────────────────────────────────────────────────────────────
const lines = [];
lines.push('');
lines.push('================ PHASE 3 VERIFICATION ================');
lines.push(`\nPASS: ${pass.length}`);
pass.forEach(m => lines.push(`  OK   ${m}`));
if (warn.length) { lines.push(`\nWARNINGS: ${warn.length}`); warn.forEach(m => lines.push(`  WARN ${m}`)); }
if (fail.length) { lines.push(`\nFAILURES: ${fail.length}`); fail.forEach(m => lines.push(`  FAIL ${m}`)); }
lines.push(`\nRESULT: ${fail.length === 0 ? 'ALL CHECKS PASSED' : fail.length + ' FAILURE(S)'}`);
const report = lines.join('\n');
console.log(report);
writeReport(report);
process.exit(fail.length === 0 ? 0 : 1);

