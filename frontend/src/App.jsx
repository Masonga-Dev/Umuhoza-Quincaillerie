import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import API from './api';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Contact from './pages/Contact';
import About from './pages/About';
import Gallery from './pages/Gallery';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminStock from './pages/AdminStock';
import AdminSales from './pages/AdminSales';
import AdminReports from './pages/AdminReports';
import AdminContent from './pages/AdminContent';
import AdminSettings from './pages/AdminSettings';
import AdminAddProduct from './pages/AdminAddProduct';
import AdminEditProduct from './pages/AdminEditProduct';
import AdminProductDetails from './pages/AdminProductDetails';
import AdminCategories from './pages/AdminCategories';
import AdminSuppliers from './pages/AdminSuppliers';
import AdminPurchases from './pages/AdminPurchases';
import AdminSubcategories from './pages/AdminSubcategories';
import ForgotPassword from './pages/ForgotPassword';

const LANGS = [
  { code: 'en', label: 'English',     flag: 'https://flagcdn.com/w40/gb.png', short: 'EN' },
  { code: 'rw', label: 'Kinyarwanda', flag: 'https://flagcdn.com/w40/rw.png', short: 'RW' },
  { code: 'fr', label: 'Français',    flag: 'https://flagcdn.com/w40/fr.png', short: 'FR' },
];

function ProtectedRoute({ element }) {
  const token = localStorage.getItem('umuhoza_token');
  return token ? element : <Navigate to="/admin" replace />;
}

function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const current = LANGS.find((l) => l.code === lang) || LANGS[0];

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-500 hover:text-orange-500"
      >
        <img src={current.flag} alt={current.label} className="h-3.5 w-5 rounded-sm object-cover" />
        <span className="text-xs">{current.short}</span>
        <svg className={`h-3 w-3 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {LANGS.map((l) => (
            <button key={l.code} onClick={() => { setLang(l.code); setOpen(false); }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-orange-50 hover:text-orange-500 ${lang === l.code ? 'bg-orange-50 font-semibold text-orange-600' : 'text-slate-700'}`}>
              <img src={l.flag} alt={l.label} className="h-3.5 w-5 rounded-sm object-cover flex-shrink-0" />
              <span>{l.label}</span>
              {lang === l.code && <span className="ml-auto text-orange-500">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const hidePublicNav = location.pathname.startsWith('/admin');
  const [settings,   setSettings]   = useState({});
  const [categories, setCategories] = useState([]);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const { t } = useLanguage();

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (hidePublicNav) return;
    API.get('/public/homepage').then((r) => setSettings(r.data.settings || {})).catch(console.error);
    API.get('/categories').then((r) => setCategories(r.data || [])).catch(console.error);
  }, [hidePublicNav]);

  const companyName   = settings.siteName      || 'Umuhoza Quincaillerie';
  const phone         = settings.sitePhone     || '+250 788 123 456';
  const email         = settings.siteEmail     || 'info@umuhoza.com';
  const address       = settings.siteAddress   || 'Kigali, Rwanda';
  const businessHours = settings.businessHours || 'Mon - Sat · 7:30 AM - 6:00 PM';

  const navClass = ({ isActive }) =>
    isActive ? 'text-orange-500 font-semibold' : 'text-slate-700 hover:text-orange-500 transition';

  const mobileNavClass = ({ isActive }) =>
    `block rounded-xl px-4 py-2.5 text-sm font-medium transition ${isActive ? 'bg-orange-50 text-orange-500 font-semibold' : 'text-slate-700 hover:bg-orange-50 hover:text-orange-500'}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* ── Header ─────────────────────────────────────── */}
      {!hidePublicNav && (
        <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">

            {/* Single row — logo · desktop-nav · right-controls · hamburger */}
            <div className="flex h-16 items-center justify-between gap-3">

              {/* Logo */}
              <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
                <img src="/logo.png" alt="Umuhoza Quincaillerie" className="h-10 w-10 rounded-xl object-cover shadow-sm" />
                <div className="hidden sm:block leading-tight">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-800 whitespace-nowrap">{companyName}</p>
                  <p className="text-[10px] text-slate-400">{businessHours}</p>
                </div>
              </NavLink>

              {/* Desktop nav (hidden on mobile) */}
              <nav className="hidden lg:flex items-center gap-5 text-sm font-medium">
                <NavLink to="/"        className={navClass} end>{t('nav.home')}</NavLink>
                <NavLink to="/products" className={navClass}>{t('nav.products')}</NavLink>
                <NavLink to="/gallery"  className={navClass}>{t('nav.gallery')}</NavLink>
                <NavLink to="/about"    className={navClass}>{t('nav.about')}</NavLink>
                <NavLink to="/contact"  className={navClass}>{t('nav.contact')}</NavLink>
              </nav>

              {/* Desktop right (hidden on mobile) */}
              <div className="hidden lg:flex items-center gap-2">
                <a href={`tel:${phone}`} className="hidden xl:flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition">
                  <svg className="h-3.5 w-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  {phone}
                </a>
                <LanguageSwitcher />
                <NavLink to="/contact" className="rounded-full bg-[#1a2d5a] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-500 hover:shadow-orange-200 whitespace-nowrap">
                  Request a Quote
                </NavLink>
              </div>

              {/* Mobile right: lang + hamburger */}
              <div className="flex lg:hidden items-center gap-2">
                <LanguageSwitcher />
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                  aria-label="Toggle menu"
                >
                  {menuOpen ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile dropdown menu */}
            {menuOpen && (
              <div className="lg:hidden border-t border-slate-100 py-3">
                <nav className="flex flex-col gap-0.5">
                  <NavLink to="/"         className={mobileNavClass} end>{t('nav.home')}</NavLink>
                  <NavLink to="/products"  className={mobileNavClass}>{t('nav.products')}</NavLink>
                  <NavLink to="/gallery"   className={mobileNavClass}>{t('nav.gallery')}</NavLink>
                  <NavLink to="/about"     className={mobileNavClass}>{t('nav.about')}</NavLink>
                  <NavLink to="/contact"   className={mobileNavClass}>{t('nav.contact')}</NavLink>
                </nav>
                <div className="mt-3 border-t border-slate-100 pt-3 flex flex-col gap-2">
                  <NavLink to="/contact" className="block rounded-xl bg-[#1a2d5a] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-orange-500">
                    Request a Quote
                  </NavLink>
                  <a href={`tel:${phone}`} className="block rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                    {phone}
                  </a>
                </div>
              </div>
            )}
          </div>
        </header>
      )}

      <main className={hidePublicNav ? '' : 'mx-auto max-w-7xl px-4 py-8 sm:px-6'}>
        <Routes>
          <Route path="/"                          element={<Home />} />
          <Route path="/products"                  element={<Products />} />
          <Route path="/products/:id"              element={<ProductDetail />} />
          <Route path="/gallery"                   element={<Gallery />} />
          <Route path="/about"                     element={<About />} />
          <Route path="/contact"                   element={<Contact />} />
          <Route path="/admin"                     element={<AdminLogin />} />
          <Route path="/admin/login"               element={<AdminLogin />} />
          <Route path="/admin/forgot-password"     element={<ForgotPassword />} />
          <Route path="/admin/dashboard"           element={<ProtectedRoute element={<AdminDashboard />} />} />
          <Route path="/admin/products/add"        element={<ProtectedRoute element={<AdminAddProduct />} />} />
          <Route path="/admin/products/categories" element={<ProtectedRoute element={<AdminCategories />} />} />
          <Route path="/admin/products/subcategories" element={<ProtectedRoute element={<AdminSubcategories />} />} />
          <Route path="/admin/products/:id/edit"   element={<ProtectedRoute element={<AdminEditProduct />} />} />
          <Route path="/admin/products/:id/view"   element={<ProtectedRoute element={<AdminProductDetails />} />} />
          <Route path="/admin/products"            element={<ProtectedRoute element={<AdminProducts />} />} />
          <Route path="/admin/stock"               element={<ProtectedRoute element={<AdminStock />} />} />
          <Route path="/admin/sales"               element={<ProtectedRoute element={<AdminSales />} />} />
          <Route path="/admin/reports"             element={<ProtectedRoute element={<AdminReports />} />} />
          <Route path="/admin/suppliers"           element={<ProtectedRoute element={<AdminSuppliers />} />} />
          <Route path="/admin/purchases"           element={<ProtectedRoute element={<AdminPurchases />} />} />
          <Route path="/admin/content"             element={<ProtectedRoute element={<AdminContent />} />} />
          <Route path="/admin/settings"            element={<ProtectedRoute element={<AdminSettings />} />} />
        </Routes>
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      {!hidePublicNav && (
        <>
          {/* Animated wave separator */}
          <div style={{ lineHeight: 0, overflow: 'hidden', height: 70, position: 'relative' }}>
            <style>{`
              @keyframes footerWaveSlow { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
              @keyframes footerWaveFast { 0% { transform:translateX(-50%); } 100% { transform:translateX(0%); } }
            `}</style>
            <div style={{ position:'absolute', bottom:0, left:0, width:'200%', height:'100%', opacity:0.45, animation:'footerWaveSlow 9s linear infinite' }}>
              <svg viewBox="0 0 1440 70" preserveAspectRatio="none" style={{ width:'50%', height:'100%', display:'inline-block' }}>
                <path d="M0,35 C160,70 320,0 480,35 C640,70 800,0 960,35 C1120,70 1280,0 1440,35 L1440,70 L0,70 Z" fill="#020617" />
              </svg>
              <svg viewBox="0 0 1440 70" preserveAspectRatio="none" style={{ width:'50%', height:'100%', display:'inline-block' }}>
                <path d="M0,35 C160,70 320,0 480,35 C640,70 800,0 960,35 C1120,70 1280,0 1440,35 L1440,70 L0,70 Z" fill="#020617" />
              </svg>
            </div>
            <div style={{ position:'absolute', bottom:0, left:0, width:'200%', height:'100%', animation:'footerWaveFast 6s linear infinite' }}>
              <svg viewBox="0 0 1440 70" preserveAspectRatio="none" style={{ width:'50%', height:'100%', display:'inline-block' }}>
                <path d="M0,42 C200,8 400,62 600,24 C800,0 1000,55 1200,28 C1320,12 1380,38 1440,32 L1440,70 L0,70 Z" fill="#020617" />
              </svg>
              <svg viewBox="0 0 1440 70" preserveAspectRatio="none" style={{ width:'50%', height:'100%', display:'inline-block' }}>
                <path d="M0,42 C200,8 400,62 600,24 C800,0 1000,55 1200,28 C1320,12 1380,38 1440,32 L1440,70 L0,70 Z" fill="#020617" />
              </svg>
            </div>
          </div>

          <footer className="relative overflow-hidden bg-slate-950 text-slate-200">
            {/* Background watermark */}
            <div className="pointer-events-none select-none" style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:'1rem', opacity:0.06, zIndex:0 }}>
              <img src="/logo.png" alt="" style={{ height:'220px', width:'220px', objectFit:'contain' }} />
            </div>

            {/* Main grid */}
            <div style={{ position:'relative', zIndex:1 }} className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr] lg:gap-6 lg:py-6">

              {/* Brand */}
              <div className="sm:col-span-2 lg:col-span-1 flex items-center gap-3">
                <img src="/logo.png" alt="Umuhoza Quincaillerie" className="h-10 w-10 rounded-xl object-cover shadow-sm shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm leading-tight">{companyName}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{t('footer.tagline')}</p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">{businessHours}</p>
                </div>
                <img src="/logo.png" alt="" className="ml-auto h-10 w-10 object-contain shrink-0 lg:hidden" style={{ opacity:0.08, filter:'grayscale(1)' }} />
              </div>

              {/* Quick Links */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-orange-400">{t('footer.quickLinks')}</p>
                <ul className="mt-2.5 space-y-1.5 text-xs text-slate-400">
                  {[
                    { to: '/',         label: t('nav.home'),     end: true },
                    { to: '/products', label: t('nav.products') },
                    { to: '/gallery',  label: t('nav.gallery')  },
                    { to: '/about',    label: t('nav.about')    },
                    { to: '/contact',  label: t('nav.contact')  },
                  ].map(({ to, label, end }) => (
                    <li key={to}>
                      <NavLink to={to} end={end} className="transition hover:text-orange-400 line-clamp-1">
                        {label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Categories */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-orange-400">{t('footer.categories')}</p>
                <ul className="mt-2.5 space-y-1.5 text-xs text-slate-400">
                  {categories.slice(0, 5).map((cat) => (
                    <li key={cat.id}>
                      <NavLink to={`/products?category=${cat.id}`} className="transition hover:text-orange-400 line-clamp-1">{cat.name}</NavLink>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact Info */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-orange-400">{t('footer.contactInfo')}</p>
                <div className="mt-2.5 space-y-2 text-xs text-slate-400">
                  <a href="https://maps.app.goo.gl/E6aSqZ6aDYa39hH1A" target="_blank" rel="noreferrer" className="flex items-start gap-1.5 transition hover:text-orange-400">
                    <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span>{address}</span>
                  </a>
                  <a href={`tel:${phone}`} className="flex items-center gap-1.5 transition hover:text-orange-400">
                    <svg className="h-3.5 w-3.5 shrink-0 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    <span>{phone}</span>
                  </a>
                  <a href={`mailto:${email}`} className="flex items-center gap-1.5 transition hover:text-orange-400">
                    <svg className="h-3.5 w-3.5 shrink-0 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    <span className="break-all">{email}</span>
                  </a>
                  <div className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 shrink-0 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <span>{businessHours}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="border-t border-slate-800/50 px-4 py-2 text-center text-[11px] text-slate-500 sm:px-6" style={{ position:'relative', zIndex:1 }}>
              © {new Date().getFullYear()} {companyName}. {t('footer.rights')}
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
