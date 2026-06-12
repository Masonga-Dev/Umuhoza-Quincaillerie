import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function StatusBadge({ status }) {
  const cls =
    status === 'In Stock'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'Low Stock'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-red-100 text-red-700';
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

function AdminStock() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('alerts'); // 'alerts' | 'all'
  const navigate = useNavigate();
  const token = localStorage.getItem('umuhoza_token');

  useEffect(() => {
    setLoading(true);
    API.get('/reports/inventory', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setInventory(Array.isArray(r.data) ? r.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const lowStock = inventory.filter((i) => i.status === 'Low Stock');
  const outOfStock = inventory.filter((i) => i.status === 'Out of Stock');
  const inStock = inventory.filter((i) => i.status === 'In Stock');

  const filtered = inventory.filter((i) =>
    search ? i.name?.toLowerCase().includes(search.toLowerCase()) || i.sku?.toLowerCase().includes(search.toLowerCase()) : true
  );

  const alerts = filtered.filter((i) => i.status !== 'In Stock');
  const displayList = view === 'alerts' ? alerts : filtered;

  return (
    <AdminLayout currentPage="/admin/stock">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Stock Management</h2>
            <p className="mt-1 text-sm text-slate-500">Monitor inventory levels and restock low products.</p>
          </div>
          <button
            onClick={() => navigate('/admin/products/add')}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
          >
            + Add Product
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Products</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{inventory.length}</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-amber-700">Low Stock</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">{lowStock.length}</p>
          </div>
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-red-700">Out of Stock</p>
            <p className="mt-2 text-3xl font-bold text-red-600">{outOfStock.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
              All Products ({filtered.length})
            </button>
          </div>
        </div>

        {/* Inventory table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
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
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayList.map((item) => (
                    <tr key={item.id} className={`border-b border-slate-100 hover:bg-slate-50 ${item.status === 'Out of Stock' ? 'bg-red-50/40' : item.status === 'Low Stock' ? 'bg-amber-50/40' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {item.image_path ? (
                            <img src={`${BACKEND_BASE}/${item.image_path}`} alt={item.name} className="h-10 w-10 rounded-xl object-cover flex-shrink-0" />
                          ) : (
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400">
                              N/A
                            </div>
                          )}
                          <span className="font-medium text-slate-900">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{item.sku || '—'}</td>
                      <td className="py-3 px-4 text-slate-500">{item.category_name || '—'}</td>
                      <td className={`py-3 px-4 text-right font-bold ${item.status === 'Out of Stock' ? 'text-red-600' : item.status === 'Low Stock' ? 'text-amber-600' : 'text-slate-900'}`}>
                        {item.stock_quantity}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">{item.minimum_stock || 5}</td>
                      <td className="py-3 px-4"><StatusBadge status={item.status} /></td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => navigate(`/admin/products/${item.id}/edit`)}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          Restock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Health summary */}
        {!loading && (
          <div className="grid gap-3 sm:grid-cols-3 text-center text-sm">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 py-4">
              <p className="text-2xl font-bold text-emerald-600">{inStock.length}</p>
              <p className="text-emerald-700">In Stock</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 py-4">
              <p className="text-2xl font-bold text-amber-600">{lowStock.length}</p>
              <p className="text-amber-700">Low Stock</p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50 py-4">
              <p className="text-2xl font-bold text-red-600">{outOfStock.length}</p>
              <p className="text-red-700">Out of Stock</p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminStock;
