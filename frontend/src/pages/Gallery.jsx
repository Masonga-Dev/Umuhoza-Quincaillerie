import { useEffect, useState } from 'react';
import API from '../api';
import { useLanguage } from '../i18n/LanguageContext';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const { t } = useLanguage();

  useEffect(() => {
    API.get('/public/gallery')
      .then((r) => setImages(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="rounded-3xl bg-slate-950 p-8 text-white shadow-xl">
        <h1 className="text-3xl font-extrabold">{t('gallery.title')}</h1>
        <p className="mt-2 text-slate-300">{t('gallery.subtitle')}</p>
      </section>

      {images.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center text-slate-400 shadow-sm">
          <p className="text-base">{t('gallery.empty')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {images.map((img) => (
            <button
              key={img.id}
              onClick={() => setLightbox(img)}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm text-left"
            >
              <div className="overflow-hidden">
                <img
                  src={`${BACKEND}/${img.image_path}`}
                  alt={img.title || ''}
                  className="h-52 w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              {img.title && (
                <div className="p-3">
                  <p className="text-sm font-medium text-slate-800">{img.title}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={`${BACKEND}/${lightbox.image_path}`}
              alt={lightbox.title || ''}
              className="w-full rounded-2xl object-contain max-h-[80vh] shadow-2xl"
            />
            {lightbox.title && (
              <p className="mt-3 text-center text-white font-medium">{lightbox.title}</p>
            )}
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg text-sm font-bold hover:bg-slate-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gallery;
