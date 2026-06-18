import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function fmtPrice(v) {
  return Number(v || 0).toLocaleString('en-RW');
}

function StatusBadge({ status }) {
  const isAvailable = status === 'In Stock' || status === 'Low Stock';
  const label = isAvailable ? 'Available In Store' : 'Out of Stock';
  const cls = isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';
  return <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${cls}`}>{label}</span>;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [zoomed, setZoomed] = useState(false);
  const [showPrices, setShowPrices] = useState(true);

  useEffect(() => {
    API.get(`/public/products/${id}`)
      .then(r => {
        setProduct(r.data);
        setShowPrices(r.data?.show_prices !== 'false');
        if (r.data.variants?.length) {
          const inStock = r.data.variants.find(v => v.stock_quantity > 0);
          setSelectedVariant(inStock || r.data.variants[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!zoomed || !product) return;
    const imgs = product.images?.length ? product.images : (product.image_path ? [{ id: 0, image_path: product.image_path }] : []);
    const handleKey = (e) => {
      if (e.key === 'Escape') setZoomed(false);
      if (e.key === 'ArrowLeft') setActiveImg(i => (i - 1 + imgs.length) % Math.max(imgs.length, 1));
      if (e.key === 'ArrowRight') setActiveImg(i => (i + 1) % Math.max(imgs.length, 1));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [zoomed, product]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl bg-white border border-slate-200">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"/>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200 p-12 text-center">
        <p className="text-slate-500">Product not found.</p>
        <button onClick={() => navigate('/products')} className="mt-4 text-blue-600 hover:underline text-sm">← Back to products</button>
      </div>
    );
  }

  const images = product.images?.length ? product.images : (product.image_path ? [{ id: 0, image_path: product.image_path, is_primary: 1 }] : []);
  const variants = product.variants || [];
  const hasVariants = variants.length > 0;
  const currentPrice = selectedVariant ? selectedVariant.selling_price : product.selling_price;
  const currentStock = selectedVariant ? { label: selectedVariant.status, qty: selectedVariant.stock_quantity } : { label: product.status, qty: product.stock_quantity };

  const variantColors = [...new Set(variants.filter(v => v.color).map(v => v.color))];
  const variantSizes = [...new Set(variants.filter(v => v.size).map(v => v.size))];

  const prevImg = () => setActiveImg(i => (i - 1 + images.length) % Math.max(images.length, 1));
  const nextImg = () => setActiveImg(i => (i + 1) % Math.max(images.length, 1));

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => navigate('/products')} className="hover:text-blue-600 transition">Products</button>
        {product.category_name && (<><span>›</span><button onClick={() => navigate(`/products?category=${product.category_id}`)} className="hover:text-blue-600 transition">{product.category_name}</button></>)}
        <span>›</span>
        <span className="text-slate-800 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        {/* Image gallery */}
        <div className="space-y-3">
          {/* Main image with arrows */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 aspect-square">
            {images.length > 0 ? (
              <>
                <img
                  src={`${BACKEND}/${images[activeImg]?.image_path}`}
                  alt={product.name}
                  className="h-full w-full object-cover cursor-zoom-in transition duration-300"
                  onClick={() => setZoomed(true)}
                />
                {/* Prev / Next arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImg}
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur-sm text-slate-700 hover:bg-white transition text-xl font-bold"
                    >
                      ‹
                    </button>
                    <button
                      onClick={nextImg}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur-sm text-slate-700 hover:bg-white transition text-xl font-bold"
                    >
                      ›
                    </button>
                  </>
                )}
                {/* Zoom hint */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-xs text-white backdrop-blur-sm pointer-events-none">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                  </svg>
                  Click to zoom
                </div>
                {/* Slide counter */}
                {images.length > 1 && (
                  <div className="absolute top-3 left-3 rounded-full bg-black/40 px-2.5 py-1 text-xs text-white backdrop-blur-sm pointer-events-none">
                    {activeImg + 1} / {images.length}
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-300 text-7xl">📦</div>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={img.id || i}
                  onClick={() => setActiveImg(i)}
                  className={`flex-shrink-0 h-16 w-16 overflow-hidden rounded-xl border-2 transition ${activeImg === i ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent hover:border-slate-300'}`}
                >
                  <img src={`${BACKEND}/${img.image_path}`} alt="" className="h-full w-full object-cover"/>
                </button>
              ))}
            </div>
          )}

          {/* Dot indicators */}
          {images.length > 1 && (
            <div className="flex justify-center gap-1.5 pt-1">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`rounded-full transition-all ${activeImg === i ? 'w-5 h-2 bg-blue-600' : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-5">
          {product.category_name && (
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-500">{product.category_name}</span>
          )}
          <h1 className="text-3xl font-bold text-slate-900 leading-snug">{product.name}</h1>

          {/* Price */}
          {showPrices && currentPrice > 0 && (
            <div className="text-2xl font-extrabold text-blue-600">{fmtPrice(currentPrice)} RWF</div>
          )}

          {/* Stock status */}
          <div className="flex items-center gap-3">
            <StatusBadge status={currentStock.label}/>
          </div>

          {product.description && (
            <p className="text-slate-600 leading-relaxed">{product.description}</p>
          )}

          {/* Variant selector */}
          {hasVariants && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
              <p className="text-sm font-bold text-slate-700 uppercase tracking-wider">Available Options</p>

              {variantColors.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">Color</p>
                  <div className="flex flex-wrap gap-2">
                    {variantColors.map(color => {
                      const v = variants.find(x => x.color === color && (!selectedVariant?.size || x.size === selectedVariant.size));
                      const active = selectedVariant?.color === color;
                      return (
                        <button
                          key={color}
                          onClick={() => { if (v) setSelectedVariant(v); }}
                          className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'} ${!v || v.stock_quantity === 0 ? 'opacity-40 line-through cursor-not-allowed' : ''}`}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {variantSizes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {variantSizes.map(size => {
                      const v = variants.find(x => x.size === size && (!selectedVariant?.color || x.color === selectedVariant.color));
                      const active = selectedVariant?.size === size;
                      return (
                        <button
                          key={size}
                          onClick={() => { if (v) setSelectedVariant(v); }}
                          className={`rounded-xl border px-4 py-1.5 text-sm font-semibold transition ${active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'} ${!v || v.stock_quantity === 0 ? 'opacity-40 line-through cursor-not-allowed' : ''}`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All variants table */}
              {!variantColors.length && !variantSizes.length && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-200">
                      <th className="py-2 pr-4 text-left text-xs font-semibold text-slate-500">Variant</th>
                      {showPrices && <th className="py-2 pr-4 text-right text-xs font-semibold text-slate-500">Price</th>}
                      <th className="py-2 text-left text-xs font-semibold text-slate-500">Availability</th>
                    </tr></thead>
                    <tbody>
                      {variants.map(v => (
                        <tr key={v.id} onClick={() => setSelectedVariant(v)}
                          className={`cursor-pointer border-b border-slate-100 transition hover:bg-white ${selectedVariant?.id === v.id ? 'bg-blue-50' : ''}`}>
                          <td className="py-2 pr-4 font-medium text-slate-800">{v.sku || `Variant ${v.id}`}</td>
                          {showPrices && <td className="py-2 pr-4 text-right text-blue-600 font-semibold">{fmtPrice(v.selling_price)} RWF</td>}
                          <td className="py-2"><StatusBadge status={v.status}/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="tel:+250788123456"
              className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
            >
              📞 Call to Order
            </a>
            <button
              onClick={() => navigate('/contact')}
              className="flex items-center gap-2 rounded-2xl border-2 border-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
            >
              Get a Quote
            </button>
          </div>

          {/* SKU */}
          {(selectedVariant?.sku || product.sku) && (
            <p className="text-xs text-slate-400">SKU: {selectedVariant?.sku || product.sku}</p>
          )}
        </div>
      </div>

      {/* Zoom lightbox */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setZoomed(false)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white text-xl hover:bg-white/20 transition z-10"
            onClick={() => setZoomed(false)}
          >
            ✕
          </button>

          {/* Prev / Next in lightbox */}
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white text-3xl hover:bg-white/25 transition z-10 font-bold"
                onClick={e => { e.stopPropagation(); prevImg(); }}
              >
                ‹
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white text-3xl hover:bg-white/25 transition z-10 font-bold"
                onClick={e => { e.stopPropagation(); nextImg(); }}
              >
                ›
              </button>
            </>
          )}

          {/* Full image */}
          <img
            src={`${BACKEND}/${images[activeImg]?.image_path}`}
            alt={product.name}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />

          {/* Thumbnail strip in lightbox */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 rounded-2xl bg-black/40 p-2 backdrop-blur-sm">
              {images.map((img, i) => (
                <button
                  key={img.id || i}
                  onClick={e => { e.stopPropagation(); setActiveImg(i); }}
                  className={`h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${activeImg === i ? 'border-white' : 'border-white/20 hover:border-white/50'}`}
                >
                  <img src={`${BACKEND}/${img.image_path}`} alt="" className="h-full w-full object-cover"/>
                </button>
              ))}
            </div>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur-sm">
              {activeImg + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
