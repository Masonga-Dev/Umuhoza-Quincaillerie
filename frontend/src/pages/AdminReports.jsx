import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';
import { exportToCSV } from '../utils/exportCSV';

function fmtPrice(v) {
  return Number(v || 0).toLocaleString('en-RW');
}

function Card({ label, value, sub, color = 'text-blue-600' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function AdminReports() {
  const [daily, setDaily] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('umuhoza_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.all([
      API.get('/reports/daily', { headers }),
      API.get('/reports/inventory', { headers }),
    ])
      .then(([dRes, iRes]) => {
        setDaily(dRes.data);
        setInventory(Array.isArray(iRes.data) ? iRes.data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalProducts = inventory.length;
  const lowCount = inventory.filter((i) => i.status === 'Low Stock').length;
  const outCount = inventory.filter((i) => i.status === 'Out of Stock').length;
  const inStockCount = inventory.filter((i) => i.status === 'In Stock').length;

  const bestSelling = daily?.best_selling || [];
  const maxQty = bestSelling[0]?.quantity_sold || 1;

  return (
    <AdminLayout currentPage="/admin/reports">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Reports & Analytics</h2>
            <p className="mt-1 text-sm text-slate-500">Overview of today's sales and current inventory health.</p>
          </div>
          {!loading && (
            <div className="flex gap-2">
              <button
                onClick={() => exportToCSV(
                  `best-sellers-${new Date().toISOString().slice(0, 10)}.csv`,
                  ['Product', 'Units Sold', 'Revenue (RWF)'],
                  (daily?.best_selling || []).map(i => [i.name, i.quantity_sold, i.total_revenue])
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
            {/* Today's Sales */}
            <section>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-amber-500">Today's Performance</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card
                  label="Today's Revenue"
                  value={`${fmtPrice(daily?.summary?.total_sales)} RWF`}
                  color="text-blue-600"
                />
                <Card
                  label="Transactions Today"
                  value={daily?.summary?.total_transactions ?? 0}
                  color="text-emerald-600"
                />
                <Card
                  label="Top Product Today"
                  value={bestSelling[0]?.name || 'No sales yet'}
                  sub={bestSelling[0] ? `${bestSelling[0].quantity_sold} units sold` : ''}
                  color="text-purple-600"
                />
                <Card
                  label="Avg. Sale Value"
                  value={
                    daily?.summary?.total_transactions
                      ? `${fmtPrice(daily.summary.total_sales / daily.summary.total_transactions)} RWF`
                      : '—'
                  }
                  color="text-slate-700"
                />
              </div>
            </section>

            {/* Best Selling */}
            {bestSelling.length > 0 && (
              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-amber-500">Top Selling Products — Today</h3>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="space-y-4">
                    {bestSelling.slice(0, 8).map((item, idx) => (
                      <div key={item.name} className="flex items-center gap-4">
                        <span className="w-6 text-right text-sm font-bold text-slate-400">#{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-slate-900 truncate">{item.name}</span>
                            <span className="ml-3 flex-shrink-0 text-sm text-slate-500">{item.quantity_sold} units</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all duration-500"
                              style={{ width: `${Math.round((item.quantity_sold / maxQty) * 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className="w-32 text-right text-sm font-semibold text-slate-700 flex-shrink-0">
                          {fmtPrice(item.total_revenue)} RWF
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Inventory Health */}
            <section>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-amber-500">Inventory Health</h3>
              <div className="grid gap-4 sm:grid-cols-4">
                <Card label="Total Products" value={totalProducts} color="text-slate-900" />
                <Card label="In Stock" value={inStockCount} color="text-emerald-600" />
                <Card label="Low Stock" value={lowCount} color="text-amber-600" sub="Need restocking soon" />
                <Card label="Out of Stock" value={outCount} color="text-red-600" sub="Restock immediately" />
              </div>

              {/* Stock level breakdown */}
              {inventory.length > 0 && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-4 text-sm font-medium text-slate-600">
                    <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />In Stock</span>
                    <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-amber-400 inline-block" />Low Stock</span>
                    <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-500 inline-block" />Out of Stock</span>
                  </div>
                  <div className="h-6 rounded-full overflow-hidden flex gap-0.5">
                    {inStockCount > 0 && (
                      <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(inStockCount / totalProducts) * 100}%` }} title={`In Stock: ${inStockCount}`} />
                    )}
                    {lowCount > 0 && (
                      <div className="bg-amber-400 h-full transition-all" style={{ width: `${(lowCount / totalProducts) * 100}%` }} title={`Low Stock: ${lowCount}`} />
                    )}
                    {outCount > 0 && (
                      <div className="bg-red-500 h-full transition-all" style={{ width: `${(outCount / totalProducts) * 100}%` }} title={`Out: ${outCount}`} />
                    )}
                  </div>
                  <div className="mt-3 flex justify-between text-xs text-slate-400">
                    <span>0</span>
                    <span>{totalProducts} products total</span>
                  </div>
                </div>
              )}
            </section>

            {/* Critical stock list */}
            {(lowCount > 0 || outCount > 0) && (
              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-red-500">Products Needing Attention</h3>
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="py-3 px-4 text-left font-semibold text-slate-600">Product</th>
                        <th className="py-3 px-4 text-right font-semibold text-slate-600">Stock</th>
                        <th className="py-3 px-4 text-right font-semibold text-slate-600">Min.</th>
                        <th className="py-3 px-4 text-left font-semibold text-slate-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory
                        .filter((i) => i.status !== 'In Stock')
                        .sort((a, b) => a.stock_quantity - b.stock_quantity)
                        .map((item) => (
                          <tr key={item.id} className="border-b border-slate-100">
                            <td className="py-3 px-4 font-medium text-slate-900">{item.name}</td>
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
