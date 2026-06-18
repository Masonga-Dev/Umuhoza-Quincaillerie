import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';
import { exportToCSV } from '../utils/exportCSV';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtFull(v) { return Number(v || 0).toLocaleString('en-RW'); }
function fmtShort(v) {
  const n = Number(v || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

// ── SVG Pie Chart ────────────────────────────────────────────────────────────
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

function PieChart({ data }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  if (!total) return <p className="py-10 text-center text-sm text-slate-400">No data yet</p>;

  let cursor = 0;
  const arcs = data
    .filter(d => d.value > 0)
    .map(d => {
      const sweep = (d.value / total) * 360;
      const arc = { ...d, path: slicePath(cursor, sweep), pct: Math.round((d.value / total) * 100) };
      cursor += sweep;
      return arc;
    });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="-1.15 -1.15 2.3 2.3" className="w-40 h-40 flex-shrink-0 drop-shadow-sm">
        {arcs.map((a, i) => (
          <path key={i} d={a.path} fill={a.color} stroke="white" strokeWidth="0.05" />
        ))}
      </svg>
      <div className="w-full space-y-2">
        {arcs.map((a, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: a.color }} />
            <span className="flex-1 text-slate-600 truncate">{a.label}</span>
            <span className="font-bold text-slate-900">{a.display ?? a.value}</span>
            <span className="w-9 text-right text-xs text-slate-400">{a.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SVG Bar Chart (Histogram) ─────────────────────────────────────────────────
function BarChart({ bars, height = 160, showLabels = true }) {
  const maxVal = Math.max(...bars.map(b => b.value || 0), 1);
  const n = bars.length;
  const W = 100, H = 70;
  const bw = W / n;
  const pad = bw * 0.18;

  return (
    <svg
      viewBox={`0 0 ${W} ${H + (showLabels ? 11 : 2)}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height }}
    >
      {/* Gridlines */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1="0" y1={H - f * H} x2={W} y2={H - f * H}
          stroke="#f1f5f9" strokeWidth="0.5" />
      ))}
      {/* Y-axis value labels */}
      {[0.5, 1].map(f => (
        <text key={f} x="0.5" y={H - f * H + 1.5} fontSize="3.2" fill="#cbd5e1">{fmtShort(maxVal * f)}</text>
      ))}
      {bars.map((b, i) => {
        const barH = Math.max(((b.value || 0) / maxVal) * H, b.value > 0 ? 1.5 : 0);
        const x = i * bw + pad;
        const w = bw - pad * 2;
        const isHigh = barH > H * 0.82;
        return (
          <g key={i}>
            <rect x={x} y={H - barH} width={w} height={barH}
              fill={b.color || '#3b82f6'} rx="1.8" opacity="0.92" />
            {b.value > 0 && (
              <text x={x + w / 2} y={isHigh ? H - barH + 5.5 : H - barH - 2}
                textAnchor="middle" fontSize="3.2" fill={isHigh ? 'white' : '#64748b'}>
                {fmtShort(b.value)}
              </text>
            )}
            {showLabels && (
              <text x={x + w / 2} y={H + 8.5}
                textAnchor="middle" fontSize="3.8" fill="#94a3b8">
                {b.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function Card({ label, value, sub, color = 'text-blue-600' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

// ── Section title ─────────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-amber-500">{children}</h3>;
}

// ── Main Component ────────────────────────────────────────────────────────────
function AdminReports() {
  const [daily, setDaily]     = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/reports/daily'),
      API.get('/reports/monthly'),
      API.get('/reports/inventory'),
    ])
      .then(([dRes, mRes, iRes]) => {
        setDaily(dRes.data);
        setMonthly(Array.isArray(mRes.data) ? mRes.data : []);
        setInventory(Array.isArray(iRes.data) ? iRes.data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalProducts  = inventory.length;
  const inStockCount   = inventory.filter(i => i.status === 'In Stock').length;
  const lowCount       = inventory.filter(i => i.status === 'Low Stock').length;
  const outCount       = inventory.filter(i => i.status === 'Out of Stock').length;

  const bestSelling    = daily?.best_selling   || [];
  const paymentMethods = daily?.payment_methods || [];
  const catRevenue     = daily?.category_revenue || [];

  // Build 12-month histogram — current month gets a brighter bar
  const curMonth = new Date().getMonth();
  const monthlyBars = MONTHS.map((name, i) => {
    const row = monthly.find(r => Number(r.month) === i + 1);
    return {
      label: name,
      value: Number(row?.total_sales || 0),
      color: i === curMonth ? '#1d4ed8' : '#93c5fd',
    };
  });

  // Top products histogram
  const maxQty = bestSelling[0]?.quantity_sold || 1;
  const PROD_COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#f5f3ff', '#ede9fe', '#ddd6fe'];
  const productBars = bestSelling.slice(0, 8).map((b, i) => ({
    label: b.name.length > 9 ? b.name.slice(0, 8) + '…' : b.name,
    value: Number(b.quantity_sold),
    color: PROD_COLORS[i] || '#8b5cf6',
  }));

  // Category revenue histogram
  const CAT_COLORS = ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd'];
  const categoryBars = catRevenue.map((c, i) => ({
    label: (c.category || 'Other').slice(0, 9),
    value: Number(c.revenue),
    color: CAT_COLORS[i] || '#0ea5e9',
  }));

  return (
    <AdminLayout currentPage="/admin/reports">
      <div className="space-y-8">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Reports & Analytics</h2>
            <p className="mt-1 text-sm text-slate-500">Sales performance and inventory health.</p>
          </div>
          {!loading && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => exportToCSV(
                  `sales-${new Date().toISOString().slice(0, 10)}.csv`,
                  ['Product', 'Units Sold', 'Revenue (RWF)'],
                  bestSelling.map(i => [i.name, i.quantity_sold, i.total_revenue])
                )}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Export Sales
              </button>
              <button
                onClick={() => exportToCSV(
                  `inventory-${new Date().toISOString().slice(0, 10)}.csv`,
                  ['Product', 'SKU', 'Category', 'Stock', 'Min Stock', 'Status'],
                  inventory.map(i => [i.name, i.sku || '', i.category_name || '', i.stock_quantity, i.minimum_stock || 5, i.status])
                )}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Export Inventory
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center rounded-2xl bg-white shadow-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* ── KPI Cards ── */}
            <section>
              <SectionTitle>Today's Performance</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card label="Today's Revenue" value={`${fmtFull(daily?.summary?.total_sales)} RWF`} color="text-blue-600" />
                <Card label="Transactions Today" value={daily?.summary?.total_transactions ?? 0} color="text-emerald-600" />
                <Card
                  label="Top Product (All-Time)"
                  value={bestSelling[0]?.name || 'No sales yet'}
                  sub={bestSelling[0] ? `${bestSelling[0].quantity_sold} units sold` : ''}
                  color="text-purple-600"
                />
                <Card
                  label="Avg. Sale Value"
                  value={daily?.summary?.total_transactions
                    ? `${fmtFull(daily.summary.total_sales / daily.summary.total_transactions)} RWF`
                    : '—'}
                  color="text-slate-700"
                />
              </div>
            </section>

            {/* ── Monthly Revenue Histogram + Payment Pie ── */}
            <section>
              <SectionTitle>Revenue Overview — {new Date().getFullYear()}</SectionTitle>
              <div className="grid gap-4 xl:grid-cols-[1fr_320px]">

                {/* Histogram */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Monthly Revenue (RWF)</p>
                    <span className="text-xs text-slate-400">
                      Current month: <span className="font-semibold text-blue-700">{MONTHS[curMonth]}</span>
                    </span>
                  </div>
                  <BarChart bars={monthlyBars} height={180} />
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-blue-700 inline-block" /> Current month</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-blue-300 inline-block" /> Other months</span>
                  </div>
                </div>

                {/* Payment Methods Pie */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="mb-4 text-sm font-semibold text-slate-700">Payment Methods (All-Time)</p>
                  <PieChart data={
                    paymentMethods.length
                      ? paymentMethods.map(p => ({
                          label: p.payment_method || 'Unknown',
                          value: Number(p.count),
                          display: `${p.count} txns`,
                          color: p.payment_method === 'Cash' ? '#10b981'
                               : p.payment_method === 'Mobile Money' ? '#8b5cf6'
                               : '#3b82f6',
                        }))
                      : [{ label: 'No sales yet', value: 1, color: '#e2e8f0' }]
                  } />
                  {paymentMethods.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-1">
                      {paymentMethods.map(p => (
                        <div key={p.payment_method} className="flex justify-between text-xs text-slate-500">
                          <span>{p.payment_method}</span>
                          <span className="font-semibold text-slate-700">{fmtFull(p.total)} RWF</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ── Top Products Histogram + Category Revenue ── */}
            {bestSelling.length > 0 && (
              <section>
                <SectionTitle>Product & Category Performance</SectionTitle>
                <div className="grid gap-4 xl:grid-cols-2">

                  {/* Top Products Histogram */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="mb-3 text-sm font-semibold text-slate-700">Top Products — Units Sold</p>
                    {productBars.length > 0
                      ? <BarChart bars={productBars} height={160} />
                      : <p className="text-center text-sm text-slate-400 py-8">No sales data</p>}
                    <div className="mt-4 space-y-2">
                      {bestSelling.slice(0, 5).map((item, idx) => (
                        <div key={item.name} className="flex items-center gap-3">
                          <span className="flex-shrink-0 h-5 w-5 rounded-full bg-slate-100 text-xs font-bold text-slate-500 flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="flex-1 truncate text-sm text-slate-700">{item.name}</span>
                          <span className="text-xs font-bold text-violet-600">{item.quantity_sold} units</span>
                          <span className="text-xs text-slate-400">{fmtShort(item.total_revenue)} RWF</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category Revenue Histogram */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="mb-3 text-sm font-semibold text-slate-700">Revenue by Category (RWF)</p>
                    {categoryBars.length > 0
                      ? <BarChart bars={categoryBars} height={160} />
                      : <p className="text-center text-sm text-slate-400 py-8">No sales data</p>}
                    <div className="mt-4 space-y-2">
                      {catRevenue.slice(0, 5).map((c, idx) => (
                        <div key={c.category} className="flex items-center gap-3">
                          <span className="flex-shrink-0 h-5 w-5 rounded-full bg-slate-100 text-xs font-bold text-slate-500 flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="flex-1 truncate text-sm text-slate-700">{c.category || 'Uncategorised'}</span>
                          <span className="text-xs font-bold text-sky-600">{fmtShort(c.revenue)} RWF</span>
                          <span className="text-xs text-slate-400">{c.units} units</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── Inventory Health ── */}
            <section>
              <SectionTitle>Inventory Health</SectionTitle>
              <div className="grid gap-4 xl:grid-cols-[320px_1fr]">

                {/* Inventory Status Pie */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="mb-4 text-sm font-semibold text-slate-700">Stock Status Distribution</p>
                  <PieChart data={[
                    { label: 'In Stock',      value: inStockCount, color: '#10b981' },
                    { label: 'Low Stock',     value: lowCount,     color: '#f59e0b' },
                    { label: 'Out of Stock',  value: outCount,     color: '#ef4444' },
                  ]} />
                  {/* Stacked bar */}
                  {totalProducts > 0 && (
                    <div className="mt-5">
                      <div className="h-3 rounded-full overflow-hidden flex gap-px">
                        {inStockCount > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${(inStockCount / totalProducts) * 100}%` }} />}
                        {lowCount     > 0 && <div className="bg-amber-400  h-full" style={{ width: `${(lowCount / totalProducts) * 100}%` }} />}
                        {outCount     > 0 && <div className="bg-red-500    h-full" style={{ width: `${(outCount / totalProducts) * 100}%` }} />}
                      </div>
                      <p className="mt-1 text-xs text-slate-400 text-right">{totalProducts} products total</p>
                    </div>
                  )}
                </div>

                {/* KPI Cards */}
                <div className="grid gap-4 sm:grid-cols-2 content-start">
                  <Card label="Total Products"  value={totalProducts}  color="text-slate-900" />
                  <Card label="In Stock"        value={inStockCount}   color="text-emerald-600" />
                  <Card label="Low Stock"       value={lowCount}       color="text-amber-600"  sub="Need restocking soon" />
                  <Card label="Out of Stock"    value={outCount}       color="text-red-600"    sub="Restock immediately" />
                </div>
              </div>
            </section>

            {/* ── Products Needing Attention ── */}
            {(lowCount > 0 || outCount > 0) && (
              <section>
                <SectionTitle>Products Needing Attention</SectionTitle>
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
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
                      {inventory
                        .filter(i => i.status !== 'In Stock')
                        .sort((a, b) => a.stock_quantity - b.stock_quantity)
                        .map(item => (
                          <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 font-medium text-slate-900">{item.name}</td>
                            <td className="py-3 px-4 text-slate-500">{item.category_name || '—'}</td>
                            <td className={`py-3 px-4 text-right font-bold ${item.status === 'Out of Stock' ? 'text-red-600' : 'text-amber-600'}`}>
                              {item.stock_quantity}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-500">{item.minimum_stock || 5}</td>
                            <td className="py-3 px-4">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === 'Out of Stock' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminReports;
