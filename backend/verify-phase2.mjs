/**
 * Phase 2 verification — tests product/category/variant changes.
 * Usage: node verify-phase2.mjs   (server must be running)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const BASE = `http://localhost:${process.env.PORT || 4000}`;
const pass = [], warn = [], fail = [];
const ok = (m) => pass.push(m), bad = (m) => fail.push(m), note = (m) => warn.push(m);
const writeReport = (txt) => { try { fs.writeFileSync(path.join(__dirname, 'phase2-report.txt'), txt); } catch {} };
process.on('uncaughtException', (e) => { writeReport('CRASH: ' + e.stack); process.exit(1); });
process.on('unhandledRejection', (e) => { writeReport('CRASH: ' + (e?.stack || e)); process.exit(1); });

const jwt = (await import('jsonwebtoken')).default;
const token = jwt.sign(
  { id: 1, name: 'Phase2 Verify', email: 'p2@verify.rw', role: 'admin' },
  process.env.JWT_SECRET, { expiresIn: '10m' }
);
const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

const J = async (url, opts = {}) => {
  const r = await fetch(BASE + url, { ...opts, headers: { ...(opts.headers || {}) } });
  const text = await r.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  return { status: r.status, body };
};

// 1. cost_price must NOT appear in public responses
{
  const list = await J('/api/public/products');
  if (list.status !== 200) bad(`public products list => ${list.status}`);
  else {
    ok('public products list => 200');
    if (JSON.stringify(list.body).includes('cost_price')) bad('public products LIST still exposes cost_price');
    else ok('public products LIST has no cost_price');
    const ids = Array.isArray(list.body) ? list.body.map(p => p.id) : [];
    if (!ids.length) note('public products list returned 0 products');
    let anyDetailLeak = false;
    for (const id of ids.slice(0, 5)) {
      const d = await J(`/api/public/products/${id}`);
      if (d.status !== 200) { note(`public product ${id} => ${d.status}`); continue; }
      if (JSON.stringify(d.body).includes('cost_price')) { anyDetailLeak = true; bad(`public product ${id} DETAIL exposes cost_price`); }
    }
    if (!anyDetailLeak && ids.length) ok('public product DETAIL responses have no cost_price');
  }
}

// 2. admin endpoints still return cost_price
{
  const prods = await J('/api/products', { headers: H });
  if (prods.status !== 200) bad(`admin products => ${prods.status}`);
  else {
    ok('admin products => 200');
    const rows = prods.body?.data || prods.body || [];
    if (!Array.isArray(rows) || !rows.length) note('admin products returned 0 rows');
    else if (JSON.stringify(rows).includes('cost_price')) ok('admin products still expose cost_price (needed for reports/CSV)');
    else note('admin products payload has no cost_price field at all');
  }
}

// 3. admin variant endpoint returns cost_price + new columns
{
  const prods = await J('/api/products', { headers: H });
  const rows = prods.body?.data || prods.body || [];
  const first = rows.find(p => p.id);
  if (!first) note('no products to test variants against');
  else {
    const v = await J(`/api/products/${first.id}/variants`, { headers: H });
    if (v.status !== 200) bad(`admin variants => ${v.status}`);
    else {
      ok('admin variants => 200');
      if (JSON.stringify(v.body).includes('cost_price')) ok('admin variants still expose cost_price');
      else note('admin variants payload has no cost_price');
      if (Array.isArray(v.body) && v.body.length) {
        ('is_active' in v.body[0]) ? ok('variants expose is_active') : bad('variants missing is_active column');
        ('attributes' in v.body[0]) ? ok('variants expose attributes') : bad('variants missing attributes column');
      } else note('no variants on this product to check new columns');
    }
  }
}

// 4. DB checks: variant attributes/is_active round-trip + price not clobbered
{
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, port: Number(process.env.DB_PORT), ssl: { rejectUnauthorized: false },
  });

  const [pv] = await conn.query(`SELECT COUNT(*) n FROM products p WHERE (SELECT COUNT(*) FROM product_variants v WHERE v.product_id=p.id) > 0`);
  const [priced] = await conn.query(`SELECT COUNT(*) n FROM products p WHERE (SELECT COUNT(*) FROM product_variants v WHERE v.product_id=p.id) > 0 AND p.selling_price > 0`);
  note(`products with variants: ${pv[0].n}; of those still priced > 0: ${priced[0].n}`);

  const [c1] = await conn.query(`SHOW COLUMNS FROM product_variants LIKE 'is_active'`);
  c1.length ? ok('product_variants.is_active exists') : bad('product_variants.is_active missing');
  const [c2] = await conn.query(`SHOW COLUMNS FROM product_variants LIKE 'attributes'`);
  c2.length ? ok('product_variants.attributes exists') : bad('product_variants.attributes missing');

  const [pp] = await conn.query('SELECT id FROM products ORDER BY id LIMIT 1');
  if (pp.length) {
    const pid = pp[0].id;
    const [[before]] = await conn.query('SELECT selling_price, cost_price FROM products WHERE id=?', [pid]);

    const create = await J(`/api/products/${pid}/variants`, {
      method: 'POST', headers: H,
      body: JSON.stringify({ color: 'TestC', size: 'L', selling_price: 1000, cost_price: 500, minimum_stock: 2,
        attributes: { length: '40mm', material: 'Steel' }, is_active: 0 }),
    });
    if (create.status === 201) {
      ok('variant created with attributes + is_active');
      const vid = create.body?.id;
      const [chk] = await conn.query('SELECT attributes, is_active FROM product_variants WHERE id=?', [vid]);
      if (chk.length) {
        const aStr = typeof chk[0].attributes === 'string' ? chk[0].attributes : JSON.stringify(chk[0].attributes);
        (aStr && aStr.includes('40mm')) ? ok('attributes JSON persisted correctly') : bad(`attributes not persisted: ${aStr}`);
        Number(chk[0].is_active) === 0 ? ok('is_active=0 persisted') : bad(`is_active expected 0 got ${chk[0].is_active}`);
      } else bad('created variant not found in DB');

      const pub = await J(`/api/public/products/${pid}`);
      if (pub.status === 200 && Array.isArray(pub.body?.variants)) {
        (!pub.body.variants.some(v => v.id === vid)) ? ok('inactive variant hidden from public detail') : bad('inactive variant still visible publicly');
      } else note(`public detail ${pid} => ${pub.status}`);

      const upd = await J(`/api/products/${pid}/variants/${vid}`, {
        method: 'PUT', headers: H,
        body: JSON.stringify({ color: 'TestC', size: 'L', selling_price: 1200, cost_price: 500, minimum_stock: 2,
          attributes: { length: '50mm' }, is_active: 1 }),
      });
      if (upd.status === 200) {
        ok('variant updated (attributes + is_active)');
        const [chk2] = await conn.query('SELECT attributes, is_active, selling_price FROM product_variants WHERE id=?', [vid]);
        const a2 = typeof chk2[0].attributes === 'string' ? chk2[0].attributes : JSON.stringify(chk2[0].attributes);
        a2.includes('50mm') ? ok('attributes updated to 50mm') : bad(`attributes update failed: ${a2}`);
        Number(chk2[0].is_active) === 1 ? ok('is_active updated to 1') : bad('is_active update failed');
        Number(chk2[0].selling_price) === 1200 ? ok('variant price updated to 1200') : bad(`price update failed: ${chk2[0].selling_price}`);
      } else bad(`variant update => ${upd.status}: ${JSON.stringify(upd.body)}`);

      const [[after]] = await conn.query('SELECT selling_price, cost_price FROM products WHERE id=?', [pid]);
      (Number(after.selling_price) === Number(before.selling_price) && Number(after.cost_price) === Number(before.cost_price))
        ? ok(`product-level price preserved through variant ops (was ${before.selling_price}, still ${after.selling_price})`)
        : bad(`product price CLOBBERED: before=${before.selling_price}/${before.cost_price} after=${after.selling_price}/${after.cost_price}`);

      const del = await J(`/api/products/${pid}/variants/${vid}`, { method: 'DELETE', headers: H });
      del.status === 200 ? ok('test variant deleted (cleanup)') : bad(`variant delete => ${del.status}`);
    } else bad(`variant create => ${create.status}: ${JSON.stringify(create.body)}`);
  } else note('no products available for variant round-trip test');

  await conn.end();
}

// 5. regression: existing endpoints still healthy
{
  const eps = ['/api/public/products', '/api/public/categories', '/api/public/homepage',
               '/api/products', '/api/sales', '/api/purchases', '/api/categories', '/api/subcategories'];
  let allOk = true;
  for (const e of eps) {
    const r = await J(e, { headers: H });
    if (r.status !== 200) { bad(`REGRESSION ${e} => ${r.status}`); allOk = false; }
  }
  if (allOk) ok(`all ${eps.length} regression endpoints => 200`);
}

const lines = [];
lines.push('');
lines.push('================ PHASE 2 VERIFICATION ================');
lines.push(`\nPASS: ${pass.length}`);
pass.forEach(m => lines.push(`  OK   ${m}`));
if (warn.length) { lines.push(`\nWARNINGS: ${warn.length}`); warn.forEach(m => lines.push(`  WARN ${m}`)); }
if (fail.length) { lines.push(`\nFAILURES: ${fail.length}`); fail.forEach(m => lines.push(`  FAIL ${m}`)); }
lines.push(`\nRESULT: ${fail.length === 0 ? 'ALL CHECKS PASSED' : fail.length + ' FAILURE(S)'}`);
const report = lines.join('\n');
console.log(report);
writeReport(report);
process.exit(fail.length === 0 ? 0 : 1);
