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
  supportBigNumbers: true,
  bigNumberStrings: false,
  ...(isRemoteDb && { ssl: { rejectUnauthorized: false } }),
});

export async function initDb() {
  const connection = await pool.getConnection();
  try {
    // Extend stock_transactions ENUM (legacy types + ONLINE_ORDER)
    try {
      await connection.query(`ALTER TABLE stock_transactions MODIFY COLUMN transaction_type ENUM('IN','OUT','ADJUSTMENT','RETURN_IN','RETURN_OUT','ONLINE_ORDER') NOT NULL`);
    } catch (_) { /* already extended or column name differs */ }

    // Stock movement traceability (reference_type / reference_id / stock_before / stock_after)
    try { await connection.query(`ALTER TABLE stock_transactions ADD COLUMN reference_type VARCHAR(30) DEFAULT NULL AFTER transaction_type`); } catch (_) {}
    try { await connection.query(`ALTER TABLE stock_transactions ADD COLUMN reference_id INT DEFAULT NULL AFTER reference_type`); } catch (_) {}
    try { await connection.query(`ALTER TABLE stock_transactions ADD COLUMN stock_before INT DEFAULT NULL AFTER reference_id`); } catch (_) {}
    try { await connection.query(`ALTER TABLE stock_transactions ADD COLUMN stock_after INT DEFAULT NULL AFTER stock_before`); } catch (_) {}
    try { await connection.query(`CREATE INDEX idx_stock_reference ON stock_transactions(reference_type, reference_id)`); } catch (_) {}

    // Ensure cost_price snapshot column exists on sale_items
    try { await connection.query(`ALTER TABLE sale_items ADD COLUMN cost_price DECIMAL(12,2) NOT NULL DEFAULT 0.00`); } catch (_) {}

    // Ensure notes column exists on stock_transactions
    try { await connection.query(`ALTER TABLE stock_transactions ADD COLUMN notes TEXT DEFAULT NULL`); } catch (_) {}

    // Category multilingual descriptions
    try { await connection.query(`ALTER TABLE categories ADD COLUMN description_rw TEXT DEFAULT NULL AFTER description`); } catch (_) {}
    try { await connection.query(`ALTER TABLE categories ADD COLUMN description_fr TEXT DEFAULT NULL AFTER description_rw`); } catch (_) {}

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
    try {
      await connection.query(`ALTER TABLE products ADD COLUMN subcategory_id INT NULL AFTER category_id`);
    } catch (_) { /* column already exists */ }
    try {
      await connection.query(`ALTER TABLE products ADD CONSTRAINT fk_products_subcategory FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL`);
    } catch (_) { /* constraint already exists */ }

    // Brand field on products
    try { await connection.query(`ALTER TABLE products ADD COLUMN brand VARCHAR(100) NULL AFTER subcategory_id`); } catch (_) {}

    // Unit and image on product variants
    try { await connection.query(`ALTER TABLE product_variants ADD COLUMN unit VARCHAR(50) NULL AFTER size`); } catch (_) {}
    try { await connection.query(`ALTER TABLE product_variants ADD COLUMN image_path VARCHAR(500) NULL`); } catch (_) {}

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

    // Bulk-sync product stock/status from their variants (fixes stock/status for variant-based products).
    // Prices are intentionally NOT touched — overwriting them clobbered admin-entered values (§5).
    await connection.query(`
      UPDATE products p
      INNER JOIN (
        SELECT product_id,
          COUNT(*) AS cnt,
          COALESCE(SUM(stock_quantity), 0) AS total_stock
        FROM product_variants
        GROUP BY product_id
      ) v ON v.product_id = p.id
      SET
        p.stock_quantity = v.total_stock,
        p.status = CASE
          WHEN v.total_stock <= 0 THEN 'Out of Stock'
          WHEN v.total_stock <= p.minimum_stock THEN 'Low Stock'
          ELSE 'In Stock'
        END
    `);

    // Default settings
    await connection.query(`INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('show_prices', 'true')`);

    // Announcements multilingual fields
    try { await connection.query(`ALTER TABLE announcements ADD COLUMN title_rw VARCHAR(255) DEFAULT NULL`); } catch (_) {}
    try { await connection.query(`ALTER TABLE announcements ADD COLUMN title_fr VARCHAR(255) DEFAULT NULL`); } catch (_) {}
    try { await connection.query(`ALTER TABLE announcements ADD COLUMN content_rw TEXT DEFAULT NULL`); } catch (_) {}
    try { await connection.query(`ALTER TABLE announcements ADD COLUMN content_fr TEXT DEFAULT NULL`); } catch (_) {}

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
    try { await connection.query(`ALTER TABLE users ADD COLUMN phone VARCHAR(30) DEFAULT NULL`); } catch (_) {}
    try { await connection.query(`ALTER TABLE users ADD COLUMN avatar_path VARCHAR(255) DEFAULT NULL`); } catch (_) {}

    // ── PHASE 1: e-commerce database architecture (all additive / idempotent) ──

    // customers
    await connection.query(`CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      email VARCHAR(180) DEFAULT NULL,
      province VARCHAR(80) DEFAULT NULL,
      district VARCHAR(80) DEFAULT NULL,
      sector VARCHAR(80) DEFAULT NULL,
      address_details VARCHAR(255) DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_customers_phone (phone),
      KEY idx_customers_email (email),
      KEY idx_customers_name (name)
    )`);

    // sales: channel + customer/order links (Option A unified ledger)
    try { await connection.query(`ALTER TABLE sales ADD COLUMN sales_channel ENUM('Physical Store','Online') NOT NULL DEFAULT 'Physical Store' AFTER customer_name`); } catch (_) {}
    try { await connection.query(`ALTER TABLE sales ADD COLUMN customer_id INT DEFAULT NULL AFTER sales_channel`); } catch (_) {}
    try { await connection.query(`ALTER TABLE sales ADD COLUMN order_id INT DEFAULT NULL AFTER customer_id`); } catch (_) {}
    try { await connection.query(`ALTER TABLE sales ADD CONSTRAINT fk_sales_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL`); } catch (_) {}
    try { await connection.query(`CREATE INDEX idx_sales_channel ON sales(sales_channel)`); } catch (_) {}
    try { await connection.query(`CREATE INDEX idx_sales_order ON sales(order_id)`); } catch (_) {}

    // orders
    await connection.query(`CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_number VARCHAR(40) NOT NULL,
      customer_id INT NOT NULL,
      fulfillment_type ENUM('Delivery','Pickup') NOT NULL DEFAULT 'Delivery',
      status ENUM('Pending','Confirmed','Processing','Ready for Pickup','Out for Delivery','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
      payment_status ENUM('Pending','Processing','Paid','Failed','Cancelled','Refunded') NOT NULL DEFAULT 'Pending',
      customer_name VARCHAR(150) NOT NULL,
      customer_phone VARCHAR(30) NOT NULL,
      customer_email VARCHAR(180) DEFAULT NULL,
      province VARCHAR(80) DEFAULT NULL,
      district VARCHAR(80) DEFAULT NULL,
      sector VARCHAR(80) DEFAULT NULL,
      address_details VARCHAR(255) DEFAULT NULL,
      delivery_instructions TEXT DEFAULT NULL,
      subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      delivery_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      tax DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      total_amount DECIMAL(12,2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'RWF',
      stock_deducted TINYINT(1) NOT NULL DEFAULT 0,
      linked_sale_id INT DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      confirmed_by INT DEFAULT NULL,
      placed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_orders_number (order_number),
      KEY idx_orders_status (status),
      KEY idx_orders_payment_status (payment_status),
      KEY idx_orders_customer (customer_id),
      KEY idx_orders_placed (placed_at),
      KEY idx_orders_sale (linked_sale_id),
      CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
    )`);

    // order_items
    await connection.query(`CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      product_variant_id INT DEFAULT NULL,
      product_name VARCHAR(220) NOT NULL,
      variant_label VARCHAR(190) DEFAULT NULL,
      sku VARCHAR(100) DEFAULT NULL,
      unit_price DECIMAL(12,2) NOT NULL,
      unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      quantity INT NOT NULL,
      subtotal DECIMAL(12,2) NOT NULL,
      CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
      CONSTRAINT fk_order_items_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
      KEY idx_order_items_order (order_id),
      KEY idx_order_items_product (product_id),
      KEY idx_order_items_variant (product_variant_id)
    )`);

    // payments
    await connection.query(`CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      payment_reference VARCHAR(40) NOT NULL,
      order_id INT NOT NULL,
      provider ENUM('IremboPay','Cash','Manual') NOT NULL DEFAULT 'IremboPay',
      payment_method ENUM('MTN','Airtel','Card','Cash') NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'RWF',
      status ENUM('Pending','Processing','Paid','Failed','Cancelled','Refunded') NOT NULL DEFAULT 'Pending',
      provider_transaction_id VARCHAR(120) DEFAULT NULL,
      provider_payment_number VARCHAR(60) DEFAULT NULL,
      provider_response TEXT DEFAULT NULL,
      failure_reason VARCHAR(255) DEFAULT NULL,
      verified_at DATETIME DEFAULT NULL,
      paid_at DATETIME DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_payments_reference (payment_reference),
      UNIQUE KEY uq_payments_provider_txn (provider, provider_transaction_id),
      KEY idx_payments_order (order_id),
      KEY idx_payments_status (status),
      CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )`);

    // payment_events (webhook audit trail / idempotency)
    await connection.query(`CREATE TABLE IF NOT EXISTS payment_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      payment_id INT DEFAULT NULL,
      payment_reference VARCHAR(40) DEFAULT NULL,
      event_type VARCHAR(60) NOT NULL,
      payload TEXT DEFAULT NULL,
      signature_valid TINYINT(1) DEFAULT NULL,
      processed TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      KEY idx_payment_events_payment (payment_id),
      KEY idx_payment_events_reference (payment_reference)
    )`);

    // notifications (admin alerts)
    await connection.query(`CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type ENUM('new_order','pending_payment','low_stock','out_of_stock','new_purchase','purchase_return','sale_return') NOT NULL,
      title VARCHAR(200) NOT NULL,
      body TEXT DEFAULT NULL,
      reference_type VARCHAR(30) DEFAULT NULL,
      reference_id INT DEFAULT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      KEY idx_notifications_unread (is_read, created_at),
      KEY idx_notifications_reference (reference_type, reference_id)
    )`);

    // sequences (race-safe reference numbers: ORD-/PAY-/INV-/RET-)
    await connection.query(`CREATE TABLE IF NOT EXISTS sequences (
      name VARCHAR(40) NOT NULL PRIMARY KEY,
      last_number INT NOT NULL DEFAULT 0
    )`);
    await connection.query(`INSERT IGNORE INTO sequences (name, last_number) VALUES ('INV',0),('ORD',0),('PAY',0),('RET',0),('PRET',0)`);

    // variant extra attributes + soft-active flag
    try { await connection.query(`ALTER TABLE product_variants ADD COLUMN attributes JSON DEFAULT NULL`); } catch (_) {}
    try { await connection.query(`ALTER TABLE product_variants ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1`); } catch (_) {}
  } catch (e) {
    console.error('Migration warning:', e.message);
  } finally {
    connection.release();
  }
}

export default pool;
