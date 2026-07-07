import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import IndustriesSection from '../components/IndustriesSection';
import ScrollReveal from '../components/ScrollReveal';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://umuhoza-backend.onrender.com';
const imgUrl = p => !p ? '' : p.startsWith('http') ? p : `${BACKEND}/${p}`;

const WHY_ICONS = [
  <svg key="shield" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  <svg key="truck" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8l2-2zm0 0l2-5h3l2 5-2 2h-3l-2-2z"/></svg>,
  <svg key="coin" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  <svg key="users" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  <svg key="bolt" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  <svg key="star" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
];

function CurveDivider({ topColor = '#f9fafb', bottomColor = '#ffffff', flip = false }) {
  const path = flip
    ? 'M0,0 C360,64 1080,0 1440,32 L1440,64 L0,64 Z'
    : 'M0,32 C360,0 1080,64 1440,32 L1440,64 L0,64 Z';
  return (
    <div className="relative h-16 overflow-hidden" style={{ background: topColor }}>
      <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 64" preserveAspectRatio="none">
        <path d={path} fill={bottomColor} />
      </svg>
    </div>
  );
}

function About() {
  const [s, setS]         = useState({});
  const [stats, setStats] = useState({});
  const [whyItems, setWhyItems] = useState([]);
  const [hero, setHero]   = useState(null);
  const { t, lang }       = useLanguage();

  useEffect(() => {
    API.get('/public/homepage').then((r) => {
      setS(r.data.settings || {});
      setStats(r.data.stats || {});
      setWhyItems((r.data.sections || []).filter((sec) => sec.section_name === 'why_choose_us'));
    }).catch(console.error);
    API.get('/public/hero/about').then(r => setHero(r.data)).catch(() => {});
  }, []);

  const localHeroText = (h, field) =>
    (lang === 'rw' && h?.[`${field}_rw`]) ? h[`${field}_rw`] :
    (lang === 'fr' && h?.[`${field}_fr`]) ? h[`${field}_fr`] :
    (h?.[`${field}_en`] || '');

  const siteName  = s.siteName        || 'Umuhoza Quincaillerie';
  const yearsExp  = s.years_experience || '5';
  const footerText = s.footerText     || '';
  const defaultWhyItems = t('about.why.defaultItems');
  const displayWhy      = whyItems.length > 0 ? whyItems : defaultWhyItems;

  const hasHero = hero?.is_active && (localHeroText(hero, 'title') || hero?.image_path);

  return (
    <div>

      {/* ── Hero ─────────────────────────────────────────────── */}
      {hasHero ? (
        /* Admin-uploaded hero banner */
        <div className="-mx-4 sm:-mx-6 -mt-8 relative overflow-hidden" style={{ height: 420 }}>
          {hero.image_path ? (
            <img src={imgUrl(hero.image_path)} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0a1628, #1a2d5a, #0d1b3e)' }} />
          )}
          <div className="absolute inset-0 bg-[#0d1b3e]/55" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-gray-50 via-[#0a1628]/80 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 px-6 sm:px-12 pb-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-orange-400">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              {t('about.label')}
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
        /* Static fallback hero */
        <section
          className="-mx-4 sm:-mx-6 -mt-8 relative overflow-hidden pb-32 pt-20 text-white"
          style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2d5a 55%, #0d1b3e 100%)' }}
        >
          <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 65%)' }} />
          <div className="pointer-events-none absolute -bottom-20 left-0 h-80 w-80 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 65%)' }} />
          <div className="relative mx-auto max-w-3xl px-6 text-center">
            <span className="inline-block rounded-full border border-orange-400/30 bg-orange-500/10 px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-orange-400">
              {t('about.label')}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              {t('about.title')}{' '}
              <span className="text-orange-400">{siteName}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
              {siteName} {t('about.descSuffix')}
            </p>
            {footerText && (
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400">{footerText}</p>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/contact" className="rounded-full bg-orange-500 px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-orange-500">
                {t('about.cta.contact')}
              </Link>
              <Link to="/products" className="rounded-full border border-white/25 bg-white/10 px-8 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">
                {t('about.cta.browse')}
              </Link>
            </div>
          </div>
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 72" preserveAspectRatio="none">
            <path d="M0,36 C240,72 480,0 720,36 C960,72 1200,0 1440,36 L1440,72 L0,72 Z" fill="#f9fafb" />
          </svg>
        </section>
      )}

      {/* ── Stats ─────────────────────────────────────────────── */}
      <section className="bg-gray-50 px-4 pb-6 pt-10 sm:px-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { value: `${stats.products || 0}+`, label: t('about.stats.products'), icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
            { value: `${stats.categories || 0}+`, label: t('about.stats.categories'), icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg> },
            { value: `${stats.customers || 0}+`, label: t('about.stats.customers'), icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
            { value: `${yearsExp}+`, label: t('about.stats.experience'), icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
          ].map((item, idx) => (
            <ScrollReveal key={item.label} delay={idx * 100}>
            <div className="group rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 transition group-hover:bg-orange-500 group-hover:text-white">
                {item.icon}
              </div>
              <p className="mt-4 text-3xl font-extrabold" style={{ color: '#1a2d5a' }}>{item.value}</p>
              <p className="mt-1.5 text-sm font-medium text-slate-500">{item.label}</p>
            </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <CurveDivider topColor="#f9fafb" bottomColor="#ffffff" flip={false} />

      {/* ── Mission & Vision ─────────────────────────────────── */}
      <section className="bg-white px-4 pb-10 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2">
              <span className="h-px w-8 bg-orange-500" />
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-500">Our Purpose</span>
              <span className="h-px w-8 bg-orange-500" />
            </div>
            <h2 className="mt-2 text-3xl font-extrabold" style={{ color: '#1a2d5a' }}>Driven by Quality &amp; Trust</h2>
          </div>

          <ScrollReveal>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl p-8 text-white shadow-xl"
              style={{ background: 'linear-gradient(135deg, #1a2d5a 0%, #0d1b3e 100%)' }}>
              <div className="pointer-events-none absolute -bottom-12 -right-12 h-48 w-48 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.15), transparent 70%)' }} />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/20 text-orange-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="mt-5 text-2xl font-bold">{t('about.mission.title')}</h3>
                <div className="mt-2 h-1 w-12 rounded-full bg-orange-500" />
                <p className="mt-4 leading-relaxed text-slate-300">{t('about.mission.text')}</p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-orange-100 bg-white p-8 shadow-sm">
              <div className="pointer-events-none absolute -bottom-12 -right-12 h-48 w-48 rounded-full opacity-[0.05]"
                style={{ background: '#1a2d5a' }} />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="mt-5 text-2xl font-bold" style={{ color: '#1a2d5a' }}>Our Vision</h3>
                <div className="mt-2 h-1 w-12 rounded-full bg-orange-500" />
                <p className="mt-4 leading-relaxed text-slate-600">
                  To be Rwanda&apos;s most trusted hardware and construction materials supplier — empowering builders,
                  contractors, and homeowners with quality products, fair prices, and expert guidance.
                </p>
              </div>
            </div>
          </div>
          </ScrollReveal>
        </div>
      </section>

      <CurveDivider topColor="#ffffff" bottomColor="#f1f5f9" flip={true} />

      {/* ── Why Choose Us ──────────────────────────────────────── */}
      <section className="bg-slate-100 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2">
              <span className="h-px w-8 bg-orange-500" />
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-500">{t('about.why.title')}</span>
              <span className="h-px w-8 bg-orange-500" />
            </div>
            <h2 className="mt-2 text-3xl font-extrabold" style={{ color: '#1a2d5a' }}>Why Customers Choose Us</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {displayWhy.map((item, i) => (
              <ScrollReveal key={item.title || i} delay={Math.min(i, 5) * 80}>
              <div
                className="group flex gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500 transition group-hover:bg-orange-500 group-hover:text-white">
                  {WHY_ICONS[i % WHY_ICONS.length]}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{item.title}</p>
                  {(item.description || item.desc) && (
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{item.description || item.desc}</p>
                  )}
                </div>
              </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Industries We Serve ─────────────────────────────────── */}
      <section className="bg-slate-100 py-10">
        <IndustriesSection />
      </section>

      {/* ── CTA with wave-only top edge ──────────────────────── */}
      <section
        className="-mx-4 sm:-mx-6 -mb-8 relative overflow-hidden text-center text-white"
        style={{ background: 'linear-gradient(160deg, #0d1b3e 0%, #1a2d5a 60%, #0d1b3e 100%)' }}
      >
        {/* Wave curve — the ONLY top separator, transitioning from slate-100 */}
        <svg viewBox="0 0 1440 72" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '72px' }}>
          <path d="M0,36 C360,72 1080,0 1440,36 L1440,0 L0,0 Z" fill="#f4f6f8" />
        </svg>

        <div className="px-4 pb-16 pt-10 sm:px-8 sm:pb-24">
          <span className="inline-block rounded-full border border-orange-400/30 bg-orange-500/10 px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-orange-400">
            Get Started
          </span>
          <h2 className="mt-5 text-3xl font-extrabold sm:text-4xl">{t('about.cta.title')}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">{t('about.cta.text')}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/contact" className="rounded-full bg-orange-500 px-9 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-orange-500">
              {t('about.cta.contact')}
            </Link>
            <Link to="/products" className="rounded-full border border-white/25 px-9 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">
              {t('about.cta.browse')}
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

export default About;
