import { useEffect, useState } from 'react';
import API from '../api';

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    API.get('/public/categories').then((response) => setCategories(response.data)).catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    const params = {};
    if (search) params.q = search;
    if (categoryId) params.category = categoryId;
    API.get('/public/products', { params })
      .then((response) => setProducts(response.data))
      .catch((error) => console.error(error));
  }, [search, categoryId]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Product Catalog</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-800 shadow-sm sm:w-auto sm:flex-1"
          />
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm sm:w-64"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.length ? (
            products.map((product) => (
              <div key={product.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 h-48 overflow-hidden rounded-2xl bg-slate-100">
                  {product.image_path ? (
                    <img
                      src={`${BACKEND_BASE}/${product.image_path}`}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-500">No image</div>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{product.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{product.description}</p>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-700">
                  <span>{product.category_name || 'Uncategorized'}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">{product.status}</span>
                </div>
                <div className="mt-3 text-sm text-slate-600">Stock: {product.stock_quantity}</div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">No products found.</div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Products;
