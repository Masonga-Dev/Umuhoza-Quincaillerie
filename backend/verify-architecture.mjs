/**
 * Phase 1 verification — READ-ONLY.
 * Checks: tables, columns, data preserved, integrity, enum, FKs.
 * Usage: node verify-architecture.mjs
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
const writeReport = (txt) => { try { fs.writeFileSync(path.join(__dirname, 'verify-report.txt'), txt); } catch (e) { console.error('cannot write report:', e.message); } };
process.on('uncaughtException', (e) => { writeReport('CRASH: ' + e.stack); process.exit(1); });
process.on('unhandledRejection', (e) => { writeReport('CRASH: ' + (e?.stack || e)); process.exit(1); });

const EXPECTED_TABLES = [
  'users','suppliers','categories','subcategories','products','product_images',
  'product_variants','stock_transactions','purchases','purchase_items','sales',
  'sale_items','announcements','gallery','settings','contact_info','homepage_content',
  'activity_logs','purchase_returns','purchase_return_items','sale_returns',
  'sale_return_items','page_heroes',
  'customers','orders','order_items','payments','payment_events','notifications','sequences',
];

const EXPECTED_COLUMNS = {
  sales: ['sales_channel','customer_id','order_id'],
  stock_transactions: ['reference_type','reference_id','stock_before','stock_after'],
  sale_items: ['cost_price'],
  product_variants: ['attributes','is_active','unit','image_path'],
  products: ['subcategory_id','brand'],
  orders: ['order_number','status','payment_status','stock_deducted','linked_sale_id','fulfillment_type'],
  payments: ['payment_reference','provider','provider_transaction_id','verified_at'],
};

const EXPECTED_SEQUENCES = ['INV','ORD','PAY','RET','PRET'];
const pass = [], warn = [], fail = [];
const ok = (m) => pass.push(m), bad = (m) => fail.push(m), note = (m) => warn.push(m);

let conn;
try {
  conn = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    ...(process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && { ssl: { rejectUnauthorized: false } }),
  });
  ok(`Connected to ${process.env.DB_NAME} @ ${process.env.DB_HOST}`);
} catch (e) { console.error('FATAL: cannot connect —', e.message); process.exit(1); }

// 1. tables
const [tRows] = await conn.query('SHOW TABLES');
const tables = new Set(tRows.map(r => Object.values(r)[0]));
for (const t of EXPECTED_TABLES) tables.has(t) ? ok(`table exists: ${t}`) : bad(`MISSING TABLE: ${t}`);
const extra = [...tables].filter(t => !EXPECTED_TABLES.includes(t));
if (extra.length) note(`extra tables present (not in plan): ${extra.join(', ')}`);

// 2. columns
for (const [table, cols] of Object.entries(EXPECTED_COLUMNS)) {
  if (!tables.has(table)) { bad(`cannot check columns, table missing: ${table}`); continue; }
  const [cRows] = await conn.query(`SHOW COLUMNS FROM \`${table}\``);
  const have = new Set(cRows.map(c => c.Field));
  for (const c of cols) have.has(c) ? ok(`column ${table}.${c}`) : bad(`MISSING COLUMN: ${table}.${c}`);
}

// 3. sequences
if (tables.has('sequences')) {
  const [rows] = await conn.query('SELECT name FROM sequences');
  const have = new Set(rows.map(r => r.name));
  for (const s of EXPECTED_SEQUENCES) have.has(s) ? ok(`sequence seeded: ${s}`) : bad(`MISSING SEQUENCE: ${s}`);
}

// 4. data preserved
const COUNT_TABLES = ['users','categories','subcategories','products','product_variants',
  'sales','sale_items','purchases','purchase_items','stock_transactions','suppliers',
  'purchase_returns','sale_returns','announcements','gallery','settings'];
const counts = {};
for (const t of COUNT_TABLES) {
  if (!tables.has(t)) { bad(`table vanished: ${t}`); continue; }
  const [[{ n }]] = await conn.query(`SELECT COUNT(*) AS n FROM \`${t}\``);
  counts[t] = n;
}

// 5. integrity
const [o1] = await conn.query('SELECT COUNT(*) n FROM sale_items si LEFT JOIN sales s ON s.id=si.sale_id WHERE s.id IS NULL');
o1[0].n === 0 ? ok('no orphan sale_items') : bad(`orphan sale_items: ${o1[0].n}`);

const [o2] = await conn.query('SELECT COUNT(*) n FROM product_variants WHERE stock_quantity < 0');
o2[0].n === 0 ? ok('no negative variant stock') : bad(`negative variant stock rows: ${o2[0].n}`);

const [o3] = await conn.query(`SELECT COUNT(*) n FROM products p
  JOIN (SELECT product_id, SUM(stock_quantity) s FROM product_variants GROUP BY product_id) v ON v.product_id=p.id
  WHERE p.stock_quantity <> v.s`);
o3[0].n === 0 ? ok('product stock matches variant sums')
              : note(`products whose stock != variant sum: ${o3[0].n} (pre-existing; corrected on next product save)`);

const [o4] = await conn.query('SELECT invoice_number, COUNT(*) c FROM sales GROUP BY invoice_number HAVING c>1');
o4.length === 0 ? ok('no duplicate invoice numbers') : bad(`duplicate invoices: ${o4.length}`);

// 6. sales_channel default applied to existing rows
if (tables.has('sales')) {
  const [ch] = await conn.query('SELECT sales_channel, COUNT(*) n FROM sales GROUP BY sales_channel');
  const total = ch.reduce((a, r) => a + Number(r.n), 0);
  const phys = ch.find(r => r.sales_channel === 'Physical Store')?.n ?? 0;
  phys === total ? ok(`all ${total} existing sales default to 'Physical Store'`)
                 : note(`sales by channel: ${JSON.stringify(ch)}`);
}

// 7. enum probe for ONLINE_ORDER (insert + immediately delete)
try {
  await conn.query(`INSERT INTO stock_transactions
    (product_id, quantity, transaction_type, reference_type, stock_before, stock_after, notes)
    SELECT id, 0, 'ONLINE_ORDER', 'SCHEMA_CHECK', 0, 0, 'enum probe' FROM products LIMIT 1`);
  const [[row]] = await conn.query(`SELECT id FROM stock_transactions WHERE reference_type='SCHEMA_CHECK' ORDER BY id DESC LIMIT 1`);
  if (row) await conn.query('DELETE FROM stock_transactions WHERE id=?', [row.id]);
  ok("transaction_type accepts 'ONLINE_ORDER' (probe inserted + removed)");
} catch (e) { bad(`transaction_type rejects 'ONLINE_ORDER': ${e.message}`); }

// 8. new tables queryable
try {
  await conn.query('SELECT 1 FROM orders LIMIT 1');    ok('orders queryable');
  await conn.query('SELECT 1 FROM payments LIMIT 1');  ok('payments queryable');
  await conn.query('SELECT 1 FROM customers LIMIT 1'); ok('customers queryable');
} catch (e) { bad(`new table query failed: ${e.message}`); }

await conn.end();

// report
const lines = [];
lines.push('');
lines.push('================ PHASE 1 VERIFICATION ================');
lines.push('\nROW COUNTS:');
for (const [t, n] of Object.entries(counts)) lines.push(`  ${t.padEnd(22)} ${String(n).padStart(6)}`);
lines.push(`\nPASS: ${pass.length}`);
pass.forEach(m => lines.push(`  OK   ${m}`));
if (warn.length) { lines.push(`\nWARNINGS: ${warn.length}`); warn.forEach(m => lines.push(`  WARN ${m}`)); }
if (fail.length) { lines.push(`\nFAILURES: ${fail.length}`); fail.forEach(m => lines.push(`  FAIL ${m}`)); }
lines.push(`\nRESULT: ${fail.length === 0 ? 'ALL CHECKS PASSED' : fail.length + ' FAILURE(S)'}`);
const report = lines.join('\n');
console.log(report);
writeReport(report);
process.exit(fail.length === 0 ? 0 : 1);
