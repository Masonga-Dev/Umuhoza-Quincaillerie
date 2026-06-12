import { useEffect, useState } from 'react';
import API from '../api';
import { useLanguage } from '../i18n/LanguageContext';

function Contact() {
  const [s, setS] = useState({});
  const { t } = useLanguage();

  useEffect(() => {
    API.get('/public/settings').then((r) => setS(r.data || {})).catch(console.error);
  }, []);

  const phone = s.sitePhone || '+250 788 123 456';
  const email = s.siteEmail || 'info@umuhoza.com';
  const address = s.siteAddress || 'Kigali, Rwanda';
  const whatsapp = s.whatsapp || phone;
  const hours = s.businessHours || 'Mon–Sat · 7:30 AM – 6:00 PM';
  const siteName = s.siteName || 'Umuhoza Quincaillerie';

  const cards = [
    { icon: '📞', label: t('contact.cards.phone'), value: phone, href: `tel:${phone}` },
    { icon: '✉️', label: t('contact.cards.email'), value: email, href: `mailto:${email}` },
    { icon: '💬', label: t('contact.cards.whatsapp'), value: whatsapp, href: `https://wa.me/${whatsapp.replace(/\D/g, '')}` },
    { icon: '📍', label: t('contact.cards.address'), value: address, href: null },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="rounded-3xl bg-slate-950 p-8 text-white shadow-xl">
        <h1 className="text-3xl font-extrabold">{t('contact.title')}</h1>
        <p className="mt-3 text-slate-300 max-w-xl">
          {t('contact.subtitle')} {siteName} {t('contact.subtitleEnd')}
        </p>
      </section>

      {/* Contact Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-2xl">{item.icon}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-slate-400">{item.label}</p>
            {item.href ? (
              <a
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
                className="mt-1 block text-sm font-semibold text-blue-600 hover:underline break-all"
              >
                {item.value}
              </a>
            ) : (
              <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
            )}
          </div>
        ))}
      </section>

      {/* Store Info + Hours */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{t('contact.storeInfo')}</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            {[
              { label: t('contact.cards.phone'), value: phone, href: `tel:${phone}` },
              { label: t('contact.cards.email'), value: email, href: `mailto:${email}` },
              { label: t('contact.cards.whatsapp'), value: whatsapp, href: `https://wa.me/${whatsapp.replace(/\D/g, '')}` },
              { label: t('contact.cards.address'), value: address, href: null },
            ].map((row) => (
              <div key={row.label} className="flex gap-3">
                <span className="text-slate-400 w-24 flex-shrink-0">{row.label}</span>
                {row.href ? (
                  <a
                    href={row.href}
                    target={row.href.startsWith('http') ? '_blank' : undefined}
                    rel="noreferrer"
                    className="font-medium text-blue-600 hover:underline break-all"
                  >
                    {row.value}
                  </a>
                ) : (
                  <span className="font-medium text-slate-900">{row.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{t('contact.hours')}</h2>
          <p className="mt-4 text-sm text-slate-700">{hours}</p>
          <div className="mt-6 space-y-3">
            <a
              href={`tel:${phone}`}
              className="flex w-full items-center justify-between rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <span>{t('contact.callNow')}</span>
              <span className="text-amber-400">{phone}</span>
            </a>
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-between rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              <span>{t('contact.whatsappUs')}</span>
              <span>{t('contact.sendMessage')}</span>
            </a>
          </div>
        </div>
      </section>

      {/* About Store */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{t('contact.aboutStore')}</h2>
        <p className="mt-4 text-sm text-slate-600">
          {siteName} {t('contact.aboutSuffix')}
        </p>
      </section>
    </div>
  );
}

export default Contact;
