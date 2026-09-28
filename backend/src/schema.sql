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
-- CUSTOMERS  (online + optional physical-sale identity)
-- =====================================================

CREATE TABLE IF NOT EXISTS customers (
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
-- SUBCATEGORIES
-- =====================================================

CREATE TABLE IF NOT EXISTS subcategories (
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
);

-- =====================================================
-- PRODUCTS  (multilingual + analytics)
-- =====================================================

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NULL,
    subcategory_id INT NULL,
    brand VARCHAR(100) NULL,
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
        ON DELETE SET NULL,

    CONSTRAINT fk_products_subcategory
        FOREIGN KEY (subcategory_id)
        REFERENCES subcategories(id)
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
    attributes JSON DEFAULT NULL,                 -- extra attributes (length, weight, material…)
    is_active TINYINT(1) NOT NULL DEFAULT 1,
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
    transaction_type ENUM('IN','OUT','ADJUSTMENT','RETURN_IN','RETURN_OUT','ONLINE_ORDER') NOT NULL,
    reference_type VARCHAR(30) DEFAULT NULL,      -- SALE / ORDER / PURCHASE / PURCHASE_RETURN / SALES_RETURN / ADJUSTMENT
    reference_id INT DEFAULT NULL,                -- id of the row in the referenced table
    stock_before INT DEFAULT NULL,                -- quantity before this movement
    stock_after INT DEFAULT NULL,                 -- quantity after this movement
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
    customer_id INT DEFAULT NULL,                 -- linked customers row (nullable)
    order_id INT DEFAULT NULL,                    -- soft link to orders.id when created online
    sales_channel ENUM('Physical Store','Online') NOT NULL DEFAULT 'Physical Store',
    notes TEXT DEFAULT NULL,

    sold_by INT NULL,

    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sales_user
        FOREIGN KEY (sold_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_sales_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE SET NULL,

    KEY idx_sales_channel (sales_channel),
    KEY idx_sales_order (order_id)
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
    cost_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,  -- cost snapshot at time of sale (gross profit)
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
CREATE INDEX idx_stock_reference ON stock_transactions(reference_type, reference_id);

-- =====================================================
-- ORDERS  (customer online orders — status ≠ payment status)
-- =====================================================

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(40) NOT NULL,            -- ORD-MAS-2026-0001
    customer_id INT NOT NULL,
    fulfillment_type ENUM('Delivery','Pickup') NOT NULL DEFAULT 'Delivery',
    status ENUM('Pending','Confirmed','Processing','Ready for Pickup',
                'Out for Delivery','Completed','Cancelled')
           NOT NULL DEFAULT 'Pending',
    payment_status ENUM('Pending','Processing','Paid','Failed','Cancelled','Refunded')
                   NOT NULL DEFAULT 'Pending',

    -- buyer snapshot at time of order
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    customer_email VARCHAR(180) DEFAULT NULL,
    province VARCHAR(80) DEFAULT NULL,
    district VARCHAR(80) DEFAULT NULL,
    sector VARCHAR(80) DEFAULT NULL,
    address_details VARCHAR(255) DEFAULT NULL,
    delivery_instructions TEXT DEFAULT NULL,

    -- money (always recalculated server-side)
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    delivery_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'RWF',

    -- lifecycle guards
    stock_deducted TINYINT(1) NOT NULL DEFAULT 0, -- deduct stock exactly once
    linked_sale_id INT DEFAULT NULL,              -- soft link → sales.id (unified ledger)
    notes TEXT DEFAULT NULL,
    confirmed_by INT DEFAULT NULL,                -- users.id of the admin who confirmed
    placed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_orders_number (order_number),
    KEY idx_orders_status (status),
    KEY idx_orders_payment_status (payment_status),
    KEY idx_orders_customer (customer_id),
    KEY idx_orders_placed (placed_at),
    KEY idx_orders_sale (linked_sale_id),

    CONSTRAINT fk_orders_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
);

-- =====================================================
-- ORDER ITEMS  (price/cost snapshots — never trusted from client)
-- =====================================================

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_variant_id INT DEFAULT NULL,

    product_name VARCHAR(220) NOT NULL,           -- snapshot
    variant_label VARCHAR(190) DEFAULT NULL,      -- snapshot, e.g. "25kg" / "Red / 40mm"
    sku VARCHAR(100) DEFAULT NULL,                -- snapshot

    unit_price DECIMAL(12,2) NOT NULL,            -- price actually charged
    unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,-- cost at time of order (profit reporting)
    quantity INT NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    CONSTRAINT fk_order_items_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,

    KEY idx_order_items_order (order_id),
    KEY idx_order_items_product (product_id),
    KEY idx_order_items_variant (product_variant_id)
);

-- =====================================================
-- PAYMENTS  (provider transactions / reconciliation)
-- =====================================================

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_reference VARCHAR(40) NOT NULL,       -- PAY-MAS-2026-0001
    order_id INT NOT NULL,
    provider ENUM('IremboPay','Cash','Manual') NOT NULL DEFAULT 'IremboPay',
    payment_method ENUM('MTN','Airtel','Card','Cash') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'RWF',
    status ENUM('Pending','Processing','Paid','Failed','Cancelled','Refunded')
           NOT NULL DEFAULT 'Pending',

    provider_transaction_id VARCHAR(120) DEFAULT NULL,
    provider_payment_number VARCHAR(60) DEFAULT NULL,  -- MSISDN / card last4
    provider_response TEXT DEFAULT NULL,               -- raw payload, for reconciliation
    failure_reason VARCHAR(255) DEFAULT NULL,
    verified_at DATETIME DEFAULT NULL,                 -- set ONLY by backend verification
    paid_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_payments_reference (payment_reference),
    UNIQUE KEY uq_payments_provider_txn (provider, provider_transaction_id),
    KEY idx_payments_order (order_id),
    KEY idx_payments_status (status),

    CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- =====================================================
-- PAYMENT EVENTS  (webhook audit trail / idempotency)
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_events (
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
);

-- =====================================================
-- NOTIFICATIONS  (admin alerts)
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('new_order','pending_payment','low_stock','out_of_stock',
              'new_purchase','purchase_return','sale_return') NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT DEFAULT NULL,
    reference_type VARCHAR(30) DEFAULT NULL,
    reference_id INT DEFAULT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    KEY idx_notifications_unread (is_read, created_at),
    KEY idx_notifications_reference (reference_type, reference_id)
);

-- =====================================================
-- SEQUENCES  (race-safe reference numbers: ORD-/PAY-/INV-/RET-)
-- =====================================================

CREATE TABLE IF NOT EXISTS sequences (
    name VARCHAR(40) NOT NULL PRIMARY KEY,
    last_number INT NOT NULL DEFAULT 0
);

INSERT IGNORE INTO sequences (name, last_number) VALUES
    ('INV', 0), ('ORD', 0), ('PAY', 0), ('RET', 0), ('PRET', 0);
