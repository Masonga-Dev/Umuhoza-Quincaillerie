import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import API from '../api';
import ProductForm from '../components/ProductForm';

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function AdminAddProduct() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('umuhoza_token');

  useEffect(() => {
    API.get('/categories')
      .then((r) => setCategories(r.data))
      .catch(() => setError('Unable to load categories.'))
      .finally(() => setLoading(false));
  }, []);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    // Use raw axios — the API instance defaults Content-Type: application/json
    // which breaks multer's multipart parser. Raw axios auto-sets the correct
    // multipart/form-data boundary.
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

    await API.post('/products', payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    navigate('/admin/products');
  };

  return (
    <AdminLayout currentPage="/admin/products/add">
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
          <h2 className="text-2xl font-bold text-slate-900">Add Product</h2>
          <p className="mt-1 text-sm text-slate-500">Create a new product in the catalog.</p>
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
        ) : (
          <ProductForm
            categories={categories}
            onSave={handleSave}
            submitLabel="Create Product"
          />
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminAddProduct;
