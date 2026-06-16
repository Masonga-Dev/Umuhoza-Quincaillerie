import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api';
import { useLanguage } from '../i18n/LanguageContext';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

/* ── unchanged logic helpers ────────────────────────────────────────────────── */
const CATEGORY_META = {
  construction: { emoji: '🏗️' },
  tool:         { emoji: '🔧' },
  paint:        { emoji: '🎨' },
  electric:     { emoji: '⚡' },
  plumb:        { emoji: '🔩' },
  roof:         { emoji: '🏠' },
  hardware:     { emoji: '⚙️' },
};

function getCategoryEmoji(name = '') {
  const lower = name.toLowerCase();
  for (const [key, meta] of Object.entries(CATEGORY_META)) {
    if (lower.includes(key)) return meta.emoji;
  }
  return '📦';
}

function getStockStatus(product) {
  if (product.variants?.length) {
    const total = product.variants.reduce((s, v) => s + Number(v.stock_quantity), 0);
    if (total <= 0) return { label: 'Out of Stock', dot: 'bg-red-500' };
    if (product.variants.some(v => v.status === 'Low Stock')) return { label: 'Low Stock', dot: 'bg-amber-400' };
    return { label: 'In Stock', dot: 'bg-green-500' };
  }
  const s = product.status || 'In Stock';
  const dot = s === 'In Stock' ? 'bg-green-500' : s === 'Low Stock' ? 'bg-amber-400' : 'bg-red-500';
  return { label: s, dot };
}

function getVariantDisplay(product) {
  if (!product.variants?.length) return null;
  const colors = [...new Set(product.variants.map(v => v.color).filter(Boolean))];
  const sizes  = [...new Set(product.variants.map(v => v.size).filter(Boolean))];
  return { colors, sizes };
}

function colorNameToCss(name) {
  const map = {
    red:'#ef4444', blue:'#3b82f6', green:'#22c55e', yellow:'#eab308',
    orange:'#f97316', purple:'#a855f7', pink:'#ec4899', white:'#f1f5f9',
    black:'#0f172a', grey:'#94a3b8', gray:'#94a3b8', brown:'#92400e',
    silver:'#cbd5e1', gold:'#d97706', beige:'#e5d3b3', cyan:'#06b6d4',
    teal:'#14b8a6', navy:'#1e3a5f', maroon:'#7f1d1d', olive:'#4a5e23',
  };
  return map[name.toLowerCase()] || '#71717a';
}
/* ─────────────────────────────────────────────────────────────────────────── */

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [categories, setCategories] = useState([]);
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [search,     setSearch]     = useState(searchParams.get('q') || '');

  const categoryId       = searchParams.get('category') || '';
  const selectedCategory = categories.find(c => String(c.id) === categoryId) || null;
  const isListView       = !!(categoryId || search);

  useEffect(() => {
    API.get('/public/categories').then(r => setCategories(r.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (!isListView) { setProducts([]); return; }
    setLoading(true);
    const params = {};
    if (search)     params.q        = search;
    if (categoryId) params.category = categoryId;
    API.get('/public/products', { params })
      .then(r  => setProducts(Array.isArray(r.data) ? r.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [categoryId, search, isListView]);

  const handleSearch       = val => { setSearch(val); val ? setSearchParams({ q: val }) : setSearchParams({}); };
  const handleCategoryClick = cat => { setSearch(''); setSearchParams({ category: cat.id }); };
  const handleBack          = ()  => { setSearch(''); setSearchParams({}); };

  return (
    /* Full-bleed dark stage — cancels App's px/py padding, adds its own */
    <div className="-mx-4 sm:-mx-6 -mt-8 min-h-screen px-4 sm:px-6 pt-10 pb-20 bg-zinc-950">

      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder={t('products.search') || 'Search products by name…'}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500/30"
          />
          {search && (
            <button onClick={() => handleSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 text-lg leading-none transition">×</button>
          )}
        </div>
        {isListView && (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3.5 text-sm font-semibold text-zinc-300 transition hover:border-green-500/50 hover:text-white"
          >
            ← All Categories
          </button>
        )}
      </div>

      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      {selectedCategory && !search && (
        <div className="mt-5 flex items-center gap-2 text-sm text-zinc-500">
          <button onClick={handleBack} className="transition hover:text-green-400">All Categories</button>
          <span className="text-zinc-700">›</span>
          <span className="font-semibold text-zinc-200">{selectedCategory.name}</span>
        </div>
      )}

      {/* ── Category grid ──────────────────────────────────────────────────── */}
      {!isListView && (
        <div className="mt-10 space-y-8">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-white">
              {t('products.title') || 'Shop by Category'}
            </h2>
            <p className="mt-2 text-sm text-zinc-500">Select a category to browse our products</p>
          </div>

          {categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-16 text-center text-zinc-600">
              No categories yet. Add categories from the admin panel.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map(cat => {
                const emoji  = getCategoryEmoji(cat.name);
                const hasImg = !!cat.representative_image;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat)}
                    className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 text-left transition-all duration-300 hover:border-green-500/40 hover:shadow-[0_0_40px_rgba(34,197,94,0.10)]"
                    style={{ aspectRatio: '4/3' }}
                  >
                    {/* Background */}
                    {hasImg ? (
                      <div className="absolute inset-0">
                        <img
                          src={`${BACKEND}/${cat.representative_image}`}
                          alt=""
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105 opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[90px] select-none opacity-5">
                        {emoji}
                      </div>
                    )}

                    {/* Green accent line at top */}
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-green-500 via-green-400 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    {/* Arrow badge */}
                    <div className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/80 text-zinc-400 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100 group-hover:border-green-500/50 group-hover:text-green-400">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </div>

                    {/* Content */}
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      {!hasImg && <div className="mb-3 text-4xl">{emoji}</div>}

                      {/* Green count pill */}
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-400"/>
                          {cat.product_count > 0 ? `${cat.product_count} product${cat.product_count !== 1 ? 's' : ''}` : 'No products yet'}
                        </span>
                      </div>

                      <p className="text-lg font-bold leading-snug text-white">{cat.name}</p>
                      {cat.description && (
                        <p className="mt-1 text-xs leading-relaxed text-zinc-400 line-clamp-2">{cat.description}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Product list ───────────────────────────────────────────────────── */}
      {isListView && (
        <div className="mt-10 space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white">
                {search ? <>Results for <span className="text-green-400">"{search}"</span></> : selectedCategory?.name || 'Products'}
              </h2>
              {!loading && (
                <p className="mt-1 text-sm text-zinc-500">{products.length} product{products.length !== 1 ? 's' : ''} found</p>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-green-500"/>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-16 text-center">
              <p className="text-lg font-bold text-zinc-300">No products found</p>
              <p className="mt-2 text-sm text-zinc-600">Try a different search term or browse another category.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map(product => {
                const stock         = getStockStatus(product);
                const variantDisplay = getVariantDisplay(product);
                const emoji          = getCategoryEmoji(product.category_name);
                return (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="group cursor-pointer rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden flex flex-col transition-all duration-300 hover:border-green-500/40 hover:shadow-[0_0_40px_rgba(34,197,94,0.10)]"
                  >
                    {/* Green accent line */}
                    <div className="h-[2px] bg-gradient-to-r from-green-500 via-green-400 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    {/* Image */}
                    <div className="relative overflow-hidden bg-zinc-800" style={{ aspectRatio: '16/9' }}>
                      {product.image_path ? (
                        <img
                          src={`${BACKEND}/${product.image_path}`}
                          alt={product.name}
                          className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-5xl opacity-20 select-none">
                          {emoji}
                        </div>
                      )}
                      {/* Stock dot badge */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900/90 px-2.5 py-1 backdrop-blur-sm">
                        <span className={`h-1.5 w-1.5 rounded-full ${stock.dot}`}/>
                        <span className="text-xs font-semibold text-zinc-300">{stock.label}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-5">
                      {/* Category tag */}
                      {product.category_name && (
                        <span className="mb-3 inline-flex w-fit rounded-full border border-green-500/20 bg-green-500/8 px-2.5 py-0.5 text-xs font-semibold text-green-400">
                          {product.category_name}
                        </span>
                      )}

                      <h3 className="font-bold text-white leading-snug line-clamp-2 text-base group-hover:text-green-50 transition">
                        {product.name}
                      </h3>

                      {product.description && (
                        <p className="mt-2 text-sm text-zinc-500 line-clamp-2 flex-1 leading-relaxed">
                          {product.description}
                        </p>
                      )}

                      {/* Variant chips */}
                      {variantDisplay && (variantDisplay.colors.length > 0 || variantDisplay.sizes.length > 0) && (
                        <div className="mt-4 space-y-2">
                          {variantDisplay.colors.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium text-zinc-600">Colors</span>
                              {variantDisplay.colors.slice(0, 7).map(color => (
                                <span
                                  key={color}
                                  title={color}
                                  className="h-4 w-4 rounded-full ring-1 ring-zinc-700 ring-offset-1 ring-offset-zinc-900 flex-shrink-0"
                                  style={{ backgroundColor: color.match(/^#|^rgb/i) ? color : colorNameToCss(color) }}
                                />
                              ))}
                              {variantDisplay.colors.length > 7 && (
                                <span className="text-xs text-zinc-600">+{variantDisplay.colors.length - 7}</span>
                              )}
                            </div>
                          )}
                          {variantDisplay.sizes.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-medium text-zinc-600">Sizes</span>
                              {variantDisplay.sizes.slice(0, 5).map(size => (
                                <span key={size} className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-300">
                                  {size}
                                </span>
                              ))}
                              {variantDisplay.sizes.length > 5 && (
                                <span className="text-xs text-zinc-600">+{variantDisplay.sizes.length - 5}</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* CTA */}
                      <div className="mt-5 flex items-center justify-between border-t border-zinc-800 pt-4">
                        <span className="text-xs font-semibold text-green-400 transition group-hover:text-green-300">
                          View Details →
                        </span>
                        {variantDisplay && !variantDisplay.colors.length && !variantDisplay.sizes.length && (
                          <span className="text-xs text-zinc-600">{product.variants.length} option{product.variants.length !== 1 ? 's' : ''}</span>
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
