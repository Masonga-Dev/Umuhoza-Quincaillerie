import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import API from './api';
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
import ForgotPassword from './pages/ForgotPassword';

const navClass = ({ isActive }) =>
  isActive ? 'text-blue-600 font-semibold' : 'text-slate-700 hover:text-blue-600';

// Protected Route Component
function ProtectedRoute({ element }) {
  const token = localStorage.getItem('umuhoza_token');
  return token ? element : <Navigate to="/admin" replace />;
}

function AppContent() {
  const location = useLocation();
  const hidePublicNav = location.pathname.startsWith('/admin');
  const [settings, setSettings] = useState({});
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (hidePublicNav) return;

    API.get('/public/homepage')
      .then((response) => {
        setSettings(response.data.settings || {});
      })
      .catch((error) => console.error('Failed to load public settings:', error));

    API.get('/categories')
      .then((response) => setCategories(response.data || []))
      .catch((error) => console.error('Failed to load categories:', error));
  }, [hidePublicNav]);

  const companyName = settings.siteName || 'Umuhoza Quincaillerie';
  const phone = settings.sitePhone || '+250 788 123 456';
  const email = settings.siteEmail || 'info@umuhoza.com';
  const address = settings.siteAddress || 'Kigali, Rwanda';
  const businessHours = settings.businessHours || 'Mon - Sat · 7:30 AM - 6:00 PM';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {!hidePublicNav && (
        <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white">UQ</div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{companyName}</p>
                  <p className="text-xs text-slate-400">{businessHours}</p>
                </div>
              </div>
              <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-700">
                <NavLink to="/" className={navClass} end>
                  Home
                </NavLink>
                <NavLink to="/products" className={navClass}>
                  Products
                </NavLink>
                <NavLink to="/gallery" className={navClass}>
                  Gallery
                </NavLink>
                <NavLink to="/about" className={navClass}>
                  About
                </NavLink>
                <NavLink to="/contact" className={navClass}>
                  Contact
                </NavLink>
              </nav>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
                <span className="font-semibold text-slate-900">{phone}</span>
                <span>{businessHours}</span>
              </div>
              <NavLink to="/admin" className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-slate-700 transition hover:bg-slate-100">
                Admin
              </NavLink>
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
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 font-black">UQ</div>
                <div>
                  <p className="font-semibold text-white">{companyName}</p>
                  <p className="text-sm text-slate-400">Your trusted partner for hardware and construction supplies.</p>
                </div>
              </div>
              <p className="text-sm text-slate-400">{address}</p>
              <p className="text-sm text-slate-400">{phone}</p>
              <p className="text-sm text-slate-400">{email}</p>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-400">Quick Links</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-400">
                <li><NavLink to="/">Home</NavLink></li>
                <li><NavLink to="/products">Products</NavLink></li>
                <li><NavLink to="/gallery">Gallery</NavLink></li>
                <li><NavLink to="/contact">Contact</NavLink></li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-400">Categories</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-400">
                {categories.slice(0, 6).map((category) => (
                  <li key={category.id}>{category.name}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-400">Contact Info</p>
              <div className="mt-6 space-y-3 text-sm text-slate-400">
                <div>{address}</div>
                <div>{phone}</div>
                <div>{email}</div>
                <div>{businessHours}</div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 px-4 py-5 text-center text-sm text-slate-500 sm:px-6">
            © {new Date().getFullYear()} {companyName}. All Rights Reserved.
          </div>
        </footer>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
