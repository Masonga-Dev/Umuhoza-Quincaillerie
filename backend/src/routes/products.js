import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDirectory = path.join(__dirname, '../../uploads/products');

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.-]/g, '');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

function determineStatus(stockQuantity, minimumStock = 5) {
  const stock = Number(stockQuantity ?? 0);
  const minStock = Number(minimumStock ?? 5);
  if (stock <= 0) return 'Out of Stock';
  if (stock <= minStock) return 'Low Stock';
  return 'In Stock';
}

function buildFilterQuery({ q, category, status }) {
  const filters = [];
  const params = [];
  if (q) {
    filters.push('(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (category) {
    filters.push('p.category_id = ?');
    params.push(category);
  }
  if (status) {
    filters.push('p.status = ?');
    params.push(status);
  }
  return { filters, params };
}

async function deleteImageFile(imagePath) {
  if (!imagePath) return;
  const filePath = path.join(__dirname, '../../', imagePath);
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    console.error('Failed to delete image file:', error);
  }
}

router.post('/upload', authMiddleware, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Image upload failed' });
  }

  const image_path = `uploads/products/${req.file.filename}`;
  res.status(201).json({ image_path });
});

router.get('/', async (req, res) => {
  const { q, category, status, page = 1, pageSize = 12 } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);
  const { filters, params } = buildFilterQuery({ q, category, status });
  const filterSql = filters.length ? `AND ${filters.join(' AND ')}` : '';

  const listQuery = `
    SELECT p.*, c.name AS category_name,
      (SELECT image_path FROM product_images WHERE product_id = p.id ORDER BY created_at ASC LIMIT 1) AS image_path
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1 ${filterSql}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `SELECT COUNT(*) AS total FROM products p WHERE 1=1 ${filterSql}`;

  try {
    const [rows] = await pool.query(listQuery, [...params, Number(pageSize), Number(offset)]);
    const [countRows] = await pool.query(countQuery, params);
    res.json({ data: rows, total: countRows[0].total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not fetch products' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name,
        (SELECT image_path FROM product_images WHERE product_id = p.id ORDER BY created_at ASC LIMIT 1) AS image_path
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not fetch product' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const {
    category_id,
    sku,
    name,
    description,
    cost_price,
    selling_price,
    stock_quantity,
    minimum_stock,
    image_path,
  } = req.body;

  if (!name || !sku || !category_id) {
    return res.status(400).json({ message: 'Name, SKU and category are required' });
  }

  if (Number(selling_price) < 0 || Number(stock_quantity) < 0) {
    return res.status(400).json({ message: 'Selling price and stock quantity cannot be negative' });
  }

  const status = determineStatus(stock_quantity, minimum_stock);

  try {
    const [existing] = await pool.query('SELECT id FROM products WHERE sku = ?', [sku]);
    if (existing.length) {
      return res.status(400).json({ message: 'SKU already exists' });
    }

    const [result] = await pool.query(
      `INSERT INTO products
        (category_id, sku, name, description, cost_price, selling_price, stock_quantity, minimum_stock, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [category_id, sku, name, description || '', Number(cost_price ?? 0), Number(selling_price ?? 0), Number(stock_quantity ?? 0), Number(minimum_stock ?? 5), status]
    );

    if (image_path) {
      await pool.query('INSERT INTO product_images (product_id, image_path, created_at) VALUES (?, ?, NOW())', [result.insertId, image_path]);
    }

    res.status(201).json({ id: result.insertId, message: 'Product created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not create product' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const {
    category_id,
    sku,
    name,
    description,
    cost_price,
    selling_price,
    stock_quantity,
    minimum_stock,
    image_path,
  } = req.body;

  if (!name || !sku || !category_id) {
    return res.status(400).json({ message: 'Name, SKU and category are required' });
  }

  if (Number(selling_price) < 0 || Number(stock_quantity) < 0) {
    return res.status(400).json({ message: 'Selling price and stock quantity cannot be negative' });
  }

  const status = determineStatus(stock_quantity, minimum_stock);

  try {
    const [existing] = await pool.query('SELECT id FROM products WHERE sku = ? AND id <> ?', [sku, req.params.id]);
    if (existing.length) {
      return res.status(400).json({ message: 'SKU already exists' });
    }

    await pool.query(
      `UPDATE products SET category_id = ?, sku = ?, name = ?, description = ?, cost_price = ?, selling_price = ?, stock_quantity = ?, minimum_stock = ?, status = ? WHERE id = ?`,
      [category_id, sku, name, description || '', Number(cost_price ?? 0), Number(selling_price ?? 0), Number(stock_quantity ?? 0), Number(minimum_stock ?? 5), status, req.params.id]
    );

    if (image_path) {
      const [existingImages] = await pool.query('SELECT image_path FROM product_images WHERE product_id = ?', [req.params.id]);
      for (const row of existingImages) {
        await deleteImageFile(row.image_path);
      }
      await pool.query('DELETE FROM product_images WHERE product_id = ?', [req.params.id]);
      await pool.query('INSERT INTO product_images (product_id, image_path, created_at) VALUES (?, ?, NOW())', [req.params.id, image_path]);
    }

    res.json({ message: 'Product updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not update product' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const [imageRows] = await pool.query('SELECT image_path FROM product_images WHERE product_id = ?', [req.params.id]);
    for (const row of imageRows) {
      await deleteImageFile(row.image_path);
    }

    await pool.query('DELETE FROM product_images WHERE product_id = ?', [req.params.id]);
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not delete product' });
  }
});

export default router;
