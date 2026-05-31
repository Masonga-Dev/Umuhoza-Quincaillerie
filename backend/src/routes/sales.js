import express from 'express';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const { q, invoice } = req.query;
  let query = `SELECT s.*, u.name AS sold_by_name FROM sales s LEFT JOIN users u ON s.sold_by = u.id`;
  const params = [];
  const filters = [];

  if (invoice) {
    filters.push('s.invoice_number = ?');
    params.push(invoice);
  }
  if (q) {
    filters.push('(s.invoice_number LIKE ? OR s.total_amount LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }

  if (filters.length) {
    query += ' WHERE ' + filters.join(' AND ');
  }

  query += ' ORDER BY s.sale_date DESC';

  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not fetch sales history' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { items, total_amount } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Sale items are required' });
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const [invoiceCount] = await connection.query('SELECT COUNT(*) AS total FROM sales WHERE DATE(sale_date) = CURDATE()');
    const nextOrder = invoiceCount[0].total + 1;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(nextOrder).padStart(3, '0')}`;

    const [saleResult] = await connection.query(
      'INSERT INTO sales (invoice_number, total_amount, sold_by, sale_date, created_at) VALUES (?, ?, ?, NOW(), NOW())',
      [invoiceNumber, total_amount, req.user.id]
    );

    for (const item of items) {
      const { product_id, quantity, unit_price } = item;
      const subtotal = quantity * unit_price;
      const [productRows] = await connection.query('SELECT stock_quantity, minimum_stock FROM products WHERE id = ?', [product_id]);
      if (!productRows.length) {
        throw new Error(`Product not found: ${product_id}`);
      }

      const currentStock = productRows[0].stock_quantity;
      const newStock = currentStock - quantity;
      if (newStock < 0) {
        throw new Error(`Insufficient stock for product ${product_id}`);
      }

      const status = newStock <= 0 ? 'Out of Stock' : newStock <= (productRows[0].minimum_stock || 5) ? 'Low Stock' : 'In Stock';

      await connection.query(
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [saleResult.insertId, product_id, quantity, unit_price, subtotal]
      );
      await connection.query('UPDATE products SET stock_quantity = ?, status = ? WHERE id = ?', [newStock, status, product_id]);
      await connection.query('INSERT INTO stock_transactions (product_id, quantity, transaction_type, transaction_date, created_at) VALUES (?, ?, ?, NOW(), NOW())', [product_id, -quantity, 'OUT']);
    }

    await connection.commit();
    res.status(201).json({ invoice_number: invoiceNumber, message: 'Sale recorded' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Could not record sale' });
  } finally {
    connection.release();
  }
});

export default router;
