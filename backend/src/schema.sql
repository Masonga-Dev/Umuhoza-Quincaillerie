 -- =====================================================
-- UMUHOZA QUINCAILLERIE
-- WEBSITE + INVENTORY + SALES MANAGEMENT SYSTEM
-- COMPLETE MYSQL SCHEMA
-- =====================================================

CREATE DATABASE IF NOT EXISTS umuhoza_quincaillerie
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE umuhoza_quincaillerie;

-- =====================================================
-- USERS
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','manager','salesperson') DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SUPPLIERS
-- =====================================================

CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(220) NOT NULL,
    contact_person VARCHAR(120) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    email VARCHAR(180) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CATEGORIES  (multilingual + image)
-- =====================================================

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,   -- English (primary / search key)
    name_rw VARCHAR(120) DEFAULT NULL,   -- Kinyarwanda
    name_fr VARCHAR(120) DEFAULT NULL,   -- French
    description TEXT,
    description_rw TEXT DEFAULT NULL,
    description_fr TEXT DEFAULT NULL,
    image_path VARCHAR(255) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PRODUCTS  (multilingual + analytics)
-- =====================================================

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NULL,
    sku VARCHAR(100) UNIQUE,
    name VARCHAR(220) NOT NULL,           -- English (primary)
    name_rw VARCHAR(220) DEFAULT NULL,    -- Kinyarwanda
    name_fr VARCHAR(220) DEFAULT NULL,    -- French
    description TEXT,
    description_rw TEXT DEFAULT NULL,
    description_fr TEXT DEFAULT NULL,

    cost_price DECIMAL(12,2) DEFAULT 0.00,
    selling_price DECIMAL(12,2) DEFAULT 0.00,

    stock_quantity INT DEFAULT 0,
    minimum_stock INT DEFAULT 5,
    status ENUM('In Stock', 'Low Stock', 'Out of Stock') DEFAULT 'In Stock',

    -- Analytics
    view_count INT NOT NULL DEFAULT 0,
    total_sold INT NOT NULL DEFAULT 0,
    total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    last_sold_at DATETIME DEFAULT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE SET NULL
);

-- =====================================================
-- PRODUCT IMAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    is_primary TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_images_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
);

-- =====================================================
-- PRODUCT VARIANTS
-- =====================================================

CREATE TABLE IF NOT EXISTS product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    color VARCHAR(100) DEFAULT NULL,
    size VARCHAR(100) DEFAULT NULL,
    sku VARCHAR(100) DEFAULT NULL,
    selling_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    cost_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    stock_quantity INT NOT NULL DEFAULT 0,
    minimum_stock INT NOT NULL DEFAULT 5,
    status ENUM('In Stock','Low Stock','Out of Stock') NOT NULL DEFAULT 'In Stock',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_variants_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
);

-- =====================================================
-- STOCK TRANSACTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS stock_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    product_variant_id INT NULL,
    quantity INT NOT NULL,
    transaction_type ENUM('IN','OUT','ADJUSTMENT','RETURN_IN','RETURN_OUT') NOT NULL,
    notes TEXT,
    created_by INT NULL,
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_stock_transactions_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_stock_transactions_variant
        FOREIGN KEY (product_variant_id)
        REFERENCES product_variants(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_stock_transactions_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- =====================================================
-- PURCHASES  (stock entering the store)
-- =====================================================

CREATE TABLE IF NOT EXISTS purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NULL,
    reference_number VARCHAR(120) DEFAULT NULL,
    total_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT DEFAULT NULL,
    created_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_purchases_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES suppliers(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_purchases_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- =====================================================
-- PURCHASE ITEMS
-- =====================================================

CREATE TABLE IF NOT EXISTS purchase_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT NOT NULL,
    product_id INT NOT NULL,
    product_variant_id INT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,

    CONSTRAINT fk_purchase_items_purchase
        FOREIGN KEY (purchase_id)
        REFERENCES purchases(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_purchase_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_purchase_items_variant
        FOREIGN KEY (product_variant_id)
        REFERENCES product_variants(id)
        ON DELETE SET NULL
);

-- =====================================================
-- SALES  (payment method + status)
-- =====================================================

CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(120) NOT NULL UNIQUE,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('Cash','Mobile Money','Bank Transfer') NOT NULL DEFAULT 'Cash',
    status ENUM('Completed','Cancelled') NOT NULL DEFAULT 'Completed',
    customer_name VARCHAR(120) DEFAULT NULL,
    notes TEXT DEFAULT NULL,

    sold_by INT NULL,

    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sales_user
        FOREIGN KEY (sold_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- =====================================================
-- SALE ITEMS  (variant tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    product_variant_id INT NULL,

    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,

    CONSTRAINT fk_sale_items_sale
        FOREIGN KEY (sale_id)
        REFERENCES sales(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_sale_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_sale_items_variant
        FOREIGN KEY (product_variant_id)
        REFERENCES product_variants(id)
        ON DELETE SET NULL
);

-- =====================================================
-- ANNOUNCEMENTS  (multilingual)
-- =====================================================

CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(220) NOT NULL,          -- English
    title_rw VARCHAR(220) DEFAULT NULL,   -- Kinyarwanda
    title_fr VARCHAR(220) DEFAULT NULL,   -- French
    content TEXT,
    content_rw TEXT DEFAULT NULL,
    content_fr TEXT DEFAULT NULL,
    status ENUM('Draft','Published') DEFAULT 'Draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- GALLERY
-- =====================================================

CREATE TABLE IF NOT EXISTS gallery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(220),
    image_path VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SETTINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(120) NOT NULL UNIQUE,
    setting_value TEXT
);

-- =====================================================
-- CONTACT INFORMATION
-- =====================================================

CREATE TABLE IF NOT EXISTS contact_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    info_key VARCHAR(120) NOT NULL UNIQUE,  -- e.g. 'phone_primary', 'whatsapp', 'email', 'address', 'hours', 'facebook'
    label VARCHAR(120) DEFAULT NULL,         -- Display label shown in UI
    info_value TEXT DEFAULT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- HOMEPAGE CONTENT  (multilingual)
-- =====================================================

CREATE TABLE IF NOT EXISTS homepage_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section_name VARCHAR(120) NOT NULL,
    title VARCHAR(255),
    title_rw VARCHAR(255) DEFAULT NULL,
    title_fr VARCHAR(255) DEFAULT NULL,
    description TEXT,
    description_rw TEXT DEFAULT NULL,
    description_fr TEXT DEFAULT NULL,
    image_path VARCHAR(255),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ACTIVITY LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(255) NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_logs_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_payment ON sales(payment_method);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_stock_product ON stock_transactions(product_id);
CREATE INDEX idx_stock_variant ON stock_transactions(product_variant_id);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);
CREATE INDEX idx_sale_items_variant ON sale_items(product_variant_id);
CREATE INDEX idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_product ON purchase_items(product_id);
CREATE INDEX idx_variants_product ON product_variants(product_id);
