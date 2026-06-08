import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import API from '../api';
import ProductForm from '../components/ProductForm';

function AdminEditProduct() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('umuhoza_token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productResponse, categoryResponse] = await Promise.all([
          API.get(`/products/${id}`),
          API.get('/categories'),
        ]);
        setProduct(productResponse.data);
        setCategories(categoryResponse.data);
      } catch (loadError) {
        console.error(loadError);
        setError('Unable to load product or categories.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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

    await API.put(`/products/${id}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    navigate('/admin/products');
  };

  return (
    <AdminLayout currentPage={`/admin/products/${id}/edit`}>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Edit Product</h2>
          <p className="mt-2 text-slate-600">Update the product details and stock information.</p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-slate-600">Loading product details...</p>
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
            <p className="text-slate-600">Product not found.</p>
          </div>
        )}

        {error && <p className="text-red-600">{error}</p>}
      </div>
    </AdminLayout>
  );
}

export default AdminEditProduct;
