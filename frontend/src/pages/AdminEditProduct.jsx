import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import API from '../api';
import ProductForm from '../components/ProductForm';

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function AdminEditProduct() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('umuhoza_token');

  useEffect(() => {
    Promise.all([API.get(`/products/${id}`), API.get('/categories')])
      .then(([productRes, catRes]) => {
        setProduct(productRes.data);
        setCategories(catRes.data);
      })
      .catch(() => setError('Unable to load product or categories.'))
      .finally(() => setLoading(false));
  }, [id]);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    // Use raw axios to avoid the api.js default Content-Type: application/json
    // which prevents multer from parsing multipart uploads.
    const response = await axios.post(`${BACKEND_BASE}/api/products/upload`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.image_path;
  };

  const handleSave = async (productData, imageFile) => {
    const payload = { ...productData };

    if (imageFile) {
      payload.image_path = await uploadImage(imageFile);
    }

    await API.put(`/products/${id}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    navigate('/admin/products');
  };

  return (
    <AdminLayout currentPage={`/admin/products/${id}/edit`}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/products')}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Back to Products
          </button>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">Edit Product</h2>
          <p className="mt-1 text-sm text-slate-500">Update the product details and stock information.</p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-40 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : product ? (
          <ProductForm
            initialValue={product}
            categories={categories}
            onSave={handleSave}
            submitLabel="Save Changes"
          />
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-slate-500">Product not found.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminEditProduct;
