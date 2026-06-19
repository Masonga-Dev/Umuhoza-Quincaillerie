import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import API from '../api';
import { exportToCSV } from '../utils/exportCSV';
import { useDataRefresh } from '../utils/dataEvents';

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const HEADERS = () => ({ Authorization: `Bearer ${localStorage.getItem('umuhoza_token')}` });
const fmt = v => Number(v || 0).toLocaleString('en-RW');

function StatusBadge({ status }) {
  const cls =
    status === 'In Stock' ? 'bg-emerald-100 text-emerald-700' :
    status === 'Low Stock' ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-700';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{status}</span>;
}

function StatCard({ label, value, sub, color, dotColor, borderColor }) {
  return (
    <div className={`rounded-2xl border ${borderColor} bg-white p-5 shadow-sm`}>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
      <p className={`mt-2 text-3xl font-extrabold ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{sub}</p>
    </div>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ total: 0, in_stock: 0, low_stock: 0, out_of_stock: 0 });
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('umuhoza_token');
  const { refreshKey, bindRefresh } = useDataRefresh();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [productRes, categoryRes] = await Promise.all([
          API.get('/products', {
            headers: HEADERS(),
            params: { q: searchTerm || undefined, category: categoryFilter || undefined, status: statusFilter || undefined, page, pageSize },
          }),
          API.get('/categories'),
        ]);
        setProducts(productRes.data.data);
        setTotal(productRes.data.total);
        if (productRes.data.summary) setSummary(productRes.data.summary);
        setCategories(categoryRes.data);
      } catch {
        setError('Unable to load products.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchTerm, categoryFilter, statusFilter, page, pageSize, token, refreshKey]);
  useEffect(bindRefresh, [bindRefresh]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, total);
  const handleFilterChange = setter => e => { setter(e.target.value); setPage(1); };

  const handleDelete = async product => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeletingId(product.id);
    try {
      await API.delete(`/products/${product.id}`, { headers: HEADERS() });
      setProducts(prev => prev.filter(p => p.id !== product.id));
      setTotal(prev => Math.max(0, prev - 1));
      setSummary(prev => ({ ...prev, total: Math.max(0, Number(prev.total) - 1) }));
    } catch {
      setError('Unable to delete product.');
    } finally { setDeletingId(null); }
  };

  const handleExport = () => exportToCSV(
    `products-${new Date().toISOString().slice(0, 10)}.csv`,
    ['SKU', 'Name', 'Category', 'Cost Price (RWF)', 'Selling Price (RWF)', 'Stock Qty', 'Min Stock', 'Status'],
    products.map(p => [p.sku || '', p.name, p.category_name || '', p.cost_price || 0, p.selling_price || 0, p.stock_quantity, p.minimum_stock || 5, p.status])
  );

  return (
    <AdminLayout currentPage="/admin/products">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Products</h2>
            <p className="mt-1 text-slate-500">Manage your catalogue. Set prices through variants, stock through purchases.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Export
            </button>
            <button onClick={() => navigate('/admin/products/add')}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700">
              <span className="text-lg leading-none">+</span> Add Product
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Products" value={Number(summary.total || 0)} sub="In catalogue"
            color="text-blue-600" dotColor="bg-blue-500" borderColor="border-slate-200" />
          <StatCard label="In Stock" value={Number(summary.in_stock || 0)} sub="Ready to sell"
            color="text-emerald-600" dotColor="bg-emerald-500" borderColor="border-emerald-200" />
          <StatCard label="Low Stock" value={Number(summary.low_stock || 0)} sub="Below minimum"
            color="text-amber-600" dotColor="bg-amber-500" borderColor="border-amber-200" />
          <StatCard label="Out of Stock" value={Number(summary.out_of_stock || 0)} sub="Need restocking"
            color="text-red-600" dotColor="bg-red-500" borderColor="border-red-200" />
        </div>

        {/* Main card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
            <div className="relative flex-1" style={{ minWidth: '200px' }}>
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input type="text" placeholder="Search by name, SKU, or description…"
                value={searchTerm} onChange={handleFilterChange(setSearchTerm)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <select value={categoryFilter} onChange={handleFilterChange(setCategoryFilter)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={statusFilter} onChange={handleFilterChange(setStatusFilter)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400">
              <option value="">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
            {(searchTerm || categoryFilter || statusFilter) && (
              <button onClick={() => { setSearchTerm(''); setCategoryFilter(''); setStatusFilter(''); setPage(1); }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Clear
              </button>
            )}
          </div>

          {error && (
            <div className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700">{error}</div>
          )}

          {/* Table */}
          {loading ? (
            <div className="flex h-56 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"/>
            </div>
          ) : products.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center gap-3 text-slate-400">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/>
              </svg>
              <p className="text-sm font-semibold">No products found</p>
              {!searchTerm && !categoryFilter && !statusFilter && (
                <button onClick={() => navigate('/admin/products/add')}
                  className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  + Add First Product
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="w-16 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Image</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Category</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Selling Price</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Cost Price</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products.map(product => (
                    <tr key={product.id}
                      className="group cursor-pointer transition hover:bg-blue-50/50"
                      onClick={() => navigate(`/admin/products/${product.id}/edit`)}>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        {product.image_path ? (
                          <img src={`${BACKEND_BASE}/${product.image_path}`} alt={product.name}
                            className="h-12 w-12 rounded-xl object-cover ring-1 ring-slate-200" />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                            <svg className="h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 transition group-hover:text-blue-700">{product.name}</p>
                        <p className="mt-0.5 font-mono text-xs text-slate-400">{product.sku || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{product.category_name || <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-3 text-right">
                        {Number(product.selling_price) > 0 ? (
                          <>
                            <span className="font-bold text-slate-900">{fmt(product.selling_price)}</span>
                            <span className="ml-1 text-xs text-slate-400">RWF</span>
                          </>
                        ) : (
                          <span className="text-xs italic text-amber-500">Set via variants</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {Number(product.cost_price) > 0 ? (
                          <>
                            <span className="text-slate-600">{fmt(product.cost_price)}</span>
                            <span className="ml-1 text-xs text-slate-400">RWF</span>
                          </>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-sm font-bold tabular-nums ${
                          Number(product.stock_quantity) <= 0 ? 'bg-red-50 text-red-600' :
                          Number(product.stock_quantity) <= Number(product.minimum_stock || 5) ? 'bg-amber-50 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={product.status} />
                      </td>
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700">
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            disabled={deletingId === product.id}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50">
                            {deletingId === product.id ? '…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && total > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <p className="text-sm text-slate-500">
                Showing <span className="font-semibold">{pageStart}–{pageEnd}</span> of <span className="font-semibold">{total}</span> product{total !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50">
                  ← Prev
                </button>
                <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700">
                  {page} / {pageCount}
                </span>
                <button type="button" onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page >= pageCount}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50">
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
