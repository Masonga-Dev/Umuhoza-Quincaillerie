import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import IndustriesSection from '../components/IndustriesSection';
import ScrollReveal from '../components/ScrollReveal';

const CATEGORY_META = {
  construction: { emoji: '🏗️', color: 'bg-orange-50 border-orange-200', accent: 'text-orange-600' },
  tool: { emoji: '🔧', color: 'bg-blue-50 border-blue-200', accent: 'text-blue-600' },
  paint: { emoji: '🎨', color: 'bg-purple-50 border-purple-200', accent: 'text-purple-600' },
  electric: { emoji: '⚡', color: 'bg-yellow-50 border-yellow-200', accent: 'text-yellow-600' },
  plumb: { emoji: '🔩', color: 'bg-teal-50 border-teal-200', accent: 'text-teal-600' },
  roof: { emoji: '🏠', color: 'bg-emerald-50 border-emerald-200', accent: 'text-emerald-600' },
};
function getCatMeta(name = '') {
  const l = name.toLowerCase();
  for (const [k, m] of Object.entries(CATEGORY_META)) { if (l.includes(k)) return m; }
  return { emoji: '📦', color: 'bg-indigo-50 border-indigo-200', accent: 'text-indigo-600' };
}

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://umuhoza-backend.onrender.com';
const imgUrl = p => !p ? '' : p.startsWith('http') ? p : `${BACKEND}/${p}`;

const STATUS_CLASS = {
  'In Stock': 'bg-emerald-100 text-emerald-700',
  'Low Stock': 'bg-orange-100 text-orange-700',
  'Out of Stock': 'bg-red-100 text-red-700',
};

function Home() {
  const [data, setData] = useState(null);
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

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

  const localName = obj => (lang === 'rw' && obj?.name_rw) ? obj.name_rw : (lang === 'fr' && obj?.name_fr) ? obj.name_fr : (obj?.name || '');
  const localDesc = obj => (lang === 'rw' && obj?.description_rw) ? obj.description_rw : (lang === 'fr' && obj?.description_fr) ? obj.description_fr : (obj?.description || '');

  const s = data.settings || {};
  const stats = data.stats || {};
  const categories = data.categories || [];
  const announcements = data.announcements || [];
  const whyItems = (data.sections || []).filter((sec) => sec.section_name === 'why_choose_us');

  const heroTitle = s.heroTitle || t('home.defaultTitle');
  const heroDescription = s.heroDescription || t('home.defaultDesc');
  const heroCta = s.heroCta || t('home.defaultCta');
  const heroBadge = s.heroBadge || t('home.defaultBadge');
  const heroImage = s.heroImage
    ? imgUrl(s.heroImage)
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
          <img src={heroImage} alt="Hero" className="h-full w-full object-cover opacity-65" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/35 to-slate-950/65" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="max-w-xl space-y-6">
            <span className="inline-flex rounded-full border border-orange-400/40 bg-orange-400/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.32em] text-orange-300">
              {heroBadge}
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {heroTitle}
            </h1>
            <p className="text-lg leading-8 text-slate-200">{heroDescription}</p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                to="/products"
                className="inline-flex items-center justify-center rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-400"
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
        <div className="grid grid-cols-2 gap-4 rounded-[2rem] bg-white p-6 shadow-lg sm:grid-cols-4">
          {[
            { value: `${stats.products}+`, label: t('home.stats.products') },
            { value: `${stats.categories}+`, label: t('home.stats.categories') },
            { value: `${stats.customers}+`, label: t('home.stats.customers') },
            { value: `${yearsExp}+`, label: t('home.stats.experience') },
          ].map((item, idx) => (
            <ScrollReveal key={item.label} delay={idx * 100}>
              <div className="rounded-3xl border border-orange-100 bg-orange-50 p-6 text-center">
                <p className="text-3xl font-bold text-[#1a2d5a]">{item.value}</p>
                <p className="mt-2 text-sm text-gray-500">{item.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Industries We Serve ────────────────────────────────────────────── */}
      <IndustriesSection />

      {/* ── Shop by Category ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-orange-500">Our Products</p>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">Shop by Category</h2>
            <p className="mt-3 max-w-lg text-slate-500">Browse our wide selection of quality hardware and construction materials.</p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow sm:self-auto"
          >
            View all categories →
          </Link>
        </div>

        {/* Category tiles grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.length > 0 ? (
            categories.slice(0, 6).map((cat, idx) => {
              const meta = getCatMeta(cat.name);
              const hasImg = !!cat.representative_image;
              return (
                <ScrollReveal key={cat.id} delay={idx * 80}>
                <button
                  onClick={() => navigate(`/products?category=${cat.id}`)}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:shadow-xl hover:-translate-y-1 text-left w-full"
                  style={{ aspectRatio: '4/3' }}
                >
                  {/* Background image or color */}
                  {hasImg ? (
                    <div className="absolute inset-0">
                      <img
                        src={imgUrl(cat.representative_image)}
                        alt=""
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/10" />
                    </div>
                  ) : (
                    <div className={`absolute inset-0 ${meta.color}`}>
                      <div className="flex h-full items-center justify-center text-[80px] opacity-10 select-none">{meta.emoji}</div>
                    </div>
                  )}

                  {/* Emoji badge (top-left, image tiles only) */}
                  {hasImg && (
                    <div className="absolute top-4 left-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-xl backdrop-blur-sm">
                      {meta.emoji}
                    </div>
                  )}

                  {/* Arrow (top-right) */}
                  <div className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>

                  {/* Text at bottom */}
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    {!hasImg && <div className="mb-2 text-3xl">{meta.emoji}</div>}
                    <p className={`text-lg font-bold leading-tight ${hasImg ? 'text-white' : 'text-slate-900'}`}>
                      {localName(cat)}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${hasImg ? 'bg-white/15 text-slate-100' : 'bg-slate-900/10 text-slate-600'}`}>
                        {cat.product_count > 0 ? `${cat.product_count} product${cat.product_count !== 1 ? 's' : ''}` : 'No products yet'}
                      </span>
                    </div>
                    {localDesc(cat) && (
                      <p className={`mt-2 text-sm line-clamp-2 leading-relaxed ${hasImg ? 'text-white/75' : 'text-slate-600'}`}>
                        {localDesc(cat)}
                      </p>
                    )}
                  </div>
                </button>
                </ScrollReveal>
              );
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400 sm:col-span-3">
              <p className="text-sm">No categories yet. Add them from the admin panel.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Why Choose Us ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-[2.5rem] bg-slate-950 shadow-2xl">
          <div className="grid gap-0 lg:grid-cols-2">
            {/* Left: why items */}
            <div className="p-10 lg:p-14">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-orange-400">Why Us</p>
              <h3 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">{t('home.why.title')}</h3>
              <div className="mt-8 space-y-4">
                {whyItems.length > 0
                  ? whyItems.map((item) => (
                      <div key={item.id} className="flex gap-4 rounded-2xl bg-white/5 p-5">
                        <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500" />
                        <div>
                          <h4 className="font-semibold text-white">{item.title}</h4>
                          {item.description && <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{item.description}</p>}
                        </div>
                      </div>
                    ))
                  : (t('home.why.defaultItems') || []).map((item) => (
                      <div key={item.title} className="flex gap-4 rounded-2xl bg-white/5 p-5">
                        <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500" />
                        <div>
                          <h4 className="font-semibold text-white">{item.title}</h4>
                          <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{item.desc}</p>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
            {/* Right: stat highlights */}
            <div className="flex flex-col justify-center gap-6 border-t border-white/10 p-10 lg:border-l lg:border-t-0 lg:p-14">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-orange-400">By the numbers</p>
              {[
                { value: `${stats.products ?? 0}+`, label: 'Products in stock' },
                { value: `${stats.categories ?? 0}+`, label: 'Product categories' },
                { value: `${yearsExp}+`, label: 'Years of experience' },
                { value: `${stats.customers ?? 0}+`, label: 'Happy customers' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-5">
                  <p className="text-4xl font-extrabold text-white tabular-nums">{item.value}</p>
                  <p className="text-sm text-slate-400 leading-tight">{item.label}</p>
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
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-orange-500">
              {t('home.announcements.label')}
            </p>
            <h2 className="mt-3 text-2xl font-extrabold text-slate-900">
              {t('home.announcements.title')}
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {announcements.slice(0, 3).map((item, idx) => (
                <ScrollReveal key={item.id} delay={idx * 100}>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    {item.content && (
                      <p className="mt-2 text-sm text-slate-600 line-clamp-3">{item.content}</p>
                    )}
                  </div>
                </ScrollReveal>
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
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-orange-500">
                {t('home.gallery.label')}
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
                {t('home.gallery.title')}
              </h2>
            </div>
            <Link to="/gallery" className="text-sm font-semibold text-orange-500 hover:underline transition">
              {t('home.gallery.viewAll')}
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.gallery.slice(0, 4).map((img) => (
              <div key={img.id} className="overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
                <img
                  src={imgUrl(img.image_path)}
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
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-orange-400">
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
                <span className="text-orange-400">{t('home.cta.call')}</span>
              </a>
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-between rounded-full bg-orange-500 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
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
