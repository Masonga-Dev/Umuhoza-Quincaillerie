/**
 * Remaining-phases verification — returns lists, dashboard overview, security.
 * Usage: (server running) → node verify-remaining.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const BASE = `http://localhost:${process.env.PORT || 4000}`;
const pass = [], warn = [], fail = [];
const ok = (m) => pass.push(m), bad = (m) => fail.push(m), note = (m) => warn.push(m);
const writeReport = (txt) => { try { fs.writeFileSync(path.join(__dirname, 'remaining-report.txt'), txt); } catch {} };
process.on('uncaughtException', (e) => { writeReport('CRASH: ' + e.stack); process.exit(1); });
process.on('unhandledRejection', (e) => { writeReport('CRASH: ' + (e?.stack || e)); process.exit(1); });

const jwt = (await import('jsonwebtoken')).default;
const token = jwt.sign(
  { id: 1, name: 'Remaining Verify', email: 'rv@verify.rw', role: 'admin' },
  process.env.JWT_SECRET, { expiresIn: '15m' }
);
const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

const J = async (url, opts = {}) => {
  const r = await fetch(BASE + url, { ...opts, headers: { ...(opts.headers || {}) } });
  const text = await r.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  return { status: r.status, body, headers: r.headers };
};

// ── 1. Security headers ───────────────────────────────────────────────────────
{
  const r = await J('/');
  r.headers.get('x-content-type-options') === 'nosniff' ? ok('security header X-Content-Type-Options') : bad('missing nosniff header');
  r.headers.get('x-frame-options') === 'DENY' ? ok('security header X-Frame-Options') : bad('missing X-Frame-Options');
}

// ── 2. CORS: disallowed origin gets no ACAO header; allowed dev origin does ───
{
  const r1 = await fetch(BASE + '/', { headers: { Origin: 'http://evil.example.com' } });
  !r1.headers.get('access-control-allow-origin') ? ok('CORS blocks unknown origin (no ACAO header)') : bad('CORS leaked ACAO to unknown origin');
  const r2 = await fetch(BASE + '/', { headers: { Origin: 'http://localhost:5173' } });
  r2.headers.get('access-control-allow-origin') === 'http://localhost:5173'
    ? ok('CORS allows dev origin') : bad(`CORS dev origin rejected (${r2.headers.get('access-control-allow-origin')})`);
}

// ── 3. GET /api/purchases/returns ─────────────────────────────────────────────
{
  const noAuth = await J('/api/purchases/returns');
  noAuth.status === 401 ? ok('purchases/returns requires auth => 401') : bad(`purchases/returns no-auth => ${noAuth.status}`);

  const r = await J('/api/purchases/returns', { headers: H });
  if (r.status !== 200) bad(`purchases/returns => ${r.status}`);
  else if (!Array.isArray(r.body)) bad('purchases/returns not an array');
  else {
    ok(`purchases/returns => 200 (${r.body.length} returns)`);
    if (r.body.length) {
      const p = r.body[0];
      (p.reference_number !== undefined && p.supplier_name !== undefined && Array.isArray(p.items))
        ? ok('purchase return includes ref + supplier + items')
        : bad(`purchase return shape wrong: ${JSON.stringify(Object.keys(p))}`);
      r.body.every(x => x.created_at) ? ok('purchase returns carry created_at') : bad('missing created_at');
    }
  }
}

// ── 4. GET /api/sales/returns ─────────────────────────────────────────────────
{
  const noAuth = await J('/api/sales/returns');
  noAuth.status === 401 ? ok('sales/returns requires auth => 401') : bad(`sales/returns no-auth => ${noAuth.status}`);

  const r = await J('/api/sales/returns', { headers: H });
  if (r.status !== 200) bad(`sales/returns => ${r.status}`);
  else if (!Array.isArray(r.body)) bad('sales/returns not an array');
  else {
    ok(`sales/returns => 200 (${r.body.length} returns)`);
    if (r.body.length) {
      const s = r.body[0];
      (s.invoice_number !== undefined && s.refund_amount !== undefined && Array.isArray(s.items))
        ? ok('sales return includes invoice + refund + items')
        : bad(`sales return shape wrong: ${JSON.stringify(Object.keys(s))}`);
    }
  }
}

// ── 5. GET /api/reports/overview (dashboard) ─────────────────────────────────
{
  const noAuth = await J('/api/reports/overview');
  noAuth.status === 401 ? ok('reports/overview requires auth => 401') : bad(`reports/overview no-auth => ${noAuth.status}`);

  const r = await J('/api/reports/overview?range=today', { headers: H });
  if (r.status !== 200) {
    bad(`reports/overview => ${r.status}`);
  } else {
    const b = r.body;
    ok('overview (range=today) => 200');
    const need = ['range', 'sales_count', 'sales_total', 'online_sales', 'physical_sales', 'cash_sales',
                  'gross_profit', 'orders_total', 'orders_pending', 'orders_paid', 'payments_pending',
                  'low_stock', 'out_of_stock', 'trend'];
    const missing = need.filter(k => !(k in b));
    missing.length === 0
      ? ok('overview payload complete (sales/orders/payments/inventory/trend)')
      : bad(`overview missing keys: ${missing.join(', ')}`);
    Array.isArray(b.trend) ? ok('overview trend is an array') : bad(`overview trend not an array: ${typeof b.trend}`);
    b.range === 'today' ? ok('overview echoes range=today') : bad(`overview range=${b.range}`);
  }

  const w = await J('/api/reports/overview?range=week', { headers: H });
  w.status === 200 && w.body?.range === 'week'
    ? ok('overview (range=week) => 200') : bad(`overview range=week => ${w.status}`);
}

// ── report ─────────────────────────────────────────────────────────────────────
const lines = [];
lines.push('');
lines.push('============ REMAINING-PHASES VERIFICATION ============');
lines.push(`\nPASS: ${pass.length}`);
pass.forEach(m => lines.push(`  OK   ${m}`));
if (warn.length) { lines.push(`\nWARNINGS: ${warn.length}`); warn.forEach(m => lines.push(`  WARN ${m}`)); }
if (fail.length) { lines.push(`\nFAILURES: ${fail.length}`); fail.forEach(m => lines.push(`  FAIL ${m}`)); }
lines.push(`\nRESULT: ${fail.length === 0 ? 'ALL CHECKS PASSED' : fail.length + ' FAILURE(S)'}`);
const report = lines.join('\n');
console.log(report);
writeReport(report);
process.exit(fail.length === 0 ? 0 : 1);

