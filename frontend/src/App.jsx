import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {!hidePublicNav && (
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Umuhoza Quincaillerie</h1>
            </div>
            <nav className="flex gap-4 text-sm">
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
                About Us
              </NavLink>
              <NavLink to="/contact" className={navClass}>
                Contact
              </NavLink>
            </nav>
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
        <footer className="border-t bg-white py-6">
          <div className="mx-auto max-w-7xl px-4 text-sm text-slate-500 sm:px-6">
            © 2026 Umuhoza Quincaillerie. All Rights Reserved.
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
