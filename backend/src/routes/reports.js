import express from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/daily', async (req, res) => {
  try {
    const [summary] = await pool.query(
      `SELECT COUNT(*) AS total_transactions, SUM(total_amount) AS total_sales
       FROM sales WHERE DATE(sale_date) = CURDATE() AND status != 'Cancelled'`
    );
    const [bestSelling] = await pool.query(
      `SELECT p.name, SUM(si.quantity) AS quantity_sold, SUM(si.subtotal) AS total_revenue
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       JOIN sales s ON si.sale_id = s.id
       WHERE s.status != 'Cancelled'
       GROUP BY si.product_id ORDER BY quantity_sold DESC LIMIT 10`
    );
    res.json({ summary: summary[0], best_selling: bestSelling });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch daily report' }); }
});

router.get('/weekly', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT WEEK(sale_date) AS week, SUM(total_amount) AS total_sales, COUNT(*) AS transactions
       FROM sales WHERE YEAR(sale_date) = YEAR(CURDATE()) AND status != 'Cancelled'
       GROUP BY WEEK(sale_date)`
    );
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch weekly report' }); }
});

router.get('/monthly', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT MONTH(sale_date) AS month, SUM(total_amount) AS total_sales, COUNT(*) AS transactions
       FROM sales WHERE YEAR(sale_date) = YEAR(CURDATE()) AND status != 'Cancelled'
       GROUP BY MONTH(sale_date)`
    );
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch monthly report' }); }
});

router.get('/inventory', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.sku, p.stock_quantity, p.minimum_stock, p.cost_price,
              p.selling_price, p.status, c.name AS category_name,
              (SELECT image_path FROM product_images WHERE product_id = p.id
               ORDER BY is_primary DESC, created_at ASC LIMIT 1) AS image_path
       FROM products p LEFT JOIN categories c ON p.category_id = c.id
       ORDER BY p.stock_quantity ASC`
    );
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch inventory report' }); }
});

router.get('/stock-movements', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  try {
    const [rows] = await pool.query(
      `SELECT st.id, st.type, st.quantity, st.notes, st.created_at, st.reference_type,
              p.name AS product_name, p.sku,
              u.name AS created_by_name
       FROM stock_transactions st
       JOIN products p ON st.product_id = p.id
       LEFT JOIN users u ON st.created_by = u.id
       ORDER BY st.created_at DESC
       LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch stock movements' }); }
});

export default router;
