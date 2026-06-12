import { useEffect, useState } from 'react';
import API from '../api';
import { useLanguage } from '../i18n/LanguageContext';

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    API.get('/public/categories')
      .then((r) => setCategories(r.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const params = {};
    if (search) params.q = search;
    if (categoryId) params.category = categoryId;
    API.get('/public/products', { params })
      .then((r) => setProducts(r.data))
      .catch(console.error);
  }, [search, categoryId]);

  return (
    <div className="space-y-8">
      {/* Header + filters */}
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">{t('products.title')}</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('products.search')}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-auto sm:flex-1"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-64"
          >
            <option value="">{t('products.allCategories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Product grid */}
      <section>
        {products.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <div key={product.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 h-48 overflow-hidden rounded-2xl bg-slate-100">
                  {product.image_path ? (
                    <img
                      src={`${BACKEND_BASE}/${product.image_path}`}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      {t('home.noImage')}
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{product.name}</h3>
                {product.description && (
                  <p className="mt-2 text-sm text-slate-600 line-clamp-2">{product.description}</p>
                )}
                <div className="mt-4 flex items-center justify-between text-sm text-slate-700">
                  <span>{product.category_name || t('products.uncategorized')}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">{product.status}</span>
                </div>
                <div className="mt-3 text-sm text-slate-500">
                  {t('products.stock')}: {product.stock_quantity}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
            {t('products.notFound')}
          </div>
        )}
      </section>
    </div>
  );
}

export default Products;
