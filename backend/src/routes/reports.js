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
       WHERE s.status != 'Cancelled' AND DATE(s.sale_date) = CURDATE()
       GROUP BY si.product_id ORDER BY quantity_sold DESC LIMIT 10`
    );
    const [paymentMethods] = await pool.query(
      `SELECT payment_method, COUNT(*) AS count, SUM(total_amount) AS total
       FROM sales WHERE status != 'Cancelled' AND DATE(sale_date) = CURDATE()
       GROUP BY payment_method ORDER BY count DESC`
    );
    const [categoryRevenue] = await pool.query(
      `SELECT c.name AS category, SUM(si.subtotal) AS revenue, SUM(si.quantity) AS units
       FROM sale_items si
       JOIN products p ON p.id = si.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       JOIN sales s ON s.id = si.sale_id
       WHERE s.status != 'Cancelled' AND DATE(s.sale_date) = CURDATE()
       GROUP BY p.category_id ORDER BY revenue DESC LIMIT 8`
    );
    res.json({ summary: summary[0], best_selling: bestSelling, payment_methods: paymentMethods, category_revenue: categoryRevenue });
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
      `SELECT st.id, st.transaction_type, st.quantity, st.notes, st.created_at,
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

router.get('/kpis', async (req, res) => {
  try {
    const [[thisM]] = await pool.query(
      `SELECT COUNT(*) AS transactions, COALESCE(SUM(total_amount),0) AS revenue,
              COUNT(DISTINCT customer_name) AS customers
       FROM sales WHERE status != 'Cancelled'
       AND MONTH(sale_date) = MONTH(CURDATE()) AND YEAR(sale_date) = YEAR(CURDATE())`
    );
    const [[lastM]] = await pool.query(
      `SELECT COUNT(*) AS transactions, COALESCE(SUM(total_amount),0) AS revenue,
              COUNT(DISTINCT customer_name) AS customers
       FROM sales WHERE status != 'Cancelled'
       AND MONTH(sale_date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
       AND YEAR(sale_date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))`
    );
    const [[itemsThis]] = await pool.query(
      `SELECT COALESCE(SUM(si.quantity),0) AS items_sold
       FROM sale_items si JOIN sales s ON si.sale_id = s.id
       WHERE s.status != 'Cancelled'
       AND MONTH(s.sale_date) = MONTH(CURDATE()) AND YEAR(s.sale_date) = YEAR(CURDATE())`
    );
    const [[itemsLast]] = await pool.query(
      `SELECT COALESCE(SUM(si.quantity),0) AS items_sold
       FROM sale_items si JOIN sales s ON si.sale_id = s.id
       WHERE s.status != 'Cancelled'
       AND MONTH(s.sale_date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
       AND YEAR(s.sale_date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))`
    );
    const [[stockVal]] = await pool.query(
      `SELECT COALESCE(SUM(stock_quantity * cost_price),0) AS total_value FROM products`
    );

    const pct = (cur, prev) => {
      const c = Number(cur || 0), p = Number(prev || 0);
      if (!p) return c > 0 ? 100 : 0;
      return Math.round(((c - p) / p) * 100);
    };

    const avgThis = thisM.transactions ? thisM.revenue / thisM.transactions : 0;
    const avgLast = lastM.transactions ? lastM.revenue / lastM.transactions : 0;

    res.json({
      items_sold:    { value: Number(itemsThis.items_sold), pct: pct(itemsThis.items_sold, itemsLast.items_sold) },
      avg_sale:      { value: Math.round(avgThis), pct: pct(avgThis, avgLast) },
      new_customers: { value: Number(thisM.customers), pct: pct(thisM.customers, lastM.customers) },
      stock_value:   { value: Number(stockVal.total_value), pct: null },
    });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch KPIs' }); }
});

router.get('/recent-sales', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  try {
    const [rows] = await pool.query(
      `SELECT id, invoice_number, customer_name, total_amount, payment_method, sale_date
       FROM sales WHERE status != 'Cancelled' ORDER BY sale_date DESC LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch recent sales' }); }
});

router.get('/top-customers', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT customer_name, COUNT(*) AS total_purchases,
              COALESCE(SUM(total_amount),0) AS amount_spent, MAX(sale_date) AS last_purchase
       FROM sales WHERE status != 'Cancelled'
       AND MONTH(sale_date) = MONTH(CURDATE()) AND YEAR(sale_date) = YEAR(CURDATE())
       AND customer_name IS NOT NULL AND customer_name != ''
       GROUP BY customer_name ORDER BY amount_spent DESC LIMIT 10`
    );
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch top customers' }); }
});

router.get('/supplier-performance', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.name AS supplier, COUNT(*) AS purchases,
              COALESCE(SUM(p.total_cost),0) AS total_value
       FROM purchases p JOIN suppliers s ON p.supplier_id = s.id
       WHERE MONTH(p.purchase_date) = MONTH(CURDATE()) AND YEAR(p.purchase_date) = YEAR(CURDATE())
       GROUP BY s.id, s.name ORDER BY total_value DESC LIMIT 10`
    );
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch supplier performance' }); }
});

router.get('/sales-by-day', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DAY(sale_date) AS day, COALESCE(SUM(total_amount),0) AS total, COUNT(*) AS transactions
       FROM sales WHERE status != 'Cancelled'
       AND MONTH(sale_date) = MONTH(CURDATE()) AND YEAR(sale_date) = YEAR(CURDATE())
       GROUP BY DAY(sale_date) ORDER BY day`
    );
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Could not fetch sales by day' }); }
});

export default router;
