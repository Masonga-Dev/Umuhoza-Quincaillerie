import express from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

const NOTIFICATION_TYPES = ['new_order', 'pending_payment', 'low_stock', 'out_of_stock',
  'new_purchase', 'purchase_return', 'sale_return'];

// GET /api/notifications?type=&unread=1&limit=
router.get('/', async (req, res) => {
  const { type, unread, limit } = req.query;
  let sql = 'SELECT * FROM notifications';
  const params = [], filters = [];
  if (type && NOTIFICATION_TYPES.includes(type)) { filters.push('type = ?'); params.push(type); }
  if (unread === '1') filters.push('is_read = 0');
  if (filters.length) sql += ' WHERE ' + filters.join(' AND ');
  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(Math.min(Number(limit) || 50, 200));
  try {
    const [rows] = await pool.query(sql, params);
    const [[{ n: unreadCount }]] = await pool.query('SELECT COUNT(*) AS n FROM notifications WHERE is_read = 0');
    res.json({ notifications: rows, unread_count: Number(unreadCount) });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch notifications' }); }
});

// GET /api/notifications/unread-count  (lightweight poll for the admin bell)
router.get('/unread-count', async (req, res) => {
  try {
    const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM notifications WHERE is_read = 0');
    res.json({ unread_count: Number(n) });
  } catch (e) { res.status(500).json({ message: 'Could not fetch unread count' }); }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const [result] = await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Notification marked as read' });
  } catch (e) { res.status(500).json({ message: 'Could not update notification' }); }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE is_read = 0');
    res.json({ message: 'All notifications marked as read' });
  } catch (e) { res.status(500).json({ message: 'Could not update notifications' }); }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM notifications WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (e) { res.status(500).json({ message: 'Could not delete notification' }); }
});

export default router;
