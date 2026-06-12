import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import API from './api';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import Home from './pages/Home';
import Products from './pages/Products';
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
import ForgotPassword from './pages/ForgotPassword';

const LANGS = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'rw', label: 'RW', flag: '🇷🇼' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
];

function ProtectedRoute({ element }) {
  const token = localStorage.getItem('umuhoza_token');
  return token ? element : <Navigate to="/admin" replace />;
}

function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-slate-200 bg-slate-100 p-0.5">
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          title={l.label}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
            lang === l.code
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'
          }`}
        >
          <span>{l.flag}</span>
          <span>{l.label}</span>
        </button>
      ))}
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
                <img src="/logo.png" alt="Umuhoza Quincaillerie" className="h-12 w-12 rounded-xl object-cover" />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
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
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute element={<AdminDashboard />} />} />
          <Route path="/admin/products/add" element={<ProtectedRoute element={<AdminAddProduct />} />} />
          <Route path="/admin/products/categories" element={<ProtectedRoute element={<AdminCategories />} />} />
          <Route path="/admin/products/:id/edit" element={<ProtectedRoute element={<AdminEditProduct />} />} />
          <Route path="/admin/products/:id/view" element={<ProtectedRoute element={<AdminProductDetails />} />} />
          <Route path="/admin/products" element={<ProtectedRoute element={<AdminProducts />} />} />
          <Route path="/admin/stock" element={<ProtectedRoute element={<AdminStock />} />} />
          <Route path="/admin/sales" element={<ProtectedRoute element={<AdminSales />} />} />
          <Route path="/admin/reports" element={<ProtectedRoute element={<AdminReports />} />} />
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
                <img src="/logo.png" alt="Umuhoza Quincaillerie" className="h-12 w-12 rounded-xl object-cover" />
                <div>
                  <p className="font-semibold text-white">{companyName}</p>
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
