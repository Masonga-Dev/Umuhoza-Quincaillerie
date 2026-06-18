import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
  { code: 'en', label: 'English', flag: 'https://flagcdn.com/w40/gb.png', short: 'EN' },
  { code: 'rw', label: 'Kinyarwanda', flag: 'https://flagcdn.com/w40/rw.png', short: 'RW' },
  { code: 'fr', label: 'Français', flag: 'https://flagcdn.com/w40/fr.png', short: 'FR' },
];

function ProtectedRoute({ element }) {
  const token = localStorage.getItem('umuhoza_token');
  return token ? element : <Navigate to="/admin" replace />;
}

function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = LANGS.find((l) => l.code === lang) || LANGS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-400 hover:shadow"
      >
        <img src={current.flag} alt={current.label} className="h-4 w-6 rounded-sm object-cover" />
        <span>{current.short}</span>
        <svg className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setOpen(false); }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition hover:bg-slate-50 ${
                  lang === l.code ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-700'
                }`}
              >
                <img src={l.flag} alt={l.label} className="h-4 w-6 rounded-sm object-cover flex-shrink-0" />
                <span>{l.label}</span>
                {lang === l.code && <span className="ml-auto text-blue-600">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const hidePublicNav = location.pathname.startsWith('/admin');
  const [settings, setSettings] = useState({});
  const [categories, setCategories] = useState([]);
  const { t } = useLanguage();

  useEffect(() => {
    if (hidePublicNav) return;
    API.get('/public/homepage')
      .then((r) => setSettings(r.data.settings || {}))
      .catch(console.error);
    API.get('/categories')
      .then((r) => setCategories(r.data || []))
      .catch(console.error);
  }, [hidePublicNav]);

  const companyName = settings.siteName || 'Umuhoza Quincaillerie';
  const phone = settings.sitePhone || '+250 788 123 456';
  const email = settings.siteEmail || 'info@umuhoza.com';
  const address = settings.siteAddress || 'Kigali, Rwanda';
  const businessHours = settings.businessHours || 'Mon - Sat · 7:30 AM - 6:00 PM';

  const navClass = ({ isActive }) =>
    isActive ? 'text-blue-600 font-semibold' : 'text-slate-700 hover:text-blue-600';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {!hidePublicNav && (
        <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:items-center lg:justify-between">
            {/* Logo + nav */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Umuhoza Quincaillerie" className="h-16 w-16 rounded-2xl object-cover shadow-sm" />
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-800">
                    {companyName}
                  </p>
                  <p className="text-xs text-slate-400">{businessHours}</p>
                </div>
              </div>
              <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
                <NavLink to="/" className={navClass} end>{t('nav.home')}</NavLink>
                <NavLink to="/products" className={navClass}>{t('nav.products')}</NavLink>
                <NavLink to="/gallery" className={navClass}>{t('nav.gallery')}</NavLink>
                <NavLink to="/about" className={navClass}>{t('nav.about')}</NavLink>
                <NavLink to="/contact" className={navClass}>{t('nav.contact')}</NavLink>
              </nav>
            </div>

            {/* Right side: phone pill + language switcher */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm">
                <span className="font-semibold text-slate-900">{phone}</span>
              </div>
              <LanguageSwitcher />
            </div>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute element={<AdminDashboard />} />} />
          <Route path="/admin/products/add" element={<ProtectedRoute element={<AdminAddProduct />} />} />
          <Route path="/admin/products/categories" element={<ProtectedRoute element={<AdminCategories />} />} />
          <Route path="/admin/products/subcategories" element={<ProtectedRoute element={<AdminSubcategories />} />} />
          <Route path="/admin/products/:id/edit" element={<ProtectedRoute element={<AdminEditProduct />} />} />
          <Route path="/admin/products/:id/view" element={<ProtectedRoute element={<AdminProductDetails />} />} />
          <Route path="/admin/products" element={<ProtectedRoute element={<AdminProducts />} />} />
          <Route path="/admin/stock" element={<ProtectedRoute element={<AdminStock />} />} />
          <Route path="/admin/sales" element={<ProtectedRoute element={<AdminSales />} />} />
          <Route path="/admin/reports" element={<ProtectedRoute element={<AdminReports />} />} />
          <Route path="/admin/suppliers" element={<ProtectedRoute element={<AdminSuppliers />} />} />
          <Route path="/admin/purchases" element={<ProtectedRoute element={<AdminPurchases />} />} />
          <Route path="/admin/content" element={<ProtectedRoute element={<AdminContent />} />} />
          <Route path="/admin/settings" element={<ProtectedRoute element={<AdminSettings />} />} />
        </Routes>
      </main>

      {!hidePublicNav && (
        <footer className="border-t border-slate-200 bg-slate-950 text-slate-200">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Umuhoza Quincaillerie" className="h-16 w-16 rounded-2xl object-cover shadow-sm" />
                <div>
                  <p className="font-bold text-white">{companyName}</p>
                  <p className="text-sm text-slate-400">{t('footer.tagline')}</p>
                </div>
              </div>
              <p className="text-sm text-slate-400">{address}</p>
              <p className="text-sm text-slate-400">{phone}</p>
              <p className="text-sm text-slate-400">{email}</p>
            </div>

            {/* Quick Links */}
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-400">
                {t('footer.quickLinks')}
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-400">
                <li><NavLink to="/" className="hover:text-white transition">{t('nav.home')}</NavLink></li>
                <li><NavLink to="/products" className="hover:text-white transition">{t('nav.products')}</NavLink></li>
                <li><NavLink to="/gallery" className="hover:text-white transition">{t('nav.gallery')}</NavLink></li>
                <li><NavLink to="/about" className="hover:text-white transition">{t('nav.about')}</NavLink></li>
                <li><NavLink to="/contact" className="hover:text-white transition">{t('nav.contact')}</NavLink></li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-400">
                {t('footer.categories')}
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-400">
                {categories.slice(0, 6).map((cat) => (
                  <li key={cat.id}>{cat.name}</li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-400">
                {t('footer.contactInfo')}
              </p>
              <div className="mt-6 space-y-3 text-sm text-slate-400">
                <div>{address}</div>
                <div>{phone}</div>
                <div>{email}</div>
                <div>{businessHours}</div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 px-4 py-5 text-center text-sm text-slate-500 sm:px-6">
            © {new Date().getFullYear()} {companyName}. {t('footer.rights')}
          </div>
        </footer>
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
