import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import ScrollReveal from '../components/ScrollReveal';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://umuhoza-backend.onrender.com';
const imgUrl = p => !p ? '' : p.startsWith('http') ? p : `${BACKEND}/${p}`;

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
  const [showPrices, setShowPrices] = useState(true);
  const [hero,       setHero]       = useState(null);

  const categoryId    = searchParams.get('category') || '';
  const subcategoryId = searchParams.get('subcategory') || '';

  const localName = obj => (lang === 'rw' && obj?.name_rw) ? obj.name_rw : (lang === 'fr' && obj?.name_fr) ? obj.name_fr : (obj?.name || '');
  const localDesc = obj => (lang === 'rw' && obj?.description_rw) ? obj.description_rw : (lang === 'fr' && obj?.description_fr) ? obj.description_fr : (obj?.description || '');
  const localHeroText = (h, field) => (lang === 'rw' && h?.[`${field}_rw`]) ? h[`${field}_rw`] : (lang === 'fr' && h?.[`${field}_fr`]) ? h[`${field}_fr`] : (h?.[`${field}_en`] || '');

  const selectedCategory = categories.find(c => String(c.id) === categoryId) || null;
  let selectedSubcategory = null;
  if (subcategoryId) {
    outer: for (const cat of categories) {
      for (const sub of (cat.subcategories || [])) {
        if (String(sub.id) === subcategoryId) { selectedSubcategory = { ...sub, parentCategory: cat }; break outer; }
      }
    }
  }

  const hasSubcats = selectedCategory?.subcategories?.length > 0;
  const view = search || subcategoryId ? 'products'
             : categoryId ? (hasSubcats ? 'subcategories' : 'products')
             : 'categories';

  useEffect(() => {
    API.get('/public/hero/products').then(r => setHero(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    API.get('/public/categories')
      .then(r => {
        const d = r.data || {};
        setCategories(Array.isArray(d) ? d : (d.categories || []));
        if (!Array.isArray(d)) setShowPrices(d.show_prices !== 'false');
      })
      .catch(console.error);
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

  const handleSearch = val => { setSearch(val); val ? setSearchParams({ q: val }) : setSearchParams({}); };
  const handleCategoryClick = cat => { setSearch(''); setSearchParams({ category: cat.id }); };
  const handleSubcategoryClick = (sub, e) => { e?.stopPropagation(); setSearch(''); setSearchParams({ subcategory: sub.id }); };
  const handleBack = () => {
    setSearch('');
    if (subcategoryId && selectedSubcategory) setSearchParams({ category: selectedSubcategory.parentCategory.id });
    else setSearchParams({});
  };

  /* ── JSX ─────────────────────────────────────────────────────────────────── */
  return (
    <div className="-mx-4 sm:-mx-6 -mt-8 min-h-screen bg-gray-50">

      {/* ── PAGE HERO ─────────────────────────────────────────────────────────── */}
      {view === 'categories' && hero?.is_active && (localHeroText(hero, 'title') || hero?.image_path) && (
        <div className="relative overflow-hidden h-[280px] sm:h-[400px]">
          {hero.image_path ? (
            <img src={imgUrl(hero.image_path)} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0d1b3e] via-[#152855] to-[#1e3a8a]" />
          )}
          <div className="absolute inset-0 bg-[#0d1b3e]/55" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-gray-50 via-[#0a1628]/80 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 px-6 sm:px-12 pb-10">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-orange-400">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              Umuhoza Quincaillerie
            </span>
            {localHeroText(hero, 'title') && (
              <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight max-w-3xl">
                {localHeroText(hero, 'title')}
              </h1>
            )}
            {localHeroText(hero, 'subtitle') && (
              <p className="mt-3 text-sm sm:text-lg text-zinc-300 max-w-xl leading-relaxed">
                {localHeroText(hero, 'subtitle')}
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-orange-400"
              >
                Explore Products
              </button>
              <a href="/contact" className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── SEARCH & NAVIGATION STRIP ─────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white px-4 sm:px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder={t('products.search') || 'Search products by name…'}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 py-3 text-sm text-slate-900 placeholder:text-gray-400 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
              {search && <button onClick={() => handleSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none transition">×</button>}
            </div>
            {(view !== 'categories' || search) && (
              <button onClick={handleBack} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-500 hover:text-orange-600">
                ← {subcategoryId ? (selectedSubcategory ? localName(selectedSubcategory.parentCategory) : 'Back') : 'All Categories'}
              </button>
            )}
          </div>

          {/* Breadcrumb */}
          <div className="mt-2.5 flex items-center gap-2 text-sm text-gray-400">
            <button onClick={() => { setSearch(''); setSearchParams({}); }} className="transition hover:text-orange-500">Products</button>
            {selectedCategory && (
              <><span className="text-gray-300">›</span>
              <button onClick={() => { setSearch(''); setSearchParams({ category: selectedCategory.id }); }} className="transition hover:text-orange-500">{localName(selectedCategory)}</button></>
            )}
            {selectedSubcategory && (
              <><span className="text-gray-300">›</span>
              <span className="font-semibold text-slate-700">{localName(selectedSubcategory)}</span></>
            )}
            {search && (
              <><span className="text-gray-300">›</span>
              <span className="text-slate-700">Results for <span className="text-orange-500">"{search}"</span></span></>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <div id="products-grid" className="mx-auto max-w-7xl px-4 sm:px-6 py-10 pb-24">

        {/* ── CATEGORY GRID ─────────────────────────────────────────────────────── */}
        {view === 'categories' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">Our Products</p>
                <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">{t('products.title') || 'Shop by Category'}</h2>
                <p className="mt-2 text-sm text-gray-500">Select a category to explore our products</p>
              </div>
            </div>

            {categories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 p-16 text-center text-gray-400">No categories yet.</div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat, idx) => {
                  const hasImg = !!cat.representative_image;
                  const emoji  = getEmoji(cat.name);
                  const subs   = cat.subcategories || [];
                  return (
                    <ScrollReveal key={cat.id} delay={Math.min(idx, 5) * 80}>
                    <div
                      onClick={() => handleCategoryClick(cat)}
                      className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-orange-400"
                    >
                      {/* Amber top accent on hover */}
                      <div className="h-1 bg-gradient-to-r from-[#1a2d5a] to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Image */}
                      <div className="relative overflow-hidden" style={{ height: 200 }}>
                        {hasImg ? (
                          <img src={imgUrl(cat.representative_image)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#0d1b3e] to-[#1e3a8a]">
                            <span className="text-[80px] opacity-20 select-none">{emoji}</span>
                          </div>
                        )}
                        {hasImg && <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition" />}
                        <div className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition">
                          <svg className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                        </div>
                      </div>

                      {/* Text content */}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-[#1a2d5a] transition">{localName(cat)}</h3>
                          <span className="inline-flex flex-shrink-0 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-600">
                            {cat.product_count > 0 ? cat.product_count : 0}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-400 line-clamp-2 leading-relaxed min-h-[2.5rem] transition-opacity duration-300">
                          {localDesc(cat)}
                        </p>
                        {subs.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {subs.slice(0, 5).map(sub => (
                              <button
                                key={sub.id}
                                onClick={e => handleSubcategoryClick(sub, e)}
                                className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600 transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600"
                              >
                                {localName(sub)}
                              </button>
                            ))}
                            {subs.length > 5 && <span className="text-xs text-gray-400 self-center">+{subs.length - 5} more</span>}
                          </div>
                        )}
                        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                          <p className="text-xs font-semibold text-orange-500 group-hover:text-orange-500 transition">
                            {subs.length > 0 ? `See ${subs.length} subcategor${subs.length === 1 ? 'y' : 'ies'}` : 'Browse products'} →
                          </p>
                        </div>
                      </div>
                    </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SUBCATEGORY GRID ──────────────────────────────────────────────────── */}
        {view === 'subcategories' && selectedCategory && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">{localName(selectedCategory)}</p>
              <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">All Subcategories</h2>
            </div>

            {selectedCategory.subcategories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 p-16 text-center text-gray-400">No subcategories in this category yet.</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {selectedCategory.subcategories.map((sub, idx) => {
                  const emoji  = getEmoji(sub.name);
                  const hasImg = !!sub.representative_image;
                  return (
                    <ScrollReveal key={sub.id} delay={Math.min(idx, 5) * 80}>
                    <button
                      onClick={e => handleSubcategoryClick(sub, e)}
                      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-orange-400"
                    >
                      <div className="h-1 bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative overflow-hidden" style={{ height: 150 }}>
                        {hasImg ? (
                          <img src={imgUrl(sub.representative_image)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#0d1b3e] to-[#1e3a8a]">
                            <span className="text-[60px] opacity-20 select-none">{emoji}</span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow opacity-0 group-hover:opacity-100 transition">
                          <svg className="h-3.5 w-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="font-bold text-slate-900 leading-snug group-hover:text-[#1a2d5a] transition">{localName(sub)}</p>
                        {sub.product_count > 0 && (
                          <p className="mt-0.5 text-xs font-semibold text-orange-500">{sub.product_count} product{sub.product_count !== 1 ? 's' : ''}</p>
                        )}
                        <p className="mt-1.5 text-xs text-gray-400 line-clamp-2 leading-relaxed min-h-[2rem] transition-opacity duration-300">
                          {localDesc(sub)}
                        </p>
                      </div>
                    </button>
                    </ScrollReveal>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── PRODUCT LIST ──────────────────────────────────────────────────────── */}
        {view === 'products' && (
          <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">
                  {selectedSubcategory ? localName(selectedSubcategory.parentCategory) : (selectedCategory ? localName(selectedCategory) : 'Search Results')}
                </p>
                <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                  {search ? <>Results for <span className="text-orange-500">"{search}"</span></>
                         : selectedSubcategory ? localName(selectedSubcategory)
                         : selectedCategory ? localName(selectedCategory)
                         : 'All Products'}
                </h2>
                {!loading && <p className="mt-1 text-sm text-gray-400">{products.length} product{products.length !== 1 ? 's' : ''} found</p>}
              </div>
            </div>

            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-orange-500" />
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 p-16 text-center">
                <p className="text-lg font-bold text-gray-700">No products found</p>
                <p className="mt-2 text-sm text-gray-400">Try a different search or browse another category.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product, idx) => {
                  const variantDisplay = getVariantDisplay(product);
                  const emoji = getEmoji(product.category_name || '');
                  const isAvailable = product.status !== 'Out of Stock';
                  return (
                    <ScrollReveal key={product.id} delay={Math.min(idx, 5) * 70}>
                    <div
                      onClick={() => navigate(`/products/${product.id}`)}
                      className="group cursor-pointer rounded-2xl border border-gray-200 bg-white overflow-hidden flex flex-col shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-orange-400"
                    >
                      <div className="h-1 bg-gradient-to-r from-[#1a2d5a] to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Image */}
                      <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: '16/9' }}>
                        {product.image_path ? (
                          <img src={imgUrl(product.image_path)} alt={product.name} className="h-full w-full object-contain transition duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-5xl opacity-20 select-none">{emoji}</div>
                        )}
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/95 px-2.5 py-1 shadow-sm">
                          <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <span className="text-xs font-semibold text-gray-700">{isAvailable ? 'Available' : 'Out of Stock'}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          {product.subcategory_name && (
                            <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-600">{product.subcategory_name}</span>
                          )}
                          {!product.subcategory_name && product.category_name && (
                            <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-600">{product.category_name}</span>
                          )}
                        </div>

                        <h3 className="font-bold text-slate-900 leading-snug line-clamp-2 text-base group-hover:text-[#1a2d5a] transition">{product.name}</h3>

                        <p className="mt-2 text-sm text-gray-400 line-clamp-2 leading-relaxed min-h-[2.5rem] transition-opacity duration-300">
                          {localDesc(product)}
                        </p>

                        {/* Variants */}
                        {variantDisplay && (
                          <div className="mt-4 space-y-2">
                            {variantDisplay.colors.length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-medium text-gray-400">Colors</span>
                                {variantDisplay.colors.slice(0, 7).map(color => (
                                  <span key={color} title={color} className="h-4 w-4 rounded-full ring-1 ring-gray-300 ring-offset-1 ring-offset-white flex-shrink-0" style={{ backgroundColor: color.match(/^#|^rgb/i) ? color : colorNameToCss(color) }} />
                                ))}
                                {variantDisplay.colors.length > 7 && <span className="text-xs text-gray-400">+{variantDisplay.colors.length - 7}</span>}
                              </div>
                            )}
                            {variantDisplay.sizes.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-medium text-gray-400">Sizes</span>
                                {variantDisplay.sizes.slice(0, 5).map(size => (
                                  <span key={size} className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-600">{size}</span>
                                ))}
                                {variantDisplay.sizes.length > 5 && <span className="text-xs text-gray-400">+{variantDisplay.sizes.length - 5}</span>}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                          <span className="text-xs font-semibold text-orange-500 group-hover:text-orange-500 transition">View Details →</span>
                          {showPrices && (product.min_variant_price > 0 || product.selling_price > 0) && (
                            <span className="text-sm font-bold text-slate-900">
                              {product.min_variant_price > 0 ? <span className="text-xs font-normal text-gray-400 mr-0.5">From </span> : null}
                              {Number(product.min_variant_price > 0 ? product.min_variant_price : product.selling_price).toLocaleString('en-RW')}
                              <span className="text-xs font-normal text-gray-400 ml-0.5">RWF</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
