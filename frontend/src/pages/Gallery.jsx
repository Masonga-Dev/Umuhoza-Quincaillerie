import { useEffect, useState, useCallback } from 'react';
import API from '../api';
import { useLanguage } from '../i18n/LanguageContext';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function Gallery() {
  const [images, setImages]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [hero, setHero]       = useState(null);
  const [lightbox, setLightbox] = useState(null); // index into images[]
  const { t, lang }           = useLanguage();

  useEffect(() => {
    API.get('/public/gallery')
      .then((r) => setImages(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
    API.get('/public/hero/gallery').then(r => setHero(r.data)).catch(() => {});
  }, []);

  const localHeroText = (h, field) =>
    (lang === 'rw' && h?.[`${field}_rw`]) ? h[`${field}_rw`] :
    (lang === 'fr' && h?.[`${field}_fr`]) ? h[`${field}_fr`] :
    (h?.[`${field}_en`] || '');

  const hasHero = hero?.is_active && (localHeroText(hero, 'title') || hero?.image_path);

  const prev = useCallback(() =>
    setLightbox(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() =>
    setLightbox(i => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, prev, next]);

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      {hasHero ? (
        <div className="-mx-4 sm:-mx-6 -mt-8 relative overflow-hidden" style={{ height: 380 }}>
          {hero.image_path ? (
            <img src={`${BACKEND}/${hero.image_path}`} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0a1628, #1a2d5a, #0d1b3e)' }} />
          )}
          <div className="absolute inset-0 bg-[#0d1b3e]/55" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-gray-50 via-[#0a1628]/80 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 px-6 sm:px-12 pb-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              {t('gallery.title')}
            </span>
            {localHeroText(hero, 'title') && (
              <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold text-white leading-tight max-w-3xl">
                {localHeroText(hero, 'title')}
              </h1>
            )}
            {localHeroText(hero, 'subtitle') && (
              <p className="mt-3 text-sm sm:text-lg text-zinc-300 max-w-xl leading-relaxed">
                {localHeroText(hero, 'subtitle')}
              </p>
            )}
          </div>
        </div>
      ) : (
        <section
          className="-mx-4 sm:-mx-6 -mt-8 relative overflow-hidden pb-20 pt-16 text-white"
          style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2d5a 55%, #0d1b3e 100%)' }}
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 65%)' }} />
          <div className="relative mx-auto max-w-3xl px-6 text-center">
            <span className="inline-block rounded-full border border-amber-400/30 bg-amber-400/10 px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-amber-400">
              {t('gallery.title')}
            </span>
            <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">
              Our <span className="text-amber-400">Project Gallery</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-slate-300">{t('gallery.subtitle')}</p>
          </div>
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 56" preserveAspectRatio="none">
            <path d="M0,28 C240,56 480,0 720,28 C960,56 1200,0 1440,28 L1440,56 L0,56 Z" fill="#f9fafb" />
          </svg>
        </section>
      )}

      {/* ── Stats bar ────────────────────────────────────────── */}
      {images.length > 0 && (
        <div className="mx-auto mt-6 flex max-w-xs items-center justify-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-5 py-2 text-sm font-semibold text-amber-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {images.length} {images.length === 1 ? 'photo' : 'photos'}
        </div>
      )}

      {/* ── Gallery Grid ─────────────────────────────────────── */}
      <div className="mt-8">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-20 text-center shadow-sm">
            <svg className="mx-auto h-14 w-14 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-4 text-base font-medium text-slate-400">{t('gallery.empty')}</p>
          </div>
        ) : (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
            {images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setLightbox(idx)}
                className="group mb-4 block w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-xl focus:outline-none"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={`${BACKEND}/${img.image_path}`}
                    alt={img.title || ''}
                    className="w-full object-cover transition duration-500 group-hover:scale-105"
                    style={{ display: 'block' }}
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-[#0d1b3e]/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="w-full px-4 pb-4">
                      {img.title && (
                        <p className="text-sm font-semibold text-white">{img.title}</p>
                      )}
                      <span className="mt-1 inline-flex items-center gap-1 text-xs text-amber-400">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        View full size
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ─────────────────────────────────────────── */}
      {lightbox !== null && images[lightbox] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25 sm:left-6"
            aria-label="Previous"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Image */}
          <div className="relative max-w-5xl w-full mx-14" onClick={(e) => e.stopPropagation()}>
            <img
              src={`${BACKEND}/${images[lightbox].image_path}`}
              alt={images[lightbox].title || ''}
              className="mx-auto max-h-[82vh] w-auto rounded-2xl object-contain shadow-2xl"
            />
            {images[lightbox].title && (
              <p className="mt-3 text-center text-sm font-semibold text-white">{images[lightbox].title}</p>
            )}
            {/* Counter */}
            <p className="mt-1 text-center text-xs text-slate-400">{lightbox + 1} / {images.length}</p>
          </div>

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25 sm:right-6"
            aria-label="Next"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Close */}
          <button
            onClick={() => setLightbox(null)}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25 sm:right-6 sm:top-6"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default Gallery;
