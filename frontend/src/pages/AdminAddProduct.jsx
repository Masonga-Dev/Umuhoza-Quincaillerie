import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import API from '../api';
import ProductForm from '../components/ProductForm';

function AdminAddProduct() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('umuhoza_token');

  useEffect(() => {
    API.get('/categories')
      .then((response) => setCategories(response.data))
      .catch((errorResponse) => {
        console.error(errorResponse);
        setError('Unable to load categories.');
      })
      .finally(() => setLoading(false));
  }, []);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return API.post('/products/upload', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const handleSave = async (productData, imageFile) => {
    const payload = { ...productData };
    if (imageFile) {
      const response = await uploadImage(imageFile);
      payload.image_path = response.data.image_path;
    }

    await API.post('/products', payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    navigate('/admin/products');
  };

  return (
    <AdminLayout currentPage="/admin/products/add">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Add Product</h2>
          <p className="mt-2 text-slate-600">Create a new product entry for your catalog.</p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-slate-600">Loading categories...</p>
          </div>
        ) : (
          <ProductForm
            categories={categories}
            onSave={handleSave}
            submitLabel="Create Product"
          />
        )}

        {error && <p className="text-red-600">{error}</p>}
      </div>
    </AdminLayout>
  );
}

export default AdminAddProduct;
