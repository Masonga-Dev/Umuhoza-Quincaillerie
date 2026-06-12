import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function fmtPrice(value) {
  return Number(value).toLocaleString('en-RW');
}

function AdminProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('umuhoza_token');

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await API.delete(`/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      navigate('/admin/products');
    } catch (err) {
      console.error(err);
      setError('Unable to delete product.');
      setDeleting(false);
    }
  };

  useEffect(() => {
    API.get(`/products/${id}`)
      .then((response) => setProduct(response.data))
      .catch((err) => {
        console.error(err);
        setError('Unable to load product details.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const statusClasses = {
    'In Stock': 'bg-green-100 text-green-800',
    'Low Stock': 'bg-yellow-100 text-yellow-800',
    'Out of Stock': 'bg-red-100 text-red-800',
  };

  return (
    <AdminLayout currentPage={`/admin/products/${id}/view`}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Product Details</h2>
            <p className="mt-2 text-slate-600">Review the product information before editing or deleting.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/admin/products')}
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Back
            </button>
            {product && (
              <>
                <button
                  onClick={() => navigate(`/admin/products/${id}/edit`)}
                  className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Edit Product
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-slate-600">Loading product details...</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-red-600">{error}</p>
          </div>
        ) : product ? (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              {product.image_path ? (
                <img
                  src={`${BACKEND_BASE}/${product.image_path}`}
                  alt={product.name}
                  className="h-80 w-full rounded-3xl object-cover"
                />
              ) : (
                <div className="flex h-80 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                  No image available
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl font-semibold text-slate-900">{product.name}</span>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusClasses[product.status] || 'bg-slate-100 text-slate-700'}`}>
                  {product.status}
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">SKU</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{product.sku || '—'}</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Category</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{product.category_name || 'Uncategorized'}</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Selling Price</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{fmtPrice(product.selling_price)} RWF</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Stock Quantity</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{product.stock_quantity} units</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Cost Price</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{fmtPrice(product.cost_price)} RWF</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Minimum Stock</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{product.minimum_stock}</p>
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Description</p>
                <p className="mt-3 text-slate-700">{product.description || 'No description provided.'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-slate-600">Product not found.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminProductDetails;
