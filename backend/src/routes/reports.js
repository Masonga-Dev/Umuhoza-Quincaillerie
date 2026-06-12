import express from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/daily', async (req, res) => {
  try {
    const [summary] = await pool.query(
      `SELECT COUNT(*) AS total_transactions, SUM(total_amount) AS total_sales FROM sales WHERE DATE(sale_date) = CURDATE()`
    );
    const [bestSelling] = await pool.query(
      `SELECT p.name, SUM(si.quantity) AS quantity_sold, SUM(si.subtotal) AS total_revenue
       FROM sale_items si JOIN products p ON si.product_id = p.id
       GROUP BY si.product_id ORDER BY quantity_sold DESC LIMIT 10`
    );
    res.json({ summary: summary[0], best_selling: bestSelling });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not fetch daily report' });
  }
});

router.get('/weekly', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT WEEK(sale_date) AS week, SUM(total_amount) AS total_sales, COUNT(*) AS transactions FROM sales WHERE YEAR(sale_date) = YEAR(CURDATE()) GROUP BY WEEK(sale_date)`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not fetch weekly report' });
  }
});

router.get('/monthly', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT MONTH(sale_date) AS month, SUM(total_amount) AS total_sales, COUNT(*) AS transactions FROM sales WHERE YEAR(sale_date) = YEAR(CURDATE()) GROUP BY MONTH(sale_date)`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not fetch monthly report' });
  }
});

router.get('/inventory', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.sku, p.stock_quantity, p.minimum_stock, p.status,
        c.name AS category_name,
        (SELECT image_path FROM product_images WHERE product_id = p.id ORDER BY created_at ASC LIMIT 1) AS image_path
       FROM products p LEFT JOIN categories c ON p.category_id = c.id
       ORDER BY p.stock_quantity ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not fetch inventory report' });
  }
});

export default router;
