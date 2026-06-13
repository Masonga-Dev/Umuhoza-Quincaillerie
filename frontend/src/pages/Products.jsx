import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api';
import { useLanguage } from '../i18n/LanguageContext';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const CATEGORY_META = {
  construction: { emoji: '🏗️', color: 'bg-orange-50 border-orange-200 text-orange-700', accent: 'bg-orange-500' },
  tool: { emoji: '🔧', color: 'bg-blue-50 border-blue-200 text-blue-700', accent: 'bg-blue-500' },
  paint: { emoji: '🎨', color: 'bg-purple-50 border-purple-200 text-purple-700', accent: 'bg-purple-500' },
  electric: { emoji: '⚡', color: 'bg-yellow-50 border-yellow-200 text-yellow-700', accent: 'bg-yellow-500' },
  plumb: { emoji: '🔩', color: 'bg-teal-50 border-teal-200 text-teal-700', accent: 'bg-teal-500' },
  roof: { emoji: '🏠', color: 'bg-emerald-50 border-emerald-200 text-emerald-700', accent: 'bg-emerald-500' },
  hardware: { emoji: '⚙️', color: 'bg-slate-50 border-slate-300 text-slate-700', accent: 'bg-slate-500' },
};

function getCategoryMeta(name = '') {
  const lower = name.toLowerCase();
  for (const [key, meta] of Object.entries(CATEGORY_META)) {
    if (lower.includes(key)) return meta;
  }
  return { emoji: '📦', color: 'bg-indigo-50 border-indigo-200 text-indigo-700', accent: 'bg-indigo-500' };
}

function fmtPrice(v) {
  return Number(v || 0).toLocaleString('en-RW');
}

function getPriceRange(product) {
  if (product.variants?.length) {
    const prices = product.variants.map(v => Number(v.selling_price));
    const min = Math.min(...prices), max = Math.max(...prices);
    return min === max ? `${fmtPrice(min)} RWF` : `${fmtPrice(min)} – ${fmtPrice(max)} RWF`;
  }
  return product.selling_price ? `${fmtPrice(product.selling_price)} RWF` : null;
}

function getStockStatus(product) {
  if (product.variants?.length) {
    const totalStock = product.variants.reduce((sum, v) => sum + Number(v.stock_quantity), 0);
    if (totalStock <= 0) return { label: 'Out of Stock', cls: 'bg-red-100 text-red-700' };
    const anyLow = product.variants.some(v => v.status === 'Low Stock');
    if (anyLow) return { label: 'Low Stock', cls: 'bg-amber-100 text-amber-700' };
    return { label: 'In Stock', cls: 'bg-emerald-100 text-emerald-700' };
  }
  const s = product.status || 'In Stock';
  const cls = s === 'In Stock' ? 'bg-emerald-100 text-emerald-700' : s === 'Low Stock' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  return { label: s, cls };
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(searchParams.get('q') || '');

  const categoryId = searchParams.get('category') || '';
  const selectedCategory = categories.find(c => String(c.id) === categoryId) || null;
  const isListView = !!(categoryId || search);

  useEffect(() => {
    API.get('/public/categories').then(r => setCategories(r.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (!isListView) { setProducts([]); return; }
    setLoading(true);
    const params = {};
    if (search) params.q = search;
    if (categoryId) params.category = categoryId;
    API.get('/public/products', { params })
      .then(r => setProducts(Array.isArray(r.data) ? r.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [categoryId, search, isListView]);

  const handleSearch = (val) => {
    setSearch(val);
    if (val) setSearchParams({ q: val });
    else setSearchParams({});
  };

  const handleCategoryClick = (cat) => {
    setSearch('');
    setSearchParams({ category: cat.id });
  };

  const handleBack = () => {
    setSearch('');
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder={t('products.search') || 'Search products by name…'}
            className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          {search && (
            <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-lg leading-none">×</button>
          )}
        </div>
        {isListView && (
          <button onClick={handleBack} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50">
            ← All Categories
          </button>
        )}
      </div>

      {/* Category breadcrumb */}
      {selectedCategory && !search && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <button onClick={handleBack} className="hover:text-blue-600 transition">All Categories</button>
          <span>›</span>
          <span className="font-semibold text-slate-800">{selectedCategory.name}</span>
        </div>
      )}

      {/* Category grid */}
      {!isListView && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{t('products.title') || 'Shop by Category'}</h2>
            <p className="mt-1 text-slate-500 text-sm">Select a category to browse products</p>
          </div>
          {categories.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center text-slate-400">
              No categories yet. Add categories from the admin panel.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map(cat => {
                const meta = getCategoryMeta(cat.name);
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat)}
                    className={`group flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition hover:shadow-md hover:-translate-y-0.5 ${meta.color}`}
                  >
                    <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl ${meta.accent} bg-opacity-15 text-3xl`}>
                      {meta.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{cat.name}</p>
                      <p className="text-sm opacity-70 mt-0.5">
                        {cat.product_count > 0 ? `${cat.product_count} product${cat.product_count !== 1 ? 's' : ''}` : 'No products yet'}
                      </p>
                      {cat.description && (
                        <p className="text-xs mt-1 opacity-60 line-clamp-1">{cat.description}</p>
                      )}
                    </div>
                    <svg className="ml-auto h-5 w-5 flex-shrink-0 opacity-40 group-hover:opacity-70 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Product list */}
      {isListView && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              {search ? `Results for "${search}"` : selectedCategory?.name || 'Products'}
            </h2>
            {!loading && <span className="text-sm text-slate-500">{products.length} product{products.length !== 1 ? 's' : ''}</span>}
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center rounded-2xl bg-white border border-slate-200">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"/>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center text-slate-400">
              <p className="text-lg font-semibold">No products found</p>
              <p className="mt-1 text-sm">Try a different search term or browse another category.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map(product => {
                const priceRange = getPriceRange(product);
                const stock = getStockStatus(product);
                const variantCount = product.variants?.length || 0;
                return (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="group cursor-pointer rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg hover:-translate-y-1 overflow-hidden"
                  >
                    <div className="h-52 overflow-hidden bg-slate-100">
                      {product.image_path ? (
                        <img
                          src={`${BACKEND}/${product.image_path}`}
                          alt={product.name}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl text-slate-300">
                          {getCategoryMeta(product.category_name).emoji}
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-900 leading-snug line-clamp-2">{product.name}</h3>
                        <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${stock.cls}`}>{stock.label}</span>
                      </div>
                      {product.category_name && (
                        <p className="mt-1 text-xs font-medium text-slate-400 uppercase tracking-wider">{product.category_name}</p>
                      )}
                      {product.description && (
                        <p className="mt-2 text-sm text-slate-500 line-clamp-2">{product.description}</p>
                      )}
                      <div className="mt-4 flex items-center justify-between">
                        {priceRange && <span className="text-sm font-bold text-blue-600">{priceRange}</span>}
                        {variantCount > 0 && (
                          <span className="text-xs text-slate-400">{variantCount} option{variantCount !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
