import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { useLanguage } from '../i18n/LanguageContext';

function About() {
  const [s, setS] = useState({});
  const [stats, setStats] = useState({});
  const [whyItems, setWhyItems] = useState([]);
  const { t } = useLanguage();

  useEffect(() => {
    API.get('/public/homepage').then((r) => {
      setS(r.data.settings || {});
      setStats(r.data.stats || {});
      setWhyItems((r.data.sections || []).filter((sec) => sec.section_name === 'why_choose_us'));
    }).catch(console.error);
  }, []);

  const siteName = s.siteName || 'Umuhoza Quincaillerie';
  const yearsExp = s.years_experience || '5';
  const footerText = s.footerText || '';

  const defaultWhyItems = t('about.why.defaultItems');
  const displayWhy = whyItems.length > 0 ? whyItems : defaultWhyItems;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="rounded-3xl bg-slate-950 p-10 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-400">
          {t('about.label')}
        </p>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
          {t('about.title')} {siteName}
        </h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          {siteName} {t('about.descSuffix')}
        </p>
        {footerText && <p className="mt-2 max-w-2xl text-slate-400 text-sm">{footerText}</p>}
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-4">
        {[
          { value: `${stats.products || 0}+`, label: t('about.stats.products') },
          { value: `${stats.categories || 0}+`, label: t('about.stats.categories') },
          { value: `${stats.customers || 0}+`, label: t('about.stats.customers') },
          { value: `${yearsExp}+`, label: t('about.stats.experience') },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-3xl font-bold text-blue-600">{item.value}</p>
            <p className="mt-2 text-sm text-slate-500">{item.label}</p>
          </div>
        ))}
      </section>

      {/* Mission */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">{t('about.mission.title')}</h2>
        <p className="mt-4 text-slate-600">{t('about.mission.text')}</p>
      </section>

      {/* Why Choose Us */}
      <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900">{t('about.why.title')}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {displayWhy.map((item, i) => (
            <div key={item.title || i} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-5">
              <span className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-600" />
              <div>
                <p className="font-semibold text-slate-900">{item.title}</p>
                {(item.description || item.desc) && (
                  <p className="mt-1 text-sm text-slate-600">{item.description || item.desc}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <h2 className="text-xl font-semibold text-slate-900">{t('about.cta.title')}</h2>
        <p className="mt-3 text-slate-600">{t('about.cta.text')}</p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/contact"
            className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
          >
            {t('about.cta.contact')}
          </Link>
          <Link
            to="/products"
            className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t('about.cta.browse')}
          </Link>
        </div>
      </section>
    </div>
  );
}

export default About;
