import { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import AdminLayout from '../components/AdminLayout';
import API from '../api';
import { exportToCSV } from '../utils/exportCSV';
import { useDataRefresh } from '../utils/dataEvents';
import ExportDropdown from '../components/ExportDropdown';
import { useLanguage } from '../i18n/LanguageContext';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmt(v) { return Number(v || 0).toLocaleString('en-RW'); }
function fmtShort(v) {
  const n = Number(v || 0);
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)}K`;
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

// ── Palette ──────────────────────────────────────────────────────────────────
// Fixed-order categorical hues, validated for CVD-safe adjacency (see dataviz skill).
const C = {
  blue: '#2563eb', amber: '#f59e0b', emerald: '#10b981', violet: '#8b5cf6',
  red: '#ef4444', cyan: '#06b6d4', pink: '#ec4899', slate: '#94a3b8',
};
const CATEGORICAL = [C.blue, C.amber, C.emerald, C.violet, C.red, C.cyan, C.pink];
const PAY_COLORS = { Cash: C.emerald, 'Mobile Money': C.violet, 'Bank Transfer': C.blue };
const STOCK_TYPE_META = {
  IN:         { label: 'Stock In',     color: C.emerald },
  OUT:        { label: 'Stock Out',    color: C.blue },
  ADJUSTMENT: { label: 'Adjustment',   color: C.amber },
  RETURN_IN:  { label: 'Return (In)',  color: C.cyan },
  RETURN_OUT: { label: 'Return (Out)', color: C.red },
};
const GRID = '#f1f5f9';
const AXIS_TICK = { fontSize: 11, fill: '#94a3b8' };

// Fold long tails into "Other" so a categorical chart never exceeds the
// validated slot count — a generated 8th+ hue is never used for identity.
function foldOther(rows, valueKey, labelKey, max = 6) {
  if (rows.length <= max) return rows;
  const rest = rows.slice(max).reduce((s, r) => s + Number(r[valueKey] || 0), 0);
  return [...rows.slice(0, max), { [labelKey]: 'Other', [valueKey]: rest, __other: true }];
}

// ── Tooltip primitives ────────────────────────────────────────────────────────
function TooltipCard({ children }) {
  return (
    <div className="min-w-[150px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg">
      {children}
    </div>
  );
}
function TooltipRow({ color, label, value }) {
  return (
    <div className="flex items-center gap-2 py-0.5 text-xs">
      <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: color }}/>
      <span className="text-slate-500">{label}</span>
      <span className="ml-auto font-bold tabular-nums text-slate-900">{value}</span>
    </div>
  );
}
function TooltipLabel({ children }) {
  return <p className="mb-1 text-[11px] font-semibold text-slate-400">{children}</p>;
}

// ── DonutChart (Recharts Pie + side legend/value list) ────────────────────────
function DonutChart({ data, centerLabel, centerSub, valueUnit = '' }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  if (!total) return <p className="py-10 text-center text-sm text-slate-400">No data yet</p>;

  const renderTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <TooltipCard>
        <TooltipRow color={d.color} label={d.label} value={d.display ?? `${fmt(d.value)}${valueUnit}`}/>
      </TooltipCard>
    );
  };

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-[168px] w-[168px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data} dataKey="value" nameKey="label"
              innerRadius={54} outerRadius={80}
              paddingAngle={data.length > 1 ? 2 : 0} cornerRadius={3}
              stroke="#fff" strokeWidth={2} isAnimationActive={false}
            >
              {data.map((d, i) => <Cell key={i} fill={d.color}/>)}
            </Pie>
            <Tooltip content={renderTooltip}/>
          </PieChart>
        </ResponsiveContainer>
        {(centerLabel || centerSub) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            {centerLabel && <span className="text-sm font-bold leading-tight text-slate-800">{centerLabel}</span>}
            {centerSub && <span className="text-[10px] leading-tight text-slate-400">{centerSub}</span>}
          </div>
        )}
      </div>
      <div className="w-full space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: d.color }}/>
            <span className="flex-1 truncate text-xs text-slate-600">{d.label}</span>
            <span className="text-xs font-semibold text-slate-800">{d.display ?? fmt(d.value)}</span>
            <span className="w-8 text-right text-[10px] text-slate-400">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Monthly Sales Trend (Area) ────────────────────────────────────────────────
function MonthlyTrendChart({ data, height = 220 }) {
  const chartData = MONTHS.map((m, i) => {
    const row = data.find(d => Number(d.month) === i + 1);
    return { month: m, revenue: Number(row?.total_sales || 0) };
  });

  const renderTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <TooltipCard>
        <TooltipLabel>{label}</TooltipLabel>
        <TooltipRow color={C.blue} label="Revenue" value={`${fmt(payload[0].value)} RWF`}/>
      </TooltipCard>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.blue} stopOpacity={0.22}/>
            <stop offset="100%" stopColor={C.blue} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false}/>
        <XAxis dataKey="month" tick={AXIS_TICK} axisLine={{ stroke: '#e2e8f0' }} tickLine={false}/>
        <YAxis tick={AXIS_TICK} tickFormatter={fmtShort} axisLine={false} tickLine={false} width={48}/>
        <Tooltip content={renderTooltip} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}/>
        <Area
          type="monotone" dataKey="revenue" stroke={C.blue} strokeWidth={2}
          fill="url(#revGrad)" dot={false} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Sales by Day (Bar) ────────────────────────────────────────────────────────
function SalesByDayChart({ data, height = 180 }) {
  const today = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
    const row = data.find(d => Number(d.day) === i + 1);
    return { day: i + 1, total: Number(row?.total || 0), isToday: i + 1 === today };
  });

  const renderTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <TooltipCard>
        <TooltipLabel>Day {label}</TooltipLabel>
        <TooltipRow color={C.blue} label="Revenue" value={`${fmt(payload[0].value)} RWF`}/>
      </TooltipCard>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false}/>
        <XAxis dataKey="day" tick={{ ...AXIS_TICK, fontSize: 10 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} interval={4}/>
        <YAxis tick={AXIS_TICK} tickFormatter={fmtShort} axisLine={false} tickLine={false} width={48}/>
        <Tooltip content={renderTooltip} cursor={{ fill: '#f8fafc' }}/>
        <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={16}>
          {chartData.map((d, i) => <Cell key={i} fill={d.isToday ? C.blue : '#bfdbfe'}/>)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Profit Trend (Composed: Revenue + Cost bars, Profit line) ────────────────
const PROFIT_LEGEND_ITEMS = [
  { label: 'Revenue', color: C.blue },
  { label: 'Cost', color: C.red },
  { label: 'Profit', color: C.emerald },
];
function renderProfitLegend() {
  return (
    <div className="mb-1 flex items-center gap-4">
      {PROFIT_LEGEND_ITEMS.map(it => (
        <span key={it.label} className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <span className="h-2 w-2 rounded-full" style={{ background: it.color }}/>
          {it.label}
        </span>
      ))}
    </div>
  );
}

function ProfitTrendChart({ data, height = 240 }) {
  const renderTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const rev = payload.find(p => p.dataKey === 'revenue')?.value || 0;
    const cost = payload.find(p => p.dataKey === 'cost')?.value || 0;
    const profit = payload.find(p => p.dataKey === 'profit')?.value || 0;
    return (
      <TooltipCard>
        <TooltipLabel>{label}</TooltipLabel>
        <TooltipRow color={C.blue} label="Revenue" value={`${fmt(rev)} RWF`}/>
        <TooltipRow color={C.red} label="Cost" value={`${fmt(cost)} RWF`}/>
        <TooltipRow color={C.emerald} label="Profit" value={`${fmt(profit)} RWF`}/>
      </TooltipCard>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barGap={2}>
        <CartesianGrid stroke={GRID} vertical={false}/>
        <XAxis dataKey="month" tick={AXIS_TICK} axisLine={{ stroke: '#e2e8f0' }} tickLine={false}/>
        <YAxis tick={AXIS_TICK} tickFormatter={fmtShort} axisLine={false} tickLine={false} width={48}/>
        <Tooltip content={renderTooltip} cursor={{ fill: '#f8fafc' }}/>
        <Legend verticalAlign="top" align="left" height={32} content={renderProfitLegend}/>
        <Bar dataKey="revenue" name="Revenue" fill={C.blue} radius={[4, 4, 0, 0]} maxBarSize={16}/>
        <Bar dataKey="cost" name="Cost" fill={C.red} radius={[4, 4, 0, 0]} maxBarSize={16}/>
        <Line
          type="monotone" dataKey="profit" name="Profit" stroke={C.emerald} strokeWidth={2}
          dot={{ r: 3, fill: C.emerald, stroke: '#fff', strokeWidth: 1.5 }} activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
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
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-5 shadow-sm transition hover:shadow-md`}>
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
      <p className="mt-3 text-2xl font-extrabold leading-tight text-slate-900">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">
        {hasPct ? `${isPos ? '+' : ''}${pct}% from last month` : sub}
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

// ── Chart Card wrapper ─────────────────────────────────────────────────────────
function ChartCard({ title, badge, className = '', children }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold text-slate-800">{title}</p>
        {badge}
      </div>
      {children}
    </div>
  );
}

// ── Insight Card ──────────────────────────────────────────────────────────────
function InsightCard({ title, value, desc, accent = '#3b82f6' }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: accent, marginTop: 6 }}/>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
        <p className="mt-1 truncate text-base font-bold text-slate-900">{value}</p>
        <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminReports() {
  const { t } = useLanguage();
  const [kpis, setKpis]                 = useState(null);
  const [monthly, setMonthly]           = useState([]);
  const [bestSelling, setBestSelling]   = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [catRevenue, setCatRevenue]     = useState([]);
  const [inventory, setInventory]       = useState([]);
  const [recentSales, setRecentSales]   = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [supplierPerf, setSupplierPerf] = useState([]);
  const [salesByDay, setSalesByDay]     = useState([]);
  const [profitTrend, setProfitTrend]   = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [stockActivity, setStockActivity]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const { refreshKey, bindRefresh }     = useDataRefresh();

  const loadData = useCallback(() => {
    setLoading(true);
    const endpoints = [
      ['/reports/kpis',               setKpis,           false],
      ['/reports/monthly',            setMonthly,        true],
      ['/reports/top-products',       setBestSelling,    true],
      ['/reports/payment-methods',    setPaymentMethods, true],
      ['/reports/category-revenue',   setCatRevenue,     true],
      ['/reports/inventory',          setInventory,      true],
      ['/reports/recent-sales',       setRecentSales,    true],
      ['/reports/top-customers',      setTopCustomers,   true],
      ['/reports/supplier-performance', setSupplierPerf, true],
      ['/reports/sales-by-day',       setSalesByDay,     true],
      ['/reports/profit-trend',       setProfitTrend,    true],
      ['/purchases',                  setRecentPurchases, true], // Purchases module — recent restocks
      ['/reports/stock-movements?limit=12', setStockActivity, true], // Stock module ledger
    ];
    // Settle each endpoint independently — one missing/failing route (e.g. not
    // yet deployed) no longer blanks the entire page, only that section.
    Promise.allSettled(endpoints.map(([url]) => API.get(url))).then(results => {
      results.forEach((res, i) => {
        const [url, setter, isArray] = endpoints[i];
        if (res.status === 'fulfilled') {
          setter(isArray ? (Array.isArray(res.value.data) ? res.value.data : []) : res.value.data);
        } else {
          console.error(`Report request failed: ${url}`, res.reason);
        }
      });
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData, refreshKey]);
  useEffect(bindRefresh, [bindRefresh]);

  const totalProducts = inventory.length;
  const inStockCount  = inventory.filter(i => i.status === 'In Stock').length;
  const lowCount      = inventory.filter(i => i.status === 'Low Stock').length;
  const outCount      = inventory.filter(i => i.status === 'Out of Stock').length;
  const stockValue    = inventory.reduce((s, i) => s + Number(i.stock_quantity || 0) * Number(i.cost_price || 0), 0);
  const curMonthIdx   = new Date().getMonth();

  const maxQtySold    = bestSelling[0]?.quantity_sold || 1;

  const catTotal   = catRevenue.reduce((s, c) => s + Number(c.revenue || 0), 0) || 1;
  const catFolded  = foldOther(catRevenue, 'revenue', 'category', 6);
  const catData    = catFolded.length
    ? catFolded.map((c, i) => ({
        label: c.category || 'Other',
        value: Number(c.revenue),
        display: `${fmtShort(c.revenue)} RWF`,
        color: c.__other ? C.slate : CATEGORICAL[i % CATEGORICAL.length],
      }))
    : [{ label: 'No sales', value: 1, color: '#e2e8f0', display: '—' }];

  const payData = paymentMethods.length
    ? paymentMethods.map(p => ({
        label: p.payment_method || 'Unknown',
        value: Number(p.count),
        display: `${p.count} txns`,
        color: PAY_COLORS[p.payment_method] || C.slate,
      }))
    : [{ label: 'No data', value: 1, color: '#e2e8f0', display: '—' }];

  const hasMonthlyData = monthly.some(m => Number(m.total_sales) > 0);
  const hasProfitData  = profitTrend.some(p => Number(p.revenue) > 0 || Number(p.cost) > 0);
  const profitThisMonth = profitTrend.find(p => p.month === MONTHS[curMonthIdx]);

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
  const exportProfitTrend = () => exportToCSV(
    `profit-trend-${new Date().toISOString().slice(0,10)}.csv`,
    ['Month','Revenue (RWF)','Cost (RWF)','Profit (RWF)'],
    profitTrend.map(p => [p.month, p.revenue, p.cost, p.profit])
  );

  return (
    <AdminLayout currentPage="/admin/reports">
      <div className="space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{t('admin.reportsPage.title')}</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {MONTHS[curMonthIdx]} {new Date().getFullYear()} — {t('admin.reportsPage.subtitle')}
            </p>
          </div>
          {!loading && (
            <div className="flex flex-wrap gap-2">
              <ExportDropdown label={t('admin.reportsPage.exportSales')} onExport={exportBestSelling}/>
              <ExportDropdown label={t('admin.reportsPage.exportInventory')} onExport={exportInventory}/>
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
                label={t('admin.reportsPage.salesPerformance')}
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
                label={t('admin.reportsPage.averageSale')}
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
                label={t('admin.reportsPage.customersThisMonth')}
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
                label={t('admin.reportsPage.totalStockValue')}
                value={`${fmtShort(kpis?.stock_value?.value ?? stockValue)} RWF`}
                pct={null}
                sub={t('admin.reportsPage.basedOnCostPrices')}
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
              <SectionTitle>{t('admin.reportsPage.salesPerformance')}</SectionTitle>
              <div className="grid gap-4 xl:grid-cols-3">
                <ChartCard
                  title={t('admin.reportsPage.monthlySalesTrend')}
                  className="xl:col-span-2"
                  badge={
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                      {new Date().getFullYear()}
                    </span>
                  }
                >
                  {hasMonthlyData
                    ? <MonthlyTrendChart data={monthly} height={200}/>
                    : <p className="py-16 text-center text-sm text-slate-400">No sales data yet</p>}
                </ChartCard>

                <ChartCard title={t('admin.reportsPage.revenueByCategory')}>
                  <DonutChart data={catData} centerLabel={catRevenue[0] ? `${Math.round((catRevenue[0].revenue / catTotal) * 100)}%` : '—'} centerSub="top cat." valueUnit=" RWF"/>
                </ChartCard>
              </div>
            </section>

            {/* ── Profit Trend ── */}
            <section>
              <SectionTitle>{t('admin.reportsPage.profitability')}</SectionTitle>
              <div className="grid gap-4 xl:grid-cols-3">
                <ChartCard
                  title={t('admin.reportsPage.revenueVsCost')}
                  className="xl:col-span-2"
                  badge={
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                      {new Date().getFullYear()}
                    </span>
                  }
                >
                  {hasProfitData
                    ? <ProfitTrendChart data={profitTrend} height={220}/>
                    : <p className="py-16 text-center text-sm text-slate-400">No purchase/sales data yet</p>}
                </ChartCard>

                <div className="grid gap-4 content-start">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
                    <p className="text-sm font-medium text-emerald-700">{t('admin.reportsPage.profitThisMonth')}</p>
                    <p className="mt-2 text-2xl font-extrabold text-emerald-700">{fmtShort(profitThisMonth?.profit)} RWF</p>
                    <p className="mt-1 text-xs text-emerald-500">
                      Revenue {fmtShort(profitThisMonth?.revenue)} − Cost {fmtShort(profitThisMonth?.cost)}
                    </p>
                  </div>
                  <button
                    onClick={exportProfitTrend}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-slate-50"
                  >
                    <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    {t('admin.reportsPage.exportProfitTrend')}
                  </button>
                </div>
              </div>
            </section>

            {/* ── Top Products + Payment Methods ── */}
            <section>
              <SectionTitle>Products & Payments</SectionTitle>
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="mb-5 font-semibold text-slate-800">{t('admin.reportsPage.topProducts')}</p>
                  {bestSelling.length > 0 ? (
                    <div className="space-y-4">
                      {bestSelling.slice(0, 8).map((item, i) => {
                        const pct = Math.round((item.quantity_sold / maxQtySold) * 100);
                        return (
                          <div key={item.name} className="flex items-center gap-3">
                            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">{i + 1}</span>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center justify-between">
                                <span className="truncate text-sm font-medium text-slate-700">{item.name}</span>
                                <span className="ml-2 flex-shrink-0 text-xs font-bold text-violet-600">{item.quantity_sold} units</span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }}/>
                              </div>
                            </div>
                            <span className="w-16 flex-shrink-0 text-right text-[11px] text-slate-400">{fmtShort(item.total_revenue)} RWF</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="py-10 text-center text-sm text-slate-400">No sales recorded yet</p>
                  )}
                </div>

                <ChartCard title="Payment Methods">
                  <DonutChart data={payData} centerLabel={paymentMethods.length ? paymentMethods[0]?.payment_method : '—'} centerSub="top method"/>
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
                </ChartCard>
              </div>
            </section>

            {/* ── Sales by Day ── */}
            <section>
              <SectionTitle>Sales by Day — {MONTHS[curMonthIdx]}</SectionTitle>
              <ChartCard
                title="Daily Revenue (RWF)"
                badge={
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded bg-blue-600"/>Today</span>
                    <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded bg-blue-200"/>Other days</span>
                  </div>
                }
              >
                <SalesByDayChart data={salesByDay} height={160}/>
                {salesByDay.length === 0 && (
                  <p className="mt-2 text-center text-sm text-slate-400">No sales recorded this month</p>
                )}
              </ChartCard>
            </section>

            {/* ── Inventory Health ── */}
            <section>
              <SectionTitle>{t('admin.reportsPage.inventoryHealth')}</SectionTitle>
              <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
                <ChartCard title={t('admin.reportsPage.stockStatus')}>
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
                    <div className="mt-4 flex h-2 gap-px overflow-hidden rounded-full">
                      {inStockCount > 0 && <div className="h-full bg-emerald-500" style={{ width: `${(inStockCount/totalProducts)*100}%` }}/>}
                      {lowCount > 0     && <div className="h-full bg-amber-400"  style={{ width: `${(lowCount/totalProducts)*100}%` }}/>}
                      {outCount > 0     && <div className="h-full bg-red-500"    style={{ width: `${(outCount/totalProducts)*100}%` }}/>}
                    </div>
                  )}
                  <p className="mt-1 text-right text-xs text-slate-400">{totalProducts} products total</p>
                </ChartCard>

                <div className="grid content-start gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
                    <p className="text-sm font-medium text-emerald-700">In Stock</p>
                    <p className="mt-2 text-3xl font-extrabold text-emerald-700">{inStockCount}</p>
                    <p className="mt-1 text-xs text-emerald-500">products available</p>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
                    <p className="text-sm font-medium text-amber-700">{t('admin.reportsPage.lowStock')}</p>
                    <p className="mt-2 text-3xl font-extrabold text-amber-600">{lowCount}</p>
                    <p className="mt-1 text-xs text-amber-500">need restocking soon</p>
                  </div>
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
                    <p className="text-sm font-medium text-red-700">{t('admin.reportsPage.outOfStock')}</p>
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
                <SectionTitle>{t('admin.reportsPage.productsNeedingAttention')}</SectionTitle>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Product</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Category</th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-600">Stock</th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-600">Min.</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.filter(i => i.status !== 'In Stock')
                          .sort((a, b) => a.stock_quantity - b.stock_quantity)
                          .map(item => (
                          <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-900">{item.name}</p>
                              {item.sku && <p className="font-mono text-xs text-slate-400">{item.sku}</p>}
                            </td>
                            <td className="px-4 py-3 text-slate-500">{item.category_name || '—'}</td>
                            <td className={`px-4 py-3 text-right font-bold ${item.status === 'Out of Stock' ? 'text-red-600' : 'text-amber-600'}`}>
                              {item.stock_quantity}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-400">{item.minimum_stock || 5}</td>
                            <td className="px-4 py-3">
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
              <SectionTitle>{t('admin.reportsPage.recentSales')}</SectionTitle>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {recentSales.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Invoice</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Customer</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Payment</th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-600">Amount (RWF)</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSales.map(s => (
                          <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 font-mono text-xs text-slate-700">{s.invoice_number || `#${s.id}`}</td>
                            <td className="px-4 py-3 font-medium text-slate-800">{s.customer_name || 'Walk-in'}</td>
                            <td className="px-4 py-3">
                              <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                                style={{ background: PAY_COLORS[s.payment_method] ? PAY_COLORS[s.payment_method] + '20' : '#f1f5f9',
                                         color: PAY_COLORS[s.payment_method] || '#475569' }}>
                                {s.payment_method || 'Cash'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmt(s.total_amount)}</td>
                            <td className="px-4 py-3 text-xs text-slate-400">{timeAgo(s.sale_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="py-10 text-center text-sm text-slate-400">{t('admin.reportsPage.noSalesYet')}</p>
                )}
              </div>
            </section>

            {/* ── Recent Purchases ── */}
            <section>
              <SectionTitle>{t('admin.reportsPage.recentPurchases')}</SectionTitle>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {recentPurchases.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Reference</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Supplier</th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-600">Cost (RWF)</th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-600">Returned (RWF)</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentPurchases.slice(0, 8).map(p => (
                          <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 font-mono text-xs text-slate-700">{p.reference_number || `#${p.id}`}</td>
                            <td className="px-4 py-3 font-medium text-slate-800">{p.supplier_name || 'Unknown supplier'}</td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmt(p.total_cost)}</td>
                            <td className="px-4 py-3 text-right text-slate-400">
                              {Number(p.total_returned_cost) > 0 ? fmt(p.total_returned_cost) : '—'}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(p.purchase_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="py-10 text-center text-sm text-slate-400">{t('admin.reportsPage.noPurchasesYet')}</p>
                )}
              </div>
            </section>

            {/* ── Recent Stock Activity ── */}
            <section>
              <SectionTitle>{t('admin.reportsPage.recentStockActivity')}</SectionTitle>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {stockActivity.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Product</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Type</th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-600">Qty</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Note</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">By</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockActivity.map(m => {
                          const meta = STOCK_TYPE_META[m.transaction_type] || STOCK_TYPE_META.ADJUSTMENT;
                          const qty = Number(m.quantity);
                          return (
                            <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="px-4 py-3">
                                <p className="font-medium text-slate-900">{m.product_name}</p>
                                {(m.variant || m.sku) && (
                                  <p className="text-xs text-slate-400">{[m.variant, m.sku].filter(Boolean).join(' · ')}</p>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                                  style={{ background: meta.color + '1a', color: meta.color }}>
                                  {meta.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-bold tabular-nums" style={{ color: meta.color }}>
                                {qty > 0 ? `+${fmt(qty)}` : fmt(qty)}
                              </td>
                              <td className="px-4 py-3 max-w-[220px] truncate text-slate-500">{m.notes || '—'}</td>
                              <td className="px-4 py-3 text-slate-500">{m.created_by_name || '—'}</td>
                              <td className="px-4 py-3 text-xs text-slate-400">{timeAgo(m.created_at)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="py-10 text-center text-sm text-slate-400">No stock activity yet</p>
                )}
              </div>
            </section>

            {/* ── Top Customers + Supplier Performance ── */}
            <section>
              <SectionTitle>This Month</SectionTitle>
              <div className="grid gap-4 xl:grid-cols-2">
                {/* Top Customers */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <p className="font-semibold text-slate-800">Top Customers</p>
                    <p className="text-xs text-slate-400">{MONTHS[curMonthIdx]} {new Date().getFullYear()}</p>
                  </div>
                  {topCustomers.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-100 bg-slate-50">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Customer</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">Purchases</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">Spent (RWF)</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Last Visit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topCustomers.map((c, i) => (
                          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-medium text-slate-800">{c.customer_name}</td>
                            <td className="px-4 py-2.5 text-right text-slate-600">{c.total_purchases}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{fmt(c.amount_spent)}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-400">{fmtDate(c.last_purchase)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="py-8 text-center text-sm text-slate-400">No customer data for this month</p>
                  )}
                </div>

                {/* Supplier Performance */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <p className="font-semibold text-slate-800">Supplier Performance</p>
                    <p className="text-xs text-slate-400">{MONTHS[curMonthIdx]} {new Date().getFullYear()}</p>
                  </div>
                  {supplierPerf.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-100 bg-slate-50">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Supplier</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">Orders</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">Total (RWF)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supplierPerf.map((s, i) => (
                          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-medium text-slate-800">{s.supplier}</td>
                            <td className="px-4 py-2.5 text-right text-slate-600">{s.purchases}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{fmt(s.total_value)}</td>
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
