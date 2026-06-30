import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import API from '../api';
import { useDataRefresh } from '../utils/dataEvents';

function fmtPrice(value) {
  return Number(value || 0).toLocaleString('en-RW');
}

const statIcons = {
  products: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  categories: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  lowStock: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  outOfStock: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  ),
  sales: (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
};

function StatCard({ label, value, sub, icon, colorClass, bgClass }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${bgClass}`}>
        <span className={colorClass}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className={`mt-1 text-3xl font-bold ${colorClass}`}>{value}</p>
        {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const { refreshKey, bindRefresh } = useDataRefresh();

  const [daily, setDaily] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    Promise.all([
      API.get('/reports/daily'),
      API.get('/reports/inventory'),
      API.get('/products', { params: { pageSize: 5 } }),
      API.get('/categories'),
    ])
      .then(([dailyRes, inventoryRes, productsRes, categoriesRes]) => {
        setDaily(dailyRes.data);
        setInventory(inventoryRes.data);
        setTotalProducts(productsRes.data.total);
        setRecentProducts(productsRes.data.data);
        setTotalCategories(categoriesRes.data.length);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData, refreshKey]);
  useEffect(bindRefresh, [bindRefresh]);

  const lowStock = inventory.filter((i) => i.status === 'Low Stock');
  const outOfStock = inventory.filter((i) => i.status === 'Out of Stock');

  const statusBadge = {
    'In Stock': 'bg-emerald-100 text-emerald-700',
    'Low Stock': 'bg-amber-100 text-amber-700',
    'Out of Stock': 'bg-red-100 text-red-700',
  };

  if (loading) {
    return (
      <AdminLayout currentPage="/admin/dashboard">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="mt-4 text-sm text-slate-500">Loading dashboard…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="/admin/dashboard">
      <div className="space-y-8">

        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Overview of your store inventory, sales, and alerts.</p>
          </div>
          <button
            onClick={() => navigate('/admin/products/add')}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Product
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Products"
            value={totalProducts}
            sub="In your catalog"
            icon={statIcons.products}
            colorClass="text-blue-600"
            bgClass="bg-blue-50"
          />
          <StatCard
            label="Categories"
            value={totalCategories}
            sub="Product groups"
            icon={statIcons.categories}
            colorClass="text-violet-600"
            bgClass="bg-violet-50"
          />
          <StatCard
            label="Low Stock"
            value={lowStock.length}
            sub="Need restocking soon"
            icon={statIcons.lowStock}
            colorClass="text-amber-600"
            bgClass="bg-amber-50"
          />
          <StatCard
            label="Out of Stock"
            value={outOfStock.length}
            sub="Requires immediate action"
            icon={statIcons.outOfStock}
            colorClass="text-red-600"
            bgClass="bg-red-50"
          />
        </div>

        {/* Today's Sales Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-lg shadow-blue-600/20">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100">Today's Revenue</p>
              <p className="mt-1 text-4xl font-bold">{fmtPrice(daily?.summary?.total_sales)} RWF</p>
              <p className="mt-2 text-sm text-blue-200">
                {daily?.summary?.total_transactions ?? 0} transaction{daily?.summary?.total_transactions !== 1 ? 's' : ''} today
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/sales')}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
            >
              View Sales
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Two-column section */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Best Selling Products */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="font-semibold text-slate-900">Best Selling Products</h2>
              <button
                onClick={() => navigate('/admin/reports')}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                View report
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {daily?.best_selling?.length ? (
                daily.best_selling.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-4 px-6 py-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      {index + 1}
                    </div>
                    <p className="flex-1 text-sm font-medium text-slate-800 truncate">{item.name}</p>
                    <span className="text-sm font-semibold text-blue-600">{item.quantity_sold} sold</span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <svg className="h-10 w-10 opacity-40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                  </svg>
                  <p className="mt-3 text-sm">No sales recorded today</p>
                </div>
              )}
            </div>
          </div>

          {/* Stock Alerts */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="font-semibold text-slate-900">Stock Alerts</h2>
              <button
                onClick={() => navigate('/admin/stock')}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Manage stock
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {outOfStock.length === 0 && lowStock.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <svg className="h-10 w-10 opacity-40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <p className="mt-3 text-sm">All stock levels are healthy</p>
                </div>
              ) : (
                [...outOfStock, ...lowStock].slice(0, 6).map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-6 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.stock_quantity} units remaining</p>
                    </div>
                    <span className={`ml-4 flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Products */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold text-slate-900">Recently Added Products</h2>
            <button
              onClick={() => navigate('/admin/products')}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              View all
            </button>
          </div>
          {recentProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <p className="text-sm">No products yet.</p>
              <button
                onClick={() => navigate('/admin/products/add')}
                className="mt-3 text-sm font-medium text-blue-600 hover:underline"
              >
                Add your first product
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-3 text-left">Product</th>
                    <th className="px-6 py-3 text-left">Category</th>
                    <th className="px-6 py-3 text-left">Selling Price</th>
                    <th className="px-6 py-3 text-left">Stock</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-400">{product.sku}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{product.category_name || '—'}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{fmtPrice(product.selling_price)} RWF</td>
                      <td className="px-6 py-4 text-slate-700">{product.stock_quantity} units</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge[product.status] || 'bg-slate-100 text-slate-600'}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/admin/products/${product.id}/view`)}
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Add Product', path: '/admin/products/add', color: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20' },
            { label: 'Manage Stock', path: '/admin/stock', color: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20' },
            { label: 'View Sales', path: '/admin/sales', color: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' },
            { label: 'Reports', path: '/admin/reports', color: 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/20' },
          ].map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`rounded-xl px-4 py-4 text-sm font-semibold shadow-md transition ${action.color}`}
            >
              {action.label}
            </button>
          ))}
        </div>

      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
