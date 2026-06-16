import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function fmtPrice(value) {
  return Number(value).toLocaleString('en-RW');
}

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('umuhoza_token');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [productResponse, categoryResponse] = await Promise.all([
          API.get('/products', {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              q: searchTerm || undefined,
              category: categoryFilter || undefined,
              status: statusFilter || undefined,
              page,
              pageSize,
            },
          }),
          API.get('/categories'),
        ]);

        setProducts(productResponse.data.data);
        setTotal(productResponse.data.total);
        setCategories(categoryResponse.data);
      } catch (fetchError) {
        console.error(fetchError);
        setError('Unable to load products.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchTerm, categoryFilter, statusFilter, page, pageSize, token]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const handleDelete = async (product) => {
    if (!window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      return;
    }

    try {
      await API.delete(`/products/${product.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts((prev) => prev.filter((item) => item.id !== product.id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (deleteError) {
      console.error(deleteError);
      setError('Unable to delete product.');
    }
  };

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, total);

  return (
    <AdminLayout currentPage="/admin/products">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Products</h2>
            <p className="mt-2 text-slate-600">Manage your product catalog with search, filters, and product actions.</p>
          </div>
          <button
            onClick={() => navigate('/admin/products/add')}
            className="inline-flex items-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Add Product
          </button>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr]">
            <input
              type="text"
              placeholder="Search by name, SKU or description..."
              value={searchTerm}
              onChange={handleFilterChange(setSearchTerm)}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <select
              value={categoryFilter}
              onChange={handleFilterChange(setCategoryFilter)}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={handleFilterChange(setStatusFilter)}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {total === 0 ? 'No products found' : `Showing ${pageStart}–${pageEnd} of ${total} product${total !== 1 ? 's' : ''}`}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">Page {page} of {pageCount}</span>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                disabled={page >= pageCount}
                className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          {error && <p className="mt-4 text-red-600">{error}</p>}

          {loading ? (
            <p className="mt-6 text-slate-600">Loading products...</p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-3 px-3 text-left font-semibold">Image</th>
                    <th className="py-3 px-3 text-left font-semibold">SKU</th>
                    <th className="py-3 px-3 text-left font-semibold">Product Name</th>
                    <th className="py-3 px-3 text-left font-semibold">Category</th>
                    <th className="py-3 px-3 text-left font-semibold">Selling Price</th>
                    <th className="py-3 px-3 text-left font-semibold">Purchase Price</th>
                    <th className="py-3 px-3 text-left font-semibold">Stock</th>
                    <th className="py-3 px-3 text-left font-semibold">Status</th>
                    <th className="py-3 px-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-slate-500">
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-3">
                          {product.image_path ? (
                            <img
                              src={`${BACKEND_BASE}/${product.image_path}`}
                              alt={product.name}
                              className="h-14 w-14 rounded-2xl object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xs text-slate-500">
                              No image
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700">{product.sku || '—'}</td>
                        <td className="py-3 px-3 text-slate-900">{product.name}</td>
                        <td className="py-3 px-3 text-slate-600">{product.category_name || 'Uncategorized'}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900">{product.selling_price} RWF</td>
                        <td className="py-3 px-3 text-slate-600">{product.cost_price ? `${Number(product.cost_price).toLocaleString('en-RW')} RWF` : '—'}</td>
                        <td className="py-3 px-3 text-slate-700">{product.stock_quantity}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              product.status === 'In Stock'
                                ? 'bg-green-100 text-green-800'
                                : product.status === 'Low Stock'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {product.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 space-x-2">
                          <button
                            onClick={() => navigate(`/admin/products/${product.id}/view`)}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                          >
                            View
                          </button>
                          <button
                            onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                            className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminProducts;
