import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('umuhoza_token');
    setLoading(true);
    API.get('/products', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => setProducts(response.data))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout currentPage="/admin/products">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Products</h2>
          <p className="mt-2 text-slate-600">Manage your product catalog</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2"
            />
            <button className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
              + Add Product
            </button>
          </div>

          {loading ? (
            <p className="mt-4 text-slate-600">Loading products...</p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="text-left py-2 px-2 font-semibold">Name</th>
                    <th className="text-left py-2 px-2 font-semibold">Category</th>
                    <th className="text-left py-2 px-2 font-semibold">Price</th>
                    <th className="text-left py-2 px-2 font-semibold">Stock</th>
                    <th className="text-left py-2 px-2 font-semibold">Status</th>
                    <th className="text-left py-2 px-2 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2">{product.name}</td>
                      <td className="py-3 px-2 text-slate-600">{product.category_name || '—'}</td>
                      <td className="py-3 px-2 font-semibold">{product.selling_price} RWF</td>
                      <td className="py-3 px-2">{product.stock_quantity}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
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
                      <td className="py-3 px-2">
                        <button className="text-blue-600 hover:text-blue-800">Edit</button>
                      </td>
                    </tr>
                  ))}
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
