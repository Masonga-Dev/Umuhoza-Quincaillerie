import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api';
import { useLanguage } from '../i18n/LanguageContext';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

/* ── helpers ─────────────────────────────────────────────────────────────────── */
const CATEGORY_EMOJI = { construction:'🏗️', tool:'🔧', paint:'🎨', electric:'⚡', plumb:'🔩', roof:'🏠', hardware:'⚙️', fastener:'🔩', screw:'🔩', nail:'🔨', bolt:'⚙️', nut:'⚙️', pipe:'🔧', valve:'🔧', wire:'⚡', switch:'⚡', door:'🚪', window:'🪟' };
function getEmoji(name = '') {
  const l = name.toLowerCase();
  for (const [k, e] of Object.entries(CATEGORY_EMOJI)) if (l.includes(k)) return e;
  return '📦';
}
function colorNameToCss(name) {
  const map = { red:'#ef4444', blue:'#3b82f6', green:'#22c55e', yellow:'#eab308', orange:'#f97316', purple:'#a855f7', pink:'#ec4899', white:'#f1f5f9', black:'#0f172a', grey:'#94a3b8', gray:'#94a3b8', brown:'#92400e', silver:'#cbd5e1', gold:'#d97706', beige:'#e5d3b3', cyan:'#06b6d4', teal:'#14b8a6', navy:'#1e3a5f' };
  return map[name.toLowerCase()] || '#71717a';
}
function getVariantDisplay(product) {
  if (!product.variants?.length) return null;
  const colors = [...new Set(product.variants.map(v => v.color).filter(Boolean))];
  const sizes  = [...new Set(product.variants.map(v => v.size).filter(Boolean))];
  return (colors.length || sizes.length) ? { colors, sizes } : null;
}
/* ─────────────────────────────────────────────────────────────────────────── */

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  const [categories, setCategories] = useState([]);
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [search,     setSearch]     = useState(searchParams.get('q') || '');

  const categoryId    = searchParams.get('category') || '';
  const subcategoryId = searchParams.get('subcategory') || '';

  const localName = obj => (lang === 'rw' && obj?.name_rw) ? obj.name_rw : (lang === 'fr' && obj?.name_fr) ? obj.name_fr : (obj?.name || '');
  const localDesc = obj => (lang === 'rw' && obj?.description_rw) ? obj.description_rw : (lang === 'fr' && obj?.description_fr) ? obj.description_fr : (obj?.description || '');

  /* Derived state */
  const selectedCategory = categories.find(c => String(c.id) === categoryId) || null;
  let selectedSubcategory = null;
  if (subcategoryId) {
    outer: for (const cat of categories) {
      for (const sub of (cat.subcategories || [])) {
        if (String(sub.id) === subcategoryId) { selectedSubcategory = { ...sub, parentCategory: cat }; break outer; }
      }
    }
  }

  /* view: 'categories' | 'subcategories' | 'products' */
  const hasSubcats = selectedCategory?.subcategories?.length > 0;
  const view = search || subcategoryId ? 'products'
             : categoryId ? (hasSubcats ? 'subcategories' : 'products')
             : 'categories';

  /* Fetch products when needed */
  useEffect(() => {
    API.get('/public/categories').then(r => setCategories(r.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (!categories.length) return;
    const selCat = categories.find(c => String(c.id) === categoryId) || null;
    const catHasNoSubs = categoryId && selCat && !selCat.subcategories?.length;
    const shouldFetch = subcategoryId || search || catHasNoSubs;
    if (!shouldFetch) { setProducts([]); return; }

    setLoading(true);
    const params = {};
    if (subcategoryId) params.subcategory_id = subcategoryId;
    else if (search) params.q = search;
    else if (catHasNoSubs) params.category = categoryId;

    API.get('/public/products', { params })
      .then(r => setProducts(Array.isArray(r.data) ? r.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [subcategoryId, search, categoryId, categories]);

  /* Navigation handlers */
  const handleSearch = val => { setSearch(val); val ? setSearchParams({ q: val }) : setSearchParams({}); };
  const handleCategoryClick = cat => {
    setSearch('');
    if (cat.subcategories?.length > 0) setSearchParams({ category: cat.id });
    else setSearchParams({ category: cat.id }); // show products directly
  };
  const handleSubcategoryClick = (sub, e) => { e?.stopPropagation(); setSearch(''); setSearchParams({ subcategory: sub.id }); };
  const handleBack = () => {
    setSearch('');
    if (subcategoryId && selectedSubcategory) setSearchParams({ category: selectedSubcategory.parentCategory.id });
    else setSearchParams({});
  };

  /* ── JSX ─────────────────────────────────────────────────────────────────── */
  return (
    <div className="-mx-4 sm:-mx-6 -mt-8 min-h-screen px-4 sm:px-6 pt-10 pb-20 bg-zinc-950">

      {/* Search bar */}
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
          {search && <button onClick={() => handleSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 text-lg leading-none transition">×</button>}
        </div>
        {(view !== 'categories' || search) && (
          <button onClick={handleBack} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3.5 text-sm font-semibold text-zinc-300 transition hover:border-green-500/50 hover:text-white">
            ← {subcategoryId ? (selectedSubcategory ? localName(selectedSubcategory.parentCategory) : 'Back') : 'All Categories'}
          </button>
        )}
      </div>

      {/* Breadcrumb */}
      <div className="mt-4 flex items-center gap-2 text-sm text-zinc-600">
        <button onClick={() => { setSearch(''); setSearchParams({}); }} className="transition hover:text-green-400">Products</button>
        {selectedCategory && (
          <><span className="text-zinc-800">›</span>
          <button onClick={() => { setSearch(''); setSearchParams({ category: selectedCategory.id }); }} className="transition hover:text-green-400">{localName(selectedCategory)}</button></>
        )}
        {selectedSubcategory && (
          <><span className="text-zinc-800">›</span>
          <span className="text-zinc-300 font-semibold">{localName(selectedSubcategory)}</span></>
        )}
        {search && (
          <><span className="text-zinc-800">›</span>
          <span className="text-zinc-300">Results for <span className="text-green-400">"{search}"</span></span></>
        )}
      </div>

      {/* ── CATEGORY GRID ─────────────────────────────────────────────────────── */}
      {view === 'categories' && (
        <div className="mt-8 space-y-8">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-white">{t('products.title') || 'Shop by Category'}</h2>
            <p className="mt-2 text-sm text-zinc-500">Select a category to explore our products</p>
          </div>

          {categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-16 text-center text-zinc-600">No categories yet.</div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map(cat => {
                const hasImg = !!cat.representative_image;
                const emoji  = getEmoji(cat.name);
                const subs   = cat.subcategories || [];
                return (
                  <div
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat)}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition-all duration-300 hover:border-green-500/40 hover:shadow-[0_0_40px_rgba(34,197,94,0.10)]"
                    style={{ minHeight: 260 }}
                  >
                    {/* Background image */}
                    {hasImg ? (
                      <div className="absolute inset-0">
                        <img src={`${BACKEND}/${cat.representative_image}`} alt="" className="h-full w-full object-cover opacity-50 transition duration-700 group-hover:scale-105 group-hover:opacity-60" />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/20" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[80px] select-none opacity-5">{emoji}</div>
                    )}

                    {/* Green accent line */}
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-green-500 via-green-400 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    {/* Content */}
                    <div className="relative flex h-full flex-col justify-between p-5" style={{ minHeight: 260 }}>
                      {/* Top: name + description */}
                      <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                          {cat.product_count > 0 ? `${cat.product_count} product${cat.product_count !== 1 ? 's' : ''}` : 'No products yet'}
                        </span>
                        <p className="mt-3 text-xl font-bold text-white leading-snug">{localName(cat)}</p>
                        {localDesc(cat) && <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">{localDesc(cat)}</p>}
                      </div>

                      {/* Bottom: subcategory pills */}
                      <div className="mt-4">
                        {subs.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {subs.slice(0, 6).map(sub => (
                              <button
                                key={sub.id}
                                onClick={e => handleSubcategoryClick(sub, e)}
                                className="rounded-full border border-zinc-700 bg-zinc-900/90 px-3 py-1 text-xs font-semibold text-zinc-300 backdrop-blur-sm transition hover:border-green-500/60 hover:bg-green-500/10 hover:text-green-300"
                              >
                                {localName(sub)}
                              </button>
                            ))}
                            {subs.length > 6 && <span className="rounded-full border border-zinc-800 px-2.5 py-1 text-xs text-zinc-600">+{subs.length - 6}</span>}
                          </div>
                        )}
                        <p className="text-xs font-semibold text-green-400 group-hover:text-green-300 transition">
                          {subs.length > 0 ? `See all ${subs.length} subcategor${subs.length === 1 ? 'y' : 'ies'} →` : 'Browse products →'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SUBCATEGORY GRID ──────────────────────────────────────────────────── */}
      {view === 'subcategories' && selectedCategory && (
        <div className="mt-8 space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-green-500">{localName(selectedCategory)}</p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-white">All Subcategories</h2>
          </div>

          {selectedCategory.subcategories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-16 text-center text-zinc-600">No subcategories in this category yet.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {selectedCategory.subcategories.map(sub => {
                const emoji  = getEmoji(sub.name);
                const hasImg = !!sub.representative_image;
                return (
                  <button
                    key={sub.id}
                    onClick={e => handleSubcategoryClick(sub, e)}
                    className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 text-left transition-all duration-300 hover:border-green-500/40 hover:shadow-[0_0_30px_rgba(34,197,94,0.08)]"
                    style={{ aspectRatio: '4/3' }}
                  >
                    {hasImg ? (
                      <div className="absolute inset-0">
                        <img src={`${BACKEND}/${sub.representative_image}`} alt="" className="h-full w-full object-cover opacity-50 transition duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[60px] opacity-5 select-none">{emoji}</div>
                    )}
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-green-500 to-transparent opacity-0 transition group-hover:opacity-100" />

                    <div className="absolute inset-x-0 bottom-0 p-4">
                      {!hasImg && <div className="mb-2 text-3xl">{emoji}</div>}
                      <p className="font-bold text-white leading-snug">{localName(sub)}</p>
                      {sub.product_count > 0 && (
                        <p className="mt-0.5 text-xs text-green-400">{sub.product_count} product{sub.product_count !== 1 ? 's' : ''}</p>
                      )}
                    </div>

                    <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/80 text-zinc-400 opacity-0 transition group-hover:opacity-100 group-hover:border-green-500/50 group-hover:text-green-400">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── PRODUCT LIST ──────────────────────────────────────────────────────── */}
      {view === 'products' && (
        <div className="mt-8 space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-green-500">
                {selectedSubcategory ? localName(selectedSubcategory.parentCategory) : (selectedCategory ? localName(selectedCategory) : 'Search')}
              </p>
              <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-white">
                {search ? <>Results for <span className="text-green-400">"{search}"</span></>
                       : selectedSubcategory ? localName(selectedSubcategory)
                       : selectedCategory ? localName(selectedCategory)
                       : 'Products'}
              </h2>
              {!loading && <p className="mt-1 text-sm text-zinc-500">{products.length} product{products.length !== 1 ? 's' : ''} found</p>}
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-green-500" />
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-16 text-center">
              <p className="text-lg font-bold text-zinc-300">No products found</p>
              <p className="mt-2 text-sm text-zinc-600">Try a different search or browse another category.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map(product => {
                const variantDisplay = getVariantDisplay(product);
                const emoji = getEmoji(product.category_name || '');
                const isAvailable = product.status !== 'Out of Stock';
                return (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="group cursor-pointer rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden flex flex-col transition-all duration-300 hover:border-green-500/40 hover:shadow-[0_0_40px_rgba(34,197,94,0.10)]"
                  >
                    <div className="h-[2px] bg-gradient-to-r from-green-500 via-green-400 to-transparent opacity-0 transition group-hover:opacity-100" />

                    {/* Image */}
                    <div className="relative overflow-hidden bg-zinc-800" style={{ aspectRatio: '16/9' }}>
                      {product.image_path ? (
                        <img src={`${BACKEND}/${product.image_path}`} alt={product.name} className="h-full w-full object-contain transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-5xl opacity-20 select-none">{emoji}</div>
                      )}
                      <div className={`absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900/90 px-2.5 py-1 backdrop-blur-sm`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-xs font-semibold text-zinc-300">{isAvailable ? 'Available' : 'Out of Stock'}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {product.subcategory_name && (
                          <span className="inline-flex w-fit rounded-full border border-green-500/20 bg-green-500/8 px-2.5 py-0.5 text-xs font-semibold text-green-400">{product.subcategory_name}</span>
                        )}
                        {!product.subcategory_name && product.category_name && (
                          <span className="inline-flex w-fit rounded-full border border-green-500/20 bg-green-500/8 px-2.5 py-0.5 text-xs font-semibold text-green-400">{product.category_name}</span>
                        )}
                      </div>

                      <h3 className="font-bold text-white leading-snug line-clamp-2 text-base group-hover:text-green-50 transition">{product.name}</h3>

                      {product.description && <p className="mt-2 text-sm text-zinc-500 line-clamp-2 flex-1 leading-relaxed">{product.description}</p>}

                      {/* Variants */}
                      {variantDisplay && (
                        <div className="mt-4 space-y-2">
                          {variantDisplay.colors.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium text-zinc-600">Colors</span>
                              {variantDisplay.colors.slice(0, 7).map(color => (
                                <span key={color} title={color} className="h-4 w-4 rounded-full ring-1 ring-zinc-700 ring-offset-1 ring-offset-zinc-900 flex-shrink-0" style={{ backgroundColor: color.match(/^#|^rgb/i) ? color : colorNameToCss(color) }} />
                              ))}
                              {variantDisplay.colors.length > 7 && <span className="text-xs text-zinc-600">+{variantDisplay.colors.length - 7}</span>}
                            </div>
                          )}
                          {variantDisplay.sizes.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-medium text-zinc-600">Sizes</span>
                              {variantDisplay.sizes.slice(0, 5).map(size => (
                                <span key={size} className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-300">{size}</span>
                              ))}
                              {variantDisplay.sizes.length > 5 && <span className="text-xs text-zinc-600">+{variantDisplay.sizes.length - 5}</span>}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-5 flex items-center justify-between border-t border-zinc-800 pt-4">
                        <span className="text-xs font-semibold text-green-400 transition group-hover:text-green-300">View Details →</span>
                        {product.selling_price > 0 && (
                          <span className="text-sm font-bold text-white">{Number(product.selling_price).toLocaleString('en-RW')} <span className="text-xs font-normal text-zinc-500">RWF</span></span>
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
