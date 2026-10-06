import express from 'express';
import crypto from 'crypto';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { initiatePayment, currentMode } from '../services/payment/payment.service.js';

const router = express.Router();

const PAY_STATUSES = ['Pending', 'Processing', 'Paid', 'Failed', 'Cancelled', 'Refunded'];

// ── Admin: list payments (optionally per order) ──────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  const { order_id, status, q } = req.query;
  let sql = `SELECT p.*, o.order_number, o.customer_name
             FROM payments p JOIN orders o ON o.id = p.order_id`;
  const params = [], filters = [];
  if (order_id) { filters.push('p.order_id = ?'); params.push(order_id); }
  if (status) { filters.push('p.status = ?'); params.push(status); }
  if (q) { filters.push('(p.payment_reference LIKE ? OR o.order_number LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (filters.length) sql += ' WHERE ' + filters.join(' AND ');
  sql += ' ORDER BY p.created_at DESC';
  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch payments' }); }
});

// ── Public: payment status by reference (for checkout polling) ───────────────
router.get('/:reference/status', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.payment_reference, p.status, p.amount, p.currency, p.payment_method, p.paid_at,
              o.order_number, o.status AS order_status
       FROM payments p JOIN orders o ON o.id = p.order_id
       WHERE p.payment_reference = ?`,
      [req.params.reference]
    );
    if (!rows.length) return res.status(404).json({ message: 'Payment not found' });
    res.json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch payment status' }); }
});

// ── Public: start a provider payment for an existing payment intent ───────────
// Phase 8 — goes through services/payment/payment.service.js so the real
// IremboPay credentials can be dropped in later without touching checkout.
// Amount always comes from the DB row — never from the request body.
router.post('/:reference/initiate', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM payments WHERE payment_reference = ?', [req.params.reference]);
    if (!rows.length) return res.status(404).json({ message: 'Payment not found' });
    const payment = rows[0];
    if (payment.status === 'Paid') return res.json({ message: 'Already paid', status: 'Paid' });
    if (!['Pending', 'Processing'].includes(payment.status)) {
      return res.status(409).json({ message: `Payment is ${payment.status} and cannot be initiated` });
    }

    const result = await initiatePayment({
      reference: payment.payment_reference,
      amount: Number(payment.amount),
      currency: payment.currency,
      method: payment.payment_method,
    });

    await pool.query(
      `UPDATE payments SET status='Processing', provider_transaction_id=COALESCE(?, provider_transaction_id),
         provider_response=? WHERE id=?`,
      [result.provider_reference, JSON.stringify(result), payment.id]
    );
    await pool.query(
      'INSERT INTO payment_events (payment_id, payment_reference, event_type, payload, processed) VALUES (?,?,?,?,1)',
      [payment.id, payment.payment_reference, 'payment.initiated', JSON.stringify(result)]
    );

    res.json({
      status: 'Processing',
      provider: result.provider,
      provider_reference: result.provider_reference,
      instructions: result.instructions,
      mock: Boolean(result.mock),
      mode: currentMode(),
    });
  } catch (e) {
    console.error('payment initiate error:', e.message);
    res.status(502).json({ message: 'Could not start the payment. Please try again.' });
  }
});

// ── Admin: manually update a payment (e.g. confirming a bank transfer) ───────
router.patch('/:id', authMiddleware, async (req, res) => {
  const { status, provider_transaction_id, provider_payment_number, failure_reason } = req.body || {};
  if (!PAY_STATUSES.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${PAY_STATUSES.join(', ')}` });
  }
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const [rows] = await conn.query('SELECT * FROM payments WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!rows.length) { await conn.rollback(); return res.status(404).json({ message: 'Payment not found' }); }
    const payment = rows[0];

    await conn.query(
      `UPDATE payments SET status=?, provider_transaction_id=COALESCE(?, provider_transaction_id),
         provider_payment_number=COALESCE(?, provider_payment_number), failure_reason=?,
         verified_at = IF(?='Paid', NOW(), verified_at), paid_at = IF(?='Paid', NOW(), paid_at)
       WHERE id=?`,
      [status, provider_transaction_id || null, provider_payment_number || null,
       status === 'Paid' || status === 'Processing' ? null : (failure_reason || null),
       status, status, payment.id]
    );

    // Mirror the outcome onto the order (never downgrade a Paid order automatically)
    if (status === 'Paid') {
      await conn.query("UPDATE orders SET payment_status='Paid' WHERE id=?", [payment.order_id]);
    } else if (['Failed', 'Cancelled'].includes(status)) {
      await conn.query("UPDATE orders SET payment_status=? WHERE id=? AND payment_status IN ('Pending','Processing')",
        [status, payment.order_id]);
    } else if (status === 'Processing') {
      await conn.query("UPDATE orders SET payment_status='Processing' WHERE id=? AND payment_status='Pending'",
        [payment.order_id]);
    } else if (status === 'Refunded') {
      await conn.query("UPDATE orders SET payment_status='Refunded' WHERE id=?", [payment.order_id]);
    }

    await conn.commit();
    const [updated] = await pool.query('SELECT * FROM payments WHERE id = ?', [payment.id]);
    res.json({ message: 'Payment updated', payment: updated[0] });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ message: e.message || 'Could not update payment' });
  } finally {
    conn.release();
  }
});

// ── Provider webhook ──────────────────────────────────────────────────────────
// Idempotent: every delivery is recorded in payment_events, and a payment that
// is already in a terminal state is never overwritten. When
// IREMBOPAY_WEBHOOK_SECRET is set, the X-Signature header must equal
// HMAC-SHA256(secret, raw JSON body); without it the endpoint still works
// (dev mode) but marks signature_valid = NULL.
// NOTE: raw body capture is configured on the global express.json() in index.js
// (req.rawBody) so signature verification sees the exact bytes the provider sent.
router.post('/webhook', async (req, res) => {
  const secret = process.env.IREMBOPAY_WEBHOOK_SECRET || null;
  const signature = req.headers['x-signature'] || req.headers['x-irembopay-signature'] || null;

  let signatureValid = null;
  if (secret) {
    const expected = crypto.createHmac('sha256', secret).update(req.rawBody || Buffer.from('')).digest('hex');
    const a = Buffer.from(String(signature || ''), 'utf8');
    const b = Buffer.from(expected, 'utf8');
    signatureValid = a.length === b.length && crypto.timingSafeEqual(a, b) ? 1 : 0;
    if (!signatureValid) return res.status(401).json({ message: 'Invalid webhook signature' });
  }

  const {
    payment_reference, status: incomingStatus, provider_transaction_id,
    provider_payment_number, failure_reason, event_type,
  } = req.body || {};
  if (!payment_reference) return res.status(400).json({ message: 'payment_reference is required' });

  const targetStatus = PAY_STATUSES.includes(incomingStatus) ? incomingStatus : null;
  if (!targetStatus) return res.status(400).json({ message: `status must be one of: ${PAY_STATUSES.join(', ')}` });

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const [rows] = await conn.query('SELECT * FROM payments WHERE payment_reference = ? FOR UPDATE', [payment_reference]);
    if (!rows.length) {
      // Unknown reference — log the attempt but don't leak details to the caller
      await conn.query(
        'INSERT INTO payment_events (payment_reference, event_type, payload, signature_valid, processed) VALUES (?,?,?,?,0)',
        [payment_reference, event_type || 'unknown', JSON.stringify(req.body), signatureValid]
      );
      await conn.commit();
      return res.status(404).json({ message: 'Payment not found' });
    }
    const payment = rows[0];

    const [eventInsert] = await conn.query(
      'INSERT INTO payment_events (payment_id, payment_reference, event_type, payload, signature_valid, processed) VALUES (?,?,?,?,?,0)',
      [payment.id, payment_reference, event_type || `payment.${String(targetStatus).toLowerCase()}`, JSON.stringify(req.body), signatureValid]
    );

    const TERMINAL = ['Paid', 'Failed', 'Cancelled', 'Refunded'];
    if (TERMINAL.includes(payment.status)) {
      // Idempotent replay / out-of-order delivery → acknowledge without changes
      await conn.query('UPDATE payment_events SET processed = 1 WHERE id = ?', [eventInsert.insertId]);
      await conn.commit();
      return res.json({ message: 'Event recorded (payment already in terminal state)', status: payment.status });
    }

    await conn.query(
      `UPDATE payments SET status=?, provider_transaction_id=COALESCE(?, provider_transaction_id),
         provider_payment_number=COALESCE(?, provider_payment_number),
         failure_reason=?, provider_response=?,
         verified_at = IF(?='Paid', NOW(), verified_at), paid_at = IF(?='Paid', NOW(), paid_at)
       WHERE id=?`,
      [targetStatus, provider_transaction_id || null, provider_payment_number || null,
       targetStatus === 'Failed' ? (failure_reason || 'Payment failed') : null,
       JSON.stringify(req.body), targetStatus, targetStatus, payment.id]
    );

    if (targetStatus === 'Paid') {
      await conn.query("UPDATE orders SET payment_status='Paid' WHERE id=?", [payment.order_id]);
      await conn.query(
        "INSERT INTO notifications (type, title, body, reference_type, reference_id) VALUES ('pending_payment', ?, ?, 'order', ?)",
        [`Payment received — ${payment_reference}`, `RWF ${Number(payment.amount).toLocaleString('en-US')} confirmed for order.`,
         payment.order_id]
      );
    } else if (['Failed', 'Cancelled'].includes(targetStatus)) {
      await conn.query("UPDATE orders SET payment_status=? WHERE id=? AND payment_status IN ('Pending','Processing')",
        [targetStatus, payment.order_id]);
      await conn.query(
        "INSERT INTO notifications (type, title, body, reference_type, reference_id) VALUES ('pending_payment', ?, ?, 'order', ?)",
        [`Payment ${targetStatus.toLowerCase()} — ${payment_reference}`, failure_reason || `Payment ${targetStatus.toLowerCase()}.`,
         payment.order_id]
      );
    } else if (targetStatus === 'Processing') {
      await conn.query("UPDATE orders SET payment_status='Processing' WHERE id=? AND payment_status='Pending'",
        [payment.order_id]);
    }

    await conn.query('UPDATE payment_events SET processed = 1 WHERE id = ?', [eventInsert.insertId]);
    await conn.commit();
    res.json({ message: 'Webhook processed', status: targetStatus });
  } catch (e) {
    await conn.rollback();
    console.error('payment webhook error:', e.message);
    res.status(500).json({ message: 'Webhook processing failed' });
  } finally {
    conn.release();
  }
});

export default router;

