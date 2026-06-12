import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { useLanguage } from '../i18n/LanguageContext';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const STATUS_CLASS = {
  'In Stock': 'bg-emerald-100 text-emerald-700',
  'Low Stock': 'bg-amber-100 text-amber-700',
  'Out of Stock': 'bg-red-100 text-red-700',
};

function Home() {
  const [data, setData] = useState(null);
  const { t } = useLanguage();

  useEffect(() => {
    API.get('/public/homepage')
      .then((r) => setData(r.data))
      .catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const s = data.settings || {};
  const stats = data.stats || {};
  const featured = data.featured || [];
  const announcements = data.announcements || [];
  const whyItems = (data.sections || []).filter((sec) => sec.section_name === 'why_choose_us');

  const heroTitle = s.heroTitle || t('home.defaultTitle');
  const heroDescription = s.heroDescription || t('home.defaultDesc');
  const heroCta = s.heroCta || t('home.defaultCta');
  const heroBadge = s.heroBadge || t('home.defaultBadge');
  const heroImage = s.heroImage
    ? `${BACKEND}/${s.heroImage}`
    : 'https://images.unsplash.com/photo-1581092337167-1d1fc8f7ef6f?auto=format&fit=crop&w=1600&q=80';
  const phone = s.sitePhone || '+250 788 123 456';
  const whatsapp = s.whatsapp || phone;
  const yearsExp = s.years_experience || '5';

  const defaultWhyItems = t('home.why.defaultItems');

  return (
    <div className="space-y-16">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 text-white shadow-2xl">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Hero" className="h-full w-full object-cover opacity-40" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/90" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="max-w-xl space-y-6">
            <span className="inline-flex rounded-full bg-blue-500/20 px-4 py-2 text-sm font-semibold uppercase tracking-[0.32em] text-blue-200">
              {heroBadge}
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {heroTitle}
            </h1>
            <p className="text-lg leading-8 text-slate-200">{heroDescription}</p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                to="/products"
                className="inline-flex items-center justify-center rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/30 transition hover:bg-amber-300"
              >
                {heroCta}
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/15"
              >
                {t('home.ctaSecondary')}
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 px-5 py-5 backdrop-blur-sm">
                <p className="text-3xl font-extrabold">{stats.products}+</p>
                <p className="text-sm text-slate-300">{t('home.stats.products')}</p>
              </div>
              <div className="rounded-3xl bg-white/10 px-5 py-5 backdrop-blur-sm">
                <p className="text-3xl font-extrabold">{yearsExp}+</p>
                <p className="text-sm text-slate-300">{t('home.stats.experience')}</p>
              </div>
            </div>
          </div>
          <div className="relative hidden items-end justify-end rounded-[2rem] bg-white/5 p-6 backdrop-blur-sm sm:p-8 lg:flex">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80"
                alt="Hardware store"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-4 rounded-[2rem] bg-white p-6 shadow-lg sm:grid-cols-4">
          {[
            { value: `${stats.products}+`, label: t('home.stats.products') },
            { value: `${stats.categories}+`, label: t('home.stats.categories') },
            { value: `${stats.customers}+`, label: t('home.stats.customers') },
            { value: `${yearsExp}+`, label: t('home.stats.experience') },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-3xl font-bold text-slate-900">{item.value}</p>
              <p className="mt-2 text-sm text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Products + Why Choose Us ─────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Featured products */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-500">
              {t('home.featured.label')}
            </p>
            <h2 className="mt-4 text-3xl font-extrabold text-slate-900">{t('home.featured.title')}</h2>
            <p className="mt-3 text-slate-600">{t('home.featured.desc')}</p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {featured.length > 0 ? (
                featured.slice(0, 4).map((product) => (
                  <div key={product.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 h-40 overflow-hidden rounded-2xl bg-slate-100">
                      {product.image_path ? (
                        <img
                          src={`${BACKEND}/${product.image_path}`}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-400">
                          {t('home.noImage')}
                        </div>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 line-clamp-1">{product.name}</h3>
                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                      {product.description || t('home.featured.desc')}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-slate-500">{product.category_name || t('home.general')}</span>
                      <span className={`rounded-full px-2.5 py-1 font-semibold ${STATUS_CLASS[product.status] || 'bg-slate-100 text-slate-600'}`}>
                        {product.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-400 sm:col-span-2">
                  <p className="text-sm">{t('home.featured.empty')}</p>
                </div>
              )}
            </div>
            {featured.length > 0 && (
              <div className="mt-6">
                <Link
                  to="/products"
                  className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {t('home.featured.viewAll')}
                </Link>
              </div>
            )}
          </div>

          {/* Why Choose Us */}
          <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl">
            <h3 className="text-2xl font-semibold">{t('home.why.title')}</h3>
            <div className="mt-8 space-y-4">
              {whyItems.length > 0
                ? whyItems.map((item) => (
                    <div key={item.id} className="rounded-3xl bg-slate-900/80 p-5">
                      <h4 className="text-base font-semibold text-white">{item.title}</h4>
                      {item.description && (
                        <p className="mt-2 text-sm text-slate-300">{item.description}</p>
                      )}
                    </div>
                  ))
                : defaultWhyItems.map((item) => (
                    <div key={item.title} className="rounded-3xl bg-slate-900/80 p-5">
                      <h4 className="text-base font-semibold text-white">{item.title}</h4>
                      <p className="mt-2 text-sm text-slate-300">{item.desc}</p>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Announcements ──────────────────────────────────────────────────── */}
      {announcements.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-[2rem] bg-white p-8 shadow-lg">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-500">
              {t('home.announcements.label')}
            </p>
            <h2 className="mt-3 text-2xl font-extrabold text-slate-900">
              {t('home.announcements.title')}
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {announcements.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  {item.content && (
                    <p className="mt-2 text-sm text-slate-600 line-clamp-3">{item.content}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Gallery Preview ─────────────────────────────────────────────────── */}
      {data.gallery?.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-500">
                {t('home.gallery.label')}
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
                {t('home.gallery.title')}
              </h2>
            </div>
            <Link to="/gallery" className="text-sm font-semibold text-blue-600 hover:underline">
              {t('home.gallery.viewAll')}
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.gallery.slice(0, 4).map((img) => (
              <div key={img.id} className="overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
                <img
                  src={`${BACKEND}/${img.image_path}`}
                  alt={img.title || ''}
                  className="h-48 w-full object-cover transition hover:scale-105"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA Banner ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-[2rem] bg-slate-950 px-8 py-12 text-white shadow-2xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-400">
                {t('home.cta.label')}
              </p>
              <h3 className="mt-4 text-3xl font-extrabold">{t('home.cta.title')}</h3>
              <p className="mt-4 max-w-xl text-slate-300">{t('home.cta.desc')}</p>
            </div>
            <div className="space-y-4">
              <a
                href={`tel:${phone}`}
                className="inline-flex w-full items-center justify-between rounded-full bg-white/10 px-5 py-4 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/15"
              >
                <span>{phone}</span>
                <span className="text-amber-400">{t('home.cta.call')}</span>
              </a>
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-between rounded-full bg-amber-400 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
              >
                <span>{t('home.cta.whatsapp')}</span>
                <span className="font-bold">{t('home.cta.whatsappBtn')}</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
