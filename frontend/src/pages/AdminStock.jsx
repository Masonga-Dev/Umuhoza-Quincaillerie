import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import API from '../api';
import { exportToCSV } from '../utils/exportCSV';

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const HEADERS = () => ({ Authorization: `Bearer ${localStorage.getItem('umuhoza_token')}` });
const fmt = v => Number(v || 0).toLocaleString('en-RW');
const fmtDT = d => new Date(d).toLocaleString('en-RW', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

function StatusBadge({ status }) {
  const cls = status === 'In Stock'
    ? 'bg-emerald-100 text-emerald-700'
    : status === 'Low Stock'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-red-100 text-red-700';
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{status}</span>;
}

function StatCard({ label, value, sub, color = 'text-blue-600', border = 'border-slate-200', bg = 'bg-white' }) {
  return (
    <div className={`rounded-2xl border ${border} ${bg} p-5 shadow-sm`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export default function AdminStock() {
  const [inventory, setInventory]   = useState([]);
  const [movements, setMovements]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [movLoading, setMovLoading] = useState(true);
  const [search, setSearch]         = useState('');
  const [view, setView]             = useState('alerts');
  const navigate = useNavigate();

  const loadData = useCallback(() => {
    setLoading(true);
    API.get('/reports/inventory', { headers: HEADERS() })
      .then(r => setInventory(Array.isArray(r.data) ? r.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));

    setMovLoading(true);
    API.get('/reports/stock-movements', { headers: HEADERS(), params: { limit: 15 } })
      .then(r => setMovements(Array.isArray(r.data) ? r.data : []))
      .catch(() => setMovements([]))
      .finally(() => setMovLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const lowStock  = inventory.filter(i => i.status === 'Low Stock');
  const outOfStock = inventory.filter(i => i.status === 'Out of Stock');
  const inStock   = inventory.filter(i => i.status === 'In Stock');
  const stockValue = inventory.reduce((s, i) => s + Number(i.stock_quantity || 0) * Number(i.cost_price || 0), 0);

  const filtered    = inventory.filter(i =>
    !search || i.name?.toLowerCase().includes(search.toLowerCase()) || i.sku?.toLowerCase().includes(search.toLowerCase())
  );
  const alerts      = filtered.filter(i => i.status !== 'In Stock');
  const displayList = view === 'alerts' ? alerts : filtered;

  const handleExport = () => {
    exportToCSV(
      `stock-report-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Product', 'SKU', 'Category', 'Stock Qty', 'Min Stock', 'Purchase Price (RWF)', 'Selling Price (RWF)', 'Stock Value (RWF)', 'Status'],
      displayList.map(i => [
        i.name, i.sku || '', i.category_name || '',
        i.stock_quantity, i.minimum_stock || 5,
        i.cost_price || 0, i.selling_price || 0,
        Number(i.stock_quantity || 0) * Number(i.cost_price || 0),
        i.status,
      ])
    );
  };

  return (
    <AdminLayout currentPage="/admin/stock">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Stock Management</h2>
            <p className="mt-1 text-sm text-slate-500">Monitor inventory, track movements from sales and purchases.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/admin/purchases')}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V21h18v-4.5M12 3v12m0 0l-3-3m3 3l3-3"/>
              </svg>
              Record Purchase
            </button>
            <button
              onClick={() => navigate('/admin/sales')}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              View Sales
            </button>
            <button
              onClick={() => navigate('/admin/products/add')}
              className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              + Add Product
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Products" value={inventory.length} color="text-slate-900" />
          <StatCard label="Low Stock" value={lowStock.length} color="text-amber-600"
            border="border-amber-100" bg="bg-amber-50" sub={lowStock.length ? 'Need restocking soon' : 'All good'} />
          <StatCard label="Out of Stock" value={outOfStock.length} color="text-red-600"
            border="border-red-100" bg="bg-red-50" sub={outOfStock.length ? 'Restock immediately' : 'All good'} />
          <StatCard
            label="Total Stock Value"
            value={`${fmt(stockValue)} RWF`}
            color="text-violet-600"
            border="border-violet-100"
            bg="bg-violet-50"
            sub="Based on purchase prices"
          />
        </div>

        {/* Recent stock movements */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h3 className="font-semibold text-slate-900">Recent Stock Movements</h3>
              <p className="text-xs text-slate-400 mt-0.5">Last 15 transactions — IN from purchases, OUT from sales</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"/>IN (Purchases)
              </span>
              <span className="flex items-center gap-1.5 text-red-500">
                <span className="h-2 w-2 rounded-full bg-red-400 inline-block"/>OUT (Sales)
              </span>
            </div>
          </div>

          {movLoading ? (
            <div className="flex h-24 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"/>
            </div>
          ) : movements.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">No stock movements recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Product</th>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
                    <th className="py-2.5 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Qty</th>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Source</th>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {movements.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-4">
                        <p className="font-medium text-slate-800">{m.product_name}</p>
                        {m.sku && <p className="font-mono text-xs text-slate-400">{m.sku}</p>}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          m.type === 'IN'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {m.type === 'IN' ? '↑' : '↓'} {m.type}
                        </span>
                      </td>
                      <td className={`py-2.5 px-4 text-right font-bold ${m.type === 'IN' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {m.type === 'IN' ? '+' : '−'}{m.quantity}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 text-xs">
                        {m.reference_type === 'purchase' ? (
                          <button onClick={() => navigate('/admin/purchases')}
                            className="text-emerald-600 hover:underline font-semibold">Purchase</button>
                        ) : m.reference_type === 'sale' ? (
                          <button onClick={() => navigate('/admin/sales')}
                            className="text-blue-600 hover:underline font-semibold">Sale</button>
                        ) : (
                          <span>{m.notes || m.reference_type || '—'}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 text-xs whitespace-nowrap">{fmtDT(m.created_at)}</td>
                      <td className="py-2.5 px-4 text-slate-500 text-xs">{m.created_by_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inventory table toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by name or SKU…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-52 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          <div className="flex rounded-full border border-slate-200 bg-slate-100 p-0.5">
            <button
              onClick={() => setView('alerts')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${view === 'alerts' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setView('all')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${view === 'all' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All ({filtered.length})
            </button>
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Export CSV
          </button>
        </div>

        {/* Inventory table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"/>
            </div>
          ) : displayList.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              {view === 'alerts' ? '✓ All stock levels are healthy.' : 'No products found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Product</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">SKU</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Category</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Stock</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Min.</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Stock Value</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayList.map(item => {
                    const itemValue = Number(item.stock_quantity || 0) * Number(item.cost_price || 0);
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-slate-100 hover:bg-slate-50 transition ${
                          item.status === 'Out of Stock' ? 'bg-red-50/40' : item.status === 'Low Stock' ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {item.image_path ? (
                              <img src={`${BACKEND_BASE}/${item.image_path}`} alt={item.name}
                                className="h-10 w-10 rounded-xl object-cover flex-shrink-0"/>
                            ) : (
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400">N/A</div>
                            )}
                            <span className="font-medium text-slate-900">{item.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{item.sku || '—'}</td>
                        <td className="py-3 px-4 text-slate-500">{item.category_name || '—'}</td>
                        <td className={`py-3 px-4 text-right font-bold ${
                          item.status === 'Out of Stock' ? 'text-red-600' : item.status === 'Low Stock' ? 'text-amber-600' : 'text-slate-900'
                        }`}>
                          {item.stock_quantity}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500">{item.minimum_stock || 5}</td>
                        <td className="py-3 px-4 text-right text-slate-700 font-medium">
                          {itemValue > 0 ? `${fmt(itemValue)} RWF` : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-3 px-4"><StatusBadge status={item.status}/></td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate('/admin/purchases')}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                            >
                              Restock
                            </button>
                            <button
                              onClick={() => navigate(`/admin/products/${item.id}/edit`)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Health bar */}
        {!loading && inventory.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Inventory Health</span>
              <span>{inventory.length} products total</span>
            </div>
            <div className="flex gap-0.5 h-3 rounded-full overflow-hidden">
              {inStock.length > 0 && (
                <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(inStock.length / inventory.length) * 100}%` }}
                  title={`In Stock: ${inStock.length}`}/>
              )}
              {lowStock.length > 0 && (
                <div className="bg-amber-400 h-full transition-all" style={{ width: `${(lowStock.length / inventory.length) * 100}%` }}
                  title={`Low Stock: ${lowStock.length}`}/>
              )}
              {outOfStock.length > 0 && (
                <div className="bg-red-500 h-full transition-all" style={{ width: `${(outOfStock.length / inventory.length) * 100}%` }}
                  title={`Out of Stock: ${outOfStock.length}`}/>
              )}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block"/>{inStock.length} In Stock</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block"/>{lowStock.length} Low Stock</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block"/>{outOfStock.length} Out of Stock</span>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
