import { useEffect, useState } from 'react';
import API from '../api';
import { useLanguage } from '../i18n/LanguageContext';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const imgUrl = p => !p ? '' : p.startsWith('http') ? p : `${BACKEND}/${p}`;

const WhatsAppIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const PhoneIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
  </svg>
);

function Contact() {
  const [s, setS]       = useState({});
  const [hero, setHero] = useState(null);
  const { t, lang }     = useLanguage();

  /* form state */
  const [form, setForm]     = useState({ name: '', email: '', phone: '', message: '' });
  const [sent, setSent]     = useState(false);

  useEffect(() => {
    API.get('/public/settings').then(r => setS(r.data || {})).catch(console.error);
    API.get('/public/hero/contact').then(r => setHero(r.data)).catch(() => {});
  }, []);

  const localHeroText = (h, field) =>
    (lang === 'rw' && h?.[`${field}_rw`]) ? h[`${field}_rw`] :
    (lang === 'fr' && h?.[`${field}_fr`]) ? h[`${field}_fr`] :
    (h?.[`${field}_en`] || '');

  const phone    = s.sitePhone    || '+250 788 123 456';
  const email    = s.siteEmail    || 'info@umuhoza.com';
  const address  = s.siteAddress  || 'KG 33 Ave, Kigali, Rwanda';
  const whatsapp = s.whatsapp     || phone;
  const hours    = s.businessHours || 'Mon–Sat · 7:30 AM – 6:00 PM';
  const siteName = s.siteName     || 'Umuhoza Quincaillerie';

  const hasHero = hero?.is_active && (localHeroText(hero, 'title') || hero?.image_path);

  const field = (key) => ({
    value: form[key],
    onChange: e => setForm(f => ({ ...f, [key]: e.target.value })),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = encodeURIComponent(
      `*Contact Request — ${siteName}*\nName: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\nMessage: ${form.message}`
    );
    window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${text}`, '_blank');
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };

  const inputCls = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-slate-900 placeholder:text-gray-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20';

  return (
    <div>
      {/* ── Admin Hero Banner ─────────────────────────────────────────────────── */}
      {hasHero ? (
        <div className="-mx-4 sm:-mx-6 -mt-8 relative overflow-hidden" style={{ height: 380 }}>
          {hero.image_path ? (
            <img src={imgUrl(hero.image_path)} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0d1b3e] via-[#152855] to-[#1e3a8a]" />
          )}
          <div className="absolute inset-0 bg-[#0d1b3e]/55" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-gray-50 via-[#0a1628]/80 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 px-6 sm:px-12 pb-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Umuhoza Quincaillerie
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
        <section className="-mx-4 sm:-mx-6 -mt-8 overflow-hidden bg-[#1a2d5a] px-8 py-10 text-white">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">Get in Touch</p>
              <h1 className="mt-2 text-3xl font-extrabold">{t('contact.title')}</h1>
              <p className="mt-2 max-w-xl text-slate-300 text-sm">{t('contact.subtitle')} {siteName} {t('contact.subtitleEnd')}</p>
            </div>
            <a href={`tel:${phone}`} className="inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-amber-300">
              <PhoneIcon className="h-4 w-4" /> {t('contact.callNow')}
            </a>
          </div>
        </section>
      )}

      {/* ── Page Content ──────────────────────────────────────────────────────── */}
      <div className="mt-8 space-y-6">

        {/* Main two-column: form left / map right */}
        <section className="grid gap-6 lg:grid-cols-2 lg:items-start">

          {/* LEFT — Contact Form */}
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Send Us a Message</p>
              <h2 className="mt-1 text-xl font-extrabold text-slate-900">{t('contact.title') || 'Contact Us'}</h2>
              <p className="mt-1 text-sm text-gray-500">Fill the form and we'll respond via WhatsApp or email.</p>

              {sent && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  Message sent to WhatsApp!
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">Full Name *</label>
                    <input {...field('name')} required placeholder="Jean-Paul Niyonzima" className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">Email</label>
                    <input {...field('email')} type="email" placeholder="you@example.com" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Phone Number</label>
                  <input {...field('phone')} type="tel" placeholder="+250 7XX XXX XXX" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Message *</label>
                  <textarea {...field('message')} required rows={4} placeholder="Tell us what you need…" className={`${inputCls} resize-none`} />
                </div>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a2d5a] px-6 py-3.5 text-sm font-bold text-white shadow transition hover:bg-[#0f1f4a]"
                >
                  <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                  Send via WhatsApp
                </button>
                <a
                  href={`mailto:${email}?subject=Inquiry from ${form.name || 'Customer'}&body=${encodeURIComponent(`Name: ${form.name}\nPhone: ${form.phone}\n\n${form.message}`)}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  Or Send by Email
                </a>
              </form>
            </div>

            {/* Hours + CTAs */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1a2d5a] text-amber-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{t('contact.hours')}</p>
                  <p className="text-xs text-gray-500">{hours}</p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <a href={`tel:${phone}`} className="flex items-center gap-2 rounded-xl bg-[#1a2d5a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f1f4a]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-slate-900"><PhoneIcon className="h-3 w-3" /></span>
                  {t('contact.callNow')}
                </a>
                <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#20bd5a]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20"><WhatsAppIcon className="h-3 w-3" /></span>
                  {t('contact.whatsappUs')}
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT — Google Maps */}
          <div className="flex flex-col overflow-hidden rounded-3xl border border-gray-200 shadow-sm">

            {/* Map header bar */}
            <div className="flex flex-shrink-0 items-center gap-3 bg-[#1a2d5a] px-5 py-3.5">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-400 text-slate-900">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Our Location</p>
                <p className="truncate text-sm font-semibold text-white">{siteName}</p>
                <p className="truncate text-xs text-slate-300">{address}</p>
              </div>
            </div>

            {/* Embedded map — pinned to address from Settings */}
            <div className="relative w-full h-64 sm:h-80 lg:h-96">
              <iframe
                key={address}
                title={`${siteName} Location`}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(`${siteName}, ${address}`)}&output=embed&hl=en&z=17`}
                width="100%"
                height="100%"
                style={{ display: 'block', border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Info strip below map */}
            <div className="border-t border-gray-100 bg-white p-5 space-y-4">

              {/* Address + directions */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900">{address}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Kigali, Rwanda</p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <p className="text-xs text-slate-600">{hours}</p>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${siteName}, ${address}`)}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-[#1a2d5a] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#0f1f4a]">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                  </svg>
                  Get Directions
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${siteName}, ${address}`)}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                  Open in Maps
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Contact;
