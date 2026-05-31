import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import Products from './pages/Products';
import Contact from './pages/Contact';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

const navClass = ({ isActive }) =>
  isActive ? 'text-blue-600 font-semibold' : 'text-slate-700 hover:text-blue-600';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Umuhoza Quincaillerie</h1>
              <p className="text-sm text-slate-500">Website, Inventory & Sales Management</p>
            </div>
            <nav className="flex gap-4 text-sm">
              <NavLink to="/" className={navClass} end>
                Home
              </NavLink>
              <NavLink to="/products" className={navClass}>
                Products
              </NavLink>
              <NavLink to="/contact" className={navClass}>
                Contact
              </NavLink>
              <NavLink to="/admin" className={navClass}>
                Admin
              </NavLink>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </main>

        <footer className="border-t bg-white py-6">
          <div className="mx-auto max-w-7xl px-4 text-sm text-slate-500 sm:px-6">
            © 2026 Umuhoza Quincaillerie. All Rights Reserved.
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
