import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const isRemoteDb = process.env.DB_HOST && process.env.DB_HOST !== 'localhost';

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'umuhoza_quincaillerie',
  port:     Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(isRemoteDb && { ssl: { rejectUnauthorized: false } }),
});

export async function initDb() {
  const connection = await pool.getConnection();
  try {
    // Extend stock_transactions ENUM to include return types
    try {
      await connection.query(`ALTER TABLE stock_transactions MODIFY COLUMN transaction_type ENUM('IN','OUT','ADJUSTMENT','RETURN_IN','RETURN_OUT') NOT NULL`);
    } catch (_) { /* already extended or column name differs */ }

    // Ensure notes column exists on stock_transactions
    await connection.query(`ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL`);

    // Category multilingual descriptions
    await connection.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS description_rw TEXT DEFAULT NULL AFTER description`);
    await connection.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS description_fr TEXT DEFAULT NULL AFTER description_rw`);

    // Subcategories table
    await connection.query(`CREATE TABLE IF NOT EXISTS subcategories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_id INT NOT NULL,
      name VARCHAR(120) NOT NULL,
      name_rw VARCHAR(120) DEFAULT NULL,
      name_fr VARCHAR(120) DEFAULT NULL,
      description TEXT DEFAULT NULL,
      description_rw TEXT DEFAULT NULL,
      description_fr TEXT DEFAULT NULL,
      image_path VARCHAR(255) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_subcategories_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    )`);

    // subcategory_id on products
    await connection.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory_id INT NULL AFTER category_id`);
    try {
      await connection.query(`ALTER TABLE products ADD CONSTRAINT fk_products_subcategory FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL`);
    } catch (_) { /* constraint already exists */ }

    // Brand field on products
    await connection.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100) NULL AFTER subcategory_id`);

    // Unit and image on product variants
    await connection.query(`ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS unit VARCHAR(50) NULL AFTER size`);
    await connection.query(`ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS image_path VARCHAR(500) NULL`);

    // Purchase returns
    await connection.query(`CREATE TABLE IF NOT EXISTS purchase_returns (
      id INT AUTO_INCREMENT PRIMARY KEY,
      purchase_id INT NOT NULL,
      notes TEXT,
      total_returned_cost DECIMAL(12,2) DEFAULT 0,
      created_by INT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
    )`);
    await connection.query(`CREATE TABLE IF NOT EXISTS purchase_return_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      return_id INT NOT NULL,
      product_id INT NOT NULL,
      product_variant_id INT DEFAULT NULL,
      quantity INT NOT NULL DEFAULT 1,
      unit_cost DECIMAL(10,2) DEFAULT 0,
      subtotal DECIMAL(12,2) DEFAULT 0,
      FOREIGN KEY (return_id) REFERENCES purchase_returns(id) ON DELETE CASCADE
    )`);

    // Sale returns
    await connection.query(`CREATE TABLE IF NOT EXISTS sale_returns (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sale_id INT NOT NULL,
      notes TEXT,
      refund_amount DECIMAL(12,2) DEFAULT 0,
      created_by INT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
    )`);
    await connection.query(`CREATE TABLE IF NOT EXISTS sale_return_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      return_id INT NOT NULL,
      product_id INT NOT NULL,
      product_variant_id INT DEFAULT NULL,
      quantity INT NOT NULL DEFAULT 1,
      unit_price DECIMAL(10,2) DEFAULT 0,
      subtotal DECIMAL(12,2) DEFAULT 0,
      FOREIGN KEY (return_id) REFERENCES sale_returns(id) ON DELETE CASCADE
    )`);

    // Bulk-sync products table from their variants (fixes stock/price/status for variant-based products)
    await connection.query(`
      UPDATE products p
      INNER JOIN (
        SELECT product_id,
          COUNT(*) AS cnt,
          COALESCE(SUM(stock_quantity), 0) AS total_stock,
          COALESCE(MIN(NULLIF(selling_price, 0)), 0) AS min_sell,
          COALESCE(MIN(NULLIF(cost_price, 0)), 0) AS min_cost
        FROM product_variants
        GROUP BY product_id
      ) v ON v.product_id = p.id
      SET
        p.stock_quantity = v.total_stock,
        p.selling_price  = v.min_sell,
        p.cost_price     = v.min_cost,
        p.status = CASE
          WHEN v.total_stock <= 0 THEN 'Out of Stock'
          WHEN v.total_stock <= p.minimum_stock THEN 'Low Stock'
          ELSE 'In Stock'
        END
    `);

    // Default settings
    await connection.query(`INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('show_prices', 'true')`);

    // Announcements multilingual fields
    await connection.query(`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS title_rw VARCHAR(255) DEFAULT NULL`);
    await connection.query(`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS title_fr VARCHAR(255) DEFAULT NULL`);
    await connection.query(`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS content_rw TEXT DEFAULT NULL`);
    await connection.query(`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS content_fr TEXT DEFAULT NULL`);

    // Page hero sections
    await connection.query(`CREATE TABLE IF NOT EXISTS page_heroes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      page_key VARCHAR(50) NOT NULL UNIQUE,
      title_en VARCHAR(255) DEFAULT NULL,
      title_rw VARCHAR(255) DEFAULT NULL,
      title_fr VARCHAR(255) DEFAULT NULL,
      subtitle_en TEXT DEFAULT NULL,
      subtitle_rw TEXT DEFAULT NULL,
      subtitle_fr TEXT DEFAULT NULL,
      image_path VARCHAR(255) DEFAULT NULL,
      is_active TINYINT(1) DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
    await connection.query(`INSERT IGNORE INTO page_heroes (page_key) VALUES ('products'), ('gallery'), ('about'), ('contact')`);

    // User profile extensions
    await connection.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30) DEFAULT NULL`);
    await connection.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_path VARCHAR(255) DEFAULT NULL`);
  } catch (e) {
    console.error('Migration warning:', e.message);
  } finally {
    connection.release();
  }
}

export default pool;
