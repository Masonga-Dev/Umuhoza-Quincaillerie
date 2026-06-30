import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';
import { exportToCSV } from '../utils/exportCSV';
import { useDataRefresh } from '../utils/dataEvents';
import ExportDropdown from '../components/ExportDropdown';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_SHORT = ['J','F','M','A','M','J','J','A','S','O','N','D'];

function fmt(v) { return Number(v || 0).toLocaleString('en-RW'); }
function fmtShort(v) {
  const n = Number(v || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(Math.round(n));
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' });
}
function timeAgo(d) {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Pie / Donut helpers ───────────────────────────────────────────────────────
function polar(deg, r = 1) {
  const a = (deg - 90) * (Math.PI / 180);
  return [+(Math.cos(a) * r).toFixed(5), +(Math.sin(a) * r).toFixed(5)];
}
function slicePath(startDeg, sweep) {
  if (sweep >= 359.99) {
    const [hx, hy] = polar(startDeg + 0.01);
    const [hx2, hy2] = polar(startDeg + 180);
    return `M ${hx} ${hy} A 1 1 0 1 1 ${hx2} ${hy2} A 1 1 0 1 1 ${hx} ${hy} Z`;
  }
  const [sx, sy] = polar(startDeg);
  const [ex, ey] = polar(startDeg + sweep);
  return `M 0 0 L ${sx} ${sy} A 1 1 0 ${sweep > 180 ? 1 : 0} 1 ${ex} ${ey} Z`;
}

// ── DonutChart ────────────────────────────────────────────────────────────────
function DonutChart({ data, centerLabel, centerSub }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  if (!total) return <p className="py-8 text-center text-sm text-slate-400">No data yet</p>;
  let cursor = 0;
  const arcs = data.filter(d => d.value > 0).map(d => {
    const sweep = (d.value / total) * 360;
    const arc = { ...d, path: slicePath(cursor, sweep), pct: Math.round((d.value / total) * 100) };
    cursor += sweep;
    return arc;
  });
  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative flex-shrink-0">
        <svg viewBox="-1.25 -1.25 2.5 2.5" className="w-32 h-32 drop-shadow-sm">
          {arcs.map((a, i) => (
            <path key={i} d={a.path} fill={a.color} stroke="white" strokeWidth="0.06"/>
          ))}
          <circle cx="0" cy="0" r="0.58" fill="white"/>
        </svg>
        {(centerLabel || centerSub) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {centerLabel && <span className="text-xs font-bold text-slate-800 leading-tight">{centerLabel}</span>}
            {centerSub   && <span className="text-[9px] text-slate-400 leading-tight">{centerSub}</span>}
          </div>
        )}
      </div>
      <div className="w-full space-y-2">
        {arcs.map((a, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: a.color }}/>
            <span className="flex-1 text-slate-600 truncate text-xs">{a.label}</span>
            <span className="font-semibold text-slate-800 text-xs">{a.display ?? fmt(a.value)}</span>
            <span className="w-8 text-right text-[10px] text-slate-400">{a.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── LineChart ─────────────────────────────────────────────────────────────────
function LineChart({ data, height = 180 }) {
  const W = 100, H = 65;
  const pad = { l: 6, r: 3, t: 4, b: 14 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const values = MONTHS.map((_, i) => {
    const row = data.find(d => Number(d.month) === i + 1);
    return Number(row?.total_sales || 0);
  });
  const maxVal = Math.max(...values, 1);

  const pts = values.map((v, i) => ({
    x: pad.l + (i / 11) * innerW,
    y: pad.t + innerH - (v / maxVal) * innerH,
    v,
  }));

  const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const fillD = `${lineD} L ${pts[11].x} ${pad.t + innerH} L ${pts[0].x} ${pad.t + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <defs>
        <linearGradient id="rptGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={pad.l} y1={pad.t + innerH - f * innerH} x2={W - pad.r} y2={pad.t + innerH - f * innerH}
          stroke="#f1f5f9" strokeWidth="0.4"/>
      ))}
      {[0.5, 1].map(f => (
        <text key={f} x="0.5" y={pad.t + innerH - f * innerH + 1.5} fontSize="2.8" fill="#cbd5e1">
          {fmtShort(maxVal * f)}
        </text>
      ))}
      <path d={fillD} fill="url(#rptGrad)"/>
      <path d={lineD} fill="none" stroke="#3b82f6" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round"/>
      {pts.map((p, i) => p.v > 0 && (
        <circle key={i} cx={p.x} cy={p.y} r="1.2" fill="#3b82f6"/>
      ))}
      {MONTH_SHORT.map((m, i) => (
        <text key={i} x={pts[i].x} y={H - 1} textAnchor="middle" fontSize="3" fill="#94a3b8">{m}</text>
      ))}
    </svg>
  );
}

// ── BarChart (Sales by Day) ───────────────────────────────────────────────────
function DayBarChart({ data, height = 160 }) {
  const today = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const bars = Array.from({ length: daysInMonth }, (_, i) => {
    const row = data.find(d => Number(d.day) === i + 1);
    return { day: i + 1, value: Number(row?.total || 0), isToday: i + 1 === today };
  });
  const maxVal = Math.max(...bars.map(b => b.value), 1);
  const W = 100, H = 70;
  const bw = W / daysInMonth;
  const pad = bw * 0.15;

  return (
    <svg viewBox={`0 0 ${W} ${H + 10}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      {[0.5, 1].map(f => (
        <line key={f} x1="0" y1={H - f * H} x2={W} y2={H - f * H} stroke="#f1f5f9" strokeWidth="0.4"/>
      ))}
      {bars.map((b, i) => {
        const barH = Math.max((b.value / maxVal) * H, b.value > 0 ? 1.5 : 0);
        const x = i * bw + pad;
        const w = bw - pad * 2;
        return (
          <g key={i}>
            <rect x={x} y={H - barH} width={w} height={barH}
              fill={b.isToday ? '#1d4ed8' : b.value > 0 ? '#93c5fd' : '#e2e8f0'} rx="0.8" opacity="0.92"/>
            {(i % 5 === 0 || i === daysInMonth - 1) && (
              <text x={x + w / 2} y={H + 7.5} textAnchor="middle" fontSize="3" fill="#94a3b8">{b.day}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KPI_CONFIGS = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-100' },
  green:  { bg: 'bg-emerald-50',icon: 'text-emerald-600',border: 'border-emerald-100' },
  purple: { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'border-violet-100' },
  amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  border: 'border-amber-100' },
};

function KpiCard({ label, value, pct, sub, color = 'blue', icon }) {
  const cfg = KPI_CONFIGS[color] || KPI_CONFIGS.blue;
  const hasPct = pct !== null && pct !== undefined;
  const isPos = pct >= 0;
  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-5 shadow-sm`}>
      <div className="flex items-start justify-between gap-2">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ${cfg.icon}`}>
          {icon}
        </div>
        {hasPct && (
          <span className={`flex items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-bold ${isPos ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
            {isPos ? '↑' : '↓'} {Math.abs(pct)}%
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-extrabold text-slate-900 leading-tight">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">
        {hasPct
          ? `${isPos ? '+' : ''}${pct}% from last month`
          : sub}
      </p>
    </div>
  );
}

// ── Section Heading ───────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-500">
      <span className="h-px flex-1 bg-amber-100"/>
      {children}
      <span className="h-px flex-1 bg-amber-100"/>
    </h3>
  );
}

// ── Insight Card ──────────────────────────────────────────────────────────────
function InsightCard({ title, value, desc, accent = '#3b82f6' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-start gap-4">
      <div className="mt-0.5 h-2 w-2 rounded-full flex-shrink-0" style={{ background: accent, marginTop: 6 }}/>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
        <p className="mt-1 text-base font-bold text-slate-900 truncate">{value}</p>
        <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminReports() {
  const [kpis, setKpis]               = useState(null);
  const [monthly, setMonthly]         = useState([]);
  const [daily, setDaily]             = useState(null);
  const [inventory, setInventory]     = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [supplierPerf, setSupplierPerf] = useState([]);
  const [salesByDay, setSalesByDay]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const { refreshKey, bindRefresh }   = useDataRefresh();

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      API.get('/reports/kpis'),
      API.get('/reports/monthly'),
      API.get('/reports/daily'),
      API.get('/reports/inventory'),
      API.get('/reports/recent-sales'),
      API.get('/reports/top-customers'),
      API.get('/reports/supplier-performance'),
      API.get('/reports/sales-by-day'),
    ]).then(([kRes, mRes, dRes, iRes, rsRes, tcRes, spRes, sbdRes]) => {
      setKpis(kRes.data);
      setMonthly(Array.isArray(mRes.data) ? mRes.data : []);
      setDaily(dRes.data);
      setInventory(Array.isArray(iRes.data) ? iRes.data : []);
      setRecentSales(Array.isArray(rsRes.data) ? rsRes.data : []);
      setTopCustomers(Array.isArray(tcRes.data) ? tcRes.data : []);
      setSupplierPerf(Array.isArray(spRes.data) ? spRes.data : []);
      setSalesByDay(Array.isArray(sbdRes.data) ? sbdRes.data : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData, refreshKey]);
  useEffect(bindRefresh, [bindRefresh]);

  const bestSelling    = daily?.best_selling    || [];
  const paymentMethods = daily?.payment_methods || [];
  const catRevenue     = daily?.category_revenue || [];

  const totalProducts = inventory.length;
  const inStockCount  = inventory.filter(i => i.status === 'In Stock').length;
  const lowCount      = inventory.filter(i => i.status === 'Low Stock').length;
  const outCount      = inventory.filter(i => i.status === 'Out of Stock').length;
  const stockValue    = inventory.reduce((s, i) => s + Number(i.stock_quantity || 0) * Number(i.cost_price || 0), 0);
  const curMonthIdx   = new Date().getMonth();

  const maxQtySold    = bestSelling[0]?.quantity_sold || 1;

  const catTotal = catRevenue.reduce((s, c) => s + Number(c.revenue || 0), 0) || 1;

  const CAT_COLORS  = ['#0ea5e9','#38bdf8','#7dd3fc','#0284c7','#0369a1','#67e8f9','#22d3ee','#06b6d4'];
  const PAY_COLORS  = { Cash: '#10b981', 'Mobile Money': '#8b5cf6', 'Bank Transfer': '#3b82f6' };

  // Business insights
  const bestMonth = monthly.reduce((best, m) => Number(m.total_sales) > Number(best?.total_sales || 0) ? m : best, null);
  const healthPct = totalProducts ? Math.round((inStockCount / totalProducts) * 100) : 0;
  const totalMonthSales = monthly.find(m => Number(m.month) === curMonthIdx + 1)?.total_sales || 0;
  const avgDailyRev = new Date().getDate() > 0 ? Math.round(Number(totalMonthSales) / new Date().getDate()) : 0;

  const exportBestSelling = () => exportToCSV(
    `top-products-${new Date().toISOString().slice(0,10)}.csv`,
    ['Product','Units Sold','Revenue (RWF)'],
    bestSelling.map(i => [i.name, i.quantity_sold, i.total_revenue])
  );
  const exportInventory = () => exportToCSV(
    `inventory-${new Date().toISOString().slice(0,10)}.csv`,
    ['Product','SKU','Category','Stock','Min Stock','Status','Cost Price'],
    inventory.map(i => [i.name, i.sku||'', i.category_name||'', i.stock_quantity, i.minimum_stock||5, i.status, i.cost_price||0])
  );

  return (
    <AdminLayout currentPage="/admin/reports">
      <div className="space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Analytics & Reports</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {MONTHS[curMonthIdx]} {new Date().getFullYear()} — live data from your store
            </p>
          </div>
          {!loading && (
            <div className="flex flex-wrap gap-2">
              <ExportDropdown label="Export Sales"     onExport={exportBestSelling}/>
              <ExportDropdown label="Export Inventory" onExport={exportInventory}/>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex h-56 items-center justify-center rounded-2xl bg-white shadow-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"/>
          </div>
        ) : (
          <>
            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <KpiCard
                label="Items Sold This Month"
                value={fmt(kpis?.items_sold?.value)}
                pct={kpis?.items_sold?.pct}
                color="blue"
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                  </svg>
                }
              />
              <KpiCard
                label="Average Sale"
                value={`${fmtShort(kpis?.avg_sale?.value)} RWF`}
                pct={kpis?.avg_sale?.pct}
                color="green"
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                }
              />
              <KpiCard
                label="Customers This Month"
                value={fmt(kpis?.new_customers?.value)}
                pct={kpis?.new_customers?.pct}
                color="purple"
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                }
              />
              <KpiCard
                label="Total Stock Value"
                value={`${fmtShort(kpis?.stock_value?.value ?? stockValue)} RWF`}
                pct={null}
                sub="Based on cost prices"
                color="amber"
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                }
              />
            </div>

            {/* ── Sales Trend + Category Revenue ── */}
            <section>
              <SectionTitle>Sales Performance</SectionTitle>
              <div className="grid gap-4 xl:grid-cols-3">
                <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-semibold text-slate-800">Monthly Sales Trend</p>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                      {new Date().getFullYear()}
                    </span>
                  </div>
                  {monthly.length > 0
                    ? <LineChart data={monthly} height={180}/>
                    : <p className="py-16 text-center text-sm text-slate-400">No sales data yet</p>}
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5"><span className="inline-block h-1.5 w-5 rounded bg-blue-500"/>Monthly revenue</span>
                    <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-blue-500"/>Data point</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="mb-4 font-semibold text-slate-800">Revenue by Category</p>
                  <DonutChart
                    data={catRevenue.length
                      ? catRevenue.map((c, i) => ({
                          label: c.category || 'Other',
                          value: Number(c.revenue),
                          display: `${fmtShort(c.revenue)} RWF`,
                          color: CAT_COLORS[i % CAT_COLORS.length],
                        }))
                      : [{ label: 'No sales', value: 1, color: '#e2e8f0', display: '—' }]}
                    centerLabel={catRevenue[0] ? `${Math.round((catRevenue[0].revenue / catTotal) * 100)}%` : '—'}
                    centerSub="top cat."
                  />
                </div>
              </div>
            </section>

            {/* ── Top Products + Payment Methods ── */}
            <section>
              <SectionTitle>Products & Payments</SectionTitle>
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="mb-5 font-semibold text-slate-800">Top Products (All Time)</p>
                  {bestSelling.length > 0 ? (
                    <div className="space-y-4">
                      {bestSelling.slice(0, 8).map((item, i) => {
                        const pct = Math.round((item.quantity_sold / maxQtySold) * 100);
                        return (
                          <div key={item.name} className="flex items-center gap-3">
                            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-slate-700 truncate">{item.name}</span>
                                <span className="ml-2 flex-shrink-0 text-xs font-bold text-violet-600">{item.quantity_sold} units</span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }}/>
                              </div>
                            </div>
                            <span className="flex-shrink-0 text-[11px] text-slate-400 w-16 text-right">{fmtShort(item.total_revenue)} RWF</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="py-10 text-center text-sm text-slate-400">No sales recorded yet</p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="mb-4 font-semibold text-slate-800">Payment Methods</p>
                  <DonutChart
                    data={paymentMethods.length
                      ? paymentMethods.map(p => ({
                          label: p.payment_method || 'Unknown',
                          value: Number(p.count),
                          display: `${p.count} txns`,
                          color: PAY_COLORS[p.payment_method] || '#64748b',
                        }))
                      : [{ label: 'No data', value: 1, color: '#e2e8f0', display: '—' }]}
                    centerLabel={paymentMethods.length ? paymentMethods[0]?.payment_method : '—'}
                    centerSub="top method"
                  />
                  {paymentMethods.length > 0 && (
                    <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4">
                      {paymentMethods.map(p => (
                        <div key={p.payment_method} className="flex justify-between text-xs">
                          <span className="text-slate-500">{p.payment_method}</span>
                          <span className="font-semibold text-slate-700">{fmt(p.total)} RWF</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ── Sales by Day ── */}
            <section>
              <SectionTitle>Sales by Day — {MONTHS[curMonthIdx]}</SectionTitle>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-slate-800">Daily Revenue (RWF)</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded bg-blue-700"/>Today</span>
                    <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded bg-blue-300"/>Other days</span>
                  </div>
                </div>
                <DayBarChart data={salesByDay} height={160}/>
                {salesByDay.length === 0 && (
                  <p className="mt-2 text-center text-sm text-slate-400">No sales recorded this month</p>
                )}
              </div>
            </section>

            {/* ── Inventory Health ── */}
            <section>
              <SectionTitle>Inventory Health</SectionTitle>
              <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="mb-4 font-semibold text-slate-800">Stock Status</p>
                  <DonutChart
                    data={[
                      { label: 'In Stock',     value: inStockCount, color: '#10b981', display: `${inStockCount}` },
                      { label: 'Low Stock',    value: lowCount,     color: '#f59e0b', display: `${lowCount}` },
                      { label: 'Out of Stock', value: outCount,     color: '#ef4444', display: `${outCount}` },
                    ]}
                    centerLabel={`${healthPct}%`}
                    centerSub="healthy"
                  />
                  {totalProducts > 0 && (
                    <div className="mt-4 h-2 rounded-full overflow-hidden flex gap-px">
                      {inStockCount > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${(inStockCount/totalProducts)*100}%` }}/>}
                      {lowCount > 0     && <div className="bg-amber-400  h-full" style={{ width: `${(lowCount/totalProducts)*100}%` }}/>}
                      {outCount > 0     && <div className="bg-red-500    h-full" style={{ width: `${(outCount/totalProducts)*100}%` }}/>}
                    </div>
                  )}
                  <p className="mt-1 text-right text-xs text-slate-400">{totalProducts} products total</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 content-start">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
                    <p className="text-sm font-medium text-emerald-700">In Stock</p>
                    <p className="mt-2 text-3xl font-extrabold text-emerald-700">{inStockCount}</p>
                    <p className="mt-1 text-xs text-emerald-500">products available</p>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
                    <p className="text-sm font-medium text-amber-700">Low Stock</p>
                    <p className="mt-2 text-3xl font-extrabold text-amber-600">{lowCount}</p>
                    <p className="mt-1 text-xs text-amber-500">need restocking soon</p>
                  </div>
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
                    <p className="text-sm font-medium text-red-700">Out of Stock</p>
                    <p className="mt-2 text-3xl font-extrabold text-red-600">{outCount}</p>
                    <p className="mt-1 text-xs text-red-500">restock immediately</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Business Insights ── */}
            <section>
              <SectionTitle>Business Insights</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {bestMonth && (
                  <InsightCard
                    title="Best Sales Month"
                    value={`${MONTHS[bestMonth.month - 1]} ${new Date().getFullYear()}`}
                    desc={`${fmt(bestMonth.total_sales)} RWF revenue — ${bestMonth.transactions} transactions`}
                    accent="#3b82f6"
                  />
                )}
                {bestSelling[0] && (
                  <InsightCard
                    title="Top Selling Product"
                    value={bestSelling[0].name}
                    desc={`${bestSelling[0].quantity_sold} units sold — ${fmtShort(bestSelling[0].total_revenue)} RWF`}
                    accent="#8b5cf6"
                  />
                )}
                {catRevenue[0] && (
                  <InsightCard
                    title="Best Revenue Category"
                    value={catRevenue[0].category || 'Uncategorized'}
                    desc={`${fmtShort(catRevenue[0].revenue)} RWF — ${Math.round((catRevenue[0].revenue / catTotal) * 100)}% of total`}
                    accent="#f59e0b"
                  />
                )}
                <InsightCard
                  title="Avg. Daily Revenue"
                  value={`${fmtShort(avgDailyRev)} RWF`}
                  desc={`${MONTHS[curMonthIdx]} so far — ${new Date().getDate()} days elapsed`}
                  accent="#10b981"
                />
              </div>
            </section>

            {/* ── Products Needing Attention ── */}
            {(lowCount > 0 || outCount > 0) && (
              <section>
                <SectionTitle>Products Needing Attention</SectionTitle>
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th className="py-3 px-4 text-left font-semibold text-slate-600">Product</th>
                          <th className="py-3 px-4 text-left font-semibold text-slate-600">Category</th>
                          <th className="py-3 px-4 text-right font-semibold text-slate-600">Stock</th>
                          <th className="py-3 px-4 text-right font-semibold text-slate-600">Min.</th>
                          <th className="py-3 px-4 text-left font-semibold text-slate-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.filter(i => i.status !== 'In Stock')
                          .sort((a, b) => a.stock_quantity - b.stock_quantity)
                          .map(item => (
                          <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <p className="font-medium text-slate-900">{item.name}</p>
                              {item.sku && <p className="font-mono text-xs text-slate-400">{item.sku}</p>}
                            </td>
                            <td className="py-3 px-4 text-slate-500">{item.category_name || '—'}</td>
                            <td className={`py-3 px-4 text-right font-bold ${item.status === 'Out of Stock' ? 'text-red-600' : 'text-amber-600'}`}>
                              {item.stock_quantity}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-400">{item.minimum_stock || 5}</td>
                            <td className="py-3 px-4">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'Out of Stock' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* ── Recent Sales ── */}
            <section>
              <SectionTitle>Recent Sales</SectionTitle>
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {recentSales.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th className="py-3 px-4 text-left font-semibold text-slate-600">Invoice</th>
                          <th className="py-3 px-4 text-left font-semibold text-slate-600">Customer</th>
                          <th className="py-3 px-4 text-left font-semibold text-slate-600">Payment</th>
                          <th className="py-3 px-4 text-right font-semibold text-slate-600">Amount (RWF)</th>
                          <th className="py-3 px-4 text-left font-semibold text-slate-600">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSales.map(s => (
                          <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 font-mono text-xs text-slate-700">{s.invoice_number || `#${s.id}`}</td>
                            <td className="py-3 px-4 font-medium text-slate-800">{s.customer_name || 'Walk-in'}</td>
                            <td className="py-3 px-4">
                              <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                                style={{ background: PAY_COLORS[s.payment_method] ? PAY_COLORS[s.payment_method] + '20' : '#f1f5f9',
                                         color: PAY_COLORS[s.payment_method] || '#475569' }}>
                                {s.payment_method || 'Cash'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-900">{fmt(s.total_amount)}</td>
                            <td className="py-3 px-4 text-slate-400 text-xs">{timeAgo(s.sale_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="py-10 text-center text-sm text-slate-400">No sales yet</p>
                )}
              </div>
            </section>

            {/* ── Top Customers + Supplier Performance ── */}
            <section>
              <SectionTitle>This Month</SectionTitle>
              <div className="grid gap-4 xl:grid-cols-2">
                {/* Top Customers */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <p className="font-semibold text-slate-800">Top Customers</p>
                    <p className="text-xs text-slate-400">{MONTHS[curMonthIdx]} {new Date().getFullYear()}</p>
                  </div>
                  {topCustomers.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="py-2.5 px-4 text-left text-xs font-semibold text-slate-500">Customer</th>
                          <th className="py-2.5 px-4 text-right text-xs font-semibold text-slate-500">Purchases</th>
                          <th className="py-2.5 px-4 text-right text-xs font-semibold text-slate-500">Spent (RWF)</th>
                          <th className="py-2.5 px-4 text-left text-xs font-semibold text-slate-500">Last Visit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topCustomers.map((c, i) => (
                          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="py-2.5 px-4 font-medium text-slate-800">{c.customer_name}</td>
                            <td className="py-2.5 px-4 text-right text-slate-600">{c.total_purchases}</td>
                            <td className="py-2.5 px-4 text-right font-semibold text-slate-900">{fmt(c.amount_spent)}</td>
                            <td className="py-2.5 px-4 text-xs text-slate-400">{fmtDate(c.last_purchase)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="py-8 text-center text-sm text-slate-400">No customer data for this month</p>
                  )}
                </div>

                {/* Supplier Performance */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <p className="font-semibold text-slate-800">Supplier Performance</p>
                    <p className="text-xs text-slate-400">{MONTHS[curMonthIdx]} {new Date().getFullYear()}</p>
                  </div>
                  {supplierPerf.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="py-2.5 px-4 text-left text-xs font-semibold text-slate-500">Supplier</th>
                          <th className="py-2.5 px-4 text-right text-xs font-semibold text-slate-500">Orders</th>
                          <th className="py-2.5 px-4 text-right text-xs font-semibold text-slate-500">Total (RWF)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supplierPerf.map((s, i) => (
                          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="py-2.5 px-4 font-medium text-slate-800">{s.supplier}</td>
                            <td className="py-2.5 px-4 text-right text-slate-600">{s.purchases}</td>
                            <td className="py-2.5 px-4 text-right font-semibold text-slate-900">{fmt(s.total_value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="py-8 text-center text-sm text-slate-400">No supplier purchases this month</p>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
