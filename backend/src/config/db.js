import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'umuhoza_quincaillerie',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function initDb() {
  const connection = await pool.getConnection();
  try {
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

    // Default settings
    await connection.query(`INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('show_prices', 'true')`);
  } catch (e) {
    console.error('Migration warning:', e.message);
  } finally {
    connection.release();
  }
}

export default pool;
