import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const icons = {
  dashboard: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  products: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  stock: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  sales: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  reports: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  content: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  settings: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  suppliers: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  purchases: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="1" y="3" width="15" height="13" rx="1.5"/>
      <path d="M16 8h4l3 3v5h-7V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  chevronDown: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  logout: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

const menuItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
  {
    label: 'Products',
    icon: 'products',
    subItems: [
      { label: 'All Products', path: '/admin/products' },
      { label: 'Add Product', path: '/admin/products/add' },
      { label: 'Categories', path: '/admin/products/categories' },
    ],
  },
  { label: 'Stock', path: '/admin/stock', icon: 'stock' },
  { label: 'Sales', path: '/admin/sales', icon: 'sales' },
  { label: 'Suppliers', path: '/admin/suppliers', icon: 'suppliers' },
  { label: 'Purchases', path: '/admin/purchases', icon: 'purchases' },
  { label: 'Reports', path: '/admin/reports', icon: 'reports' },
  { label: 'Website Content', path: '/admin/content', icon: 'content' },
  { label: 'Settings', path: '/admin/settings', icon: 'settings' },
];

function AdminLayout({ children, currentPage }) {
  const navigate = useNavigate();
  const isOnProductsSection = currentPage?.startsWith('/admin/products');
  const [openMenu, setOpenMenu] = useState(isOnProductsSection ? 'Products' : null);

  const toggleMenu = (label) => setOpenMenu((prev) => (prev === label ? null : label));

  const isActive = (path) => currentPage === path;
  const isSubActive = (subItems) => subItems.some((s) => currentPage === s.path);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar */}
      <aside className="flex w-64 flex-shrink-0 flex-col bg-slate-950 text-white shadow-2xl">
        {/* Brand */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-4">
          <img src="/logo.png" alt="UQ" className="h-14 w-14 rounded-2xl object-cover flex-shrink-0 shadow-sm" />
          <div>
            <p className="text-sm font-bold text-white leading-tight">Umuhoza</p>
            <p className="text-xs text-slate-400">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            if (item.subItems) {
              const open = openMenu === item.label;
              const anySubActive = isSubActive(item.subItems);

              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      anySubActive
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={anySubActive ? 'text-blue-400' : ''}>{icons[item.icon]}</span>
                      <span>{item.label}</span>
                    </div>
                    <span
                      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''} ${anySubActive ? 'text-blue-400' : 'text-slate-500'}`}
                    >
                      {icons.chevronDown}
                    </span>
                  </button>

                  {open && (
                    <div className="mt-1 ml-4 space-y-1 border-l border-slate-700 pl-3">
                      {item.subItems.map((sub) => (
                        <button
                          key={sub.path}
                          onClick={() => navigate(sub.path)}
                          className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-all ${
                            isActive(sub.path)
                              ? 'bg-blue-600 font-semibold text-white shadow-md shadow-blue-600/30'
                              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className={isActive(item.path) ? 'text-white' : ''}>{icons[item.icon]}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-slate-800 px-3 py-4">
          <button
            onClick={() => {
              localStorage.removeItem('umuhoza_token');
              navigate('/admin');
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-red-600/10 hover:text-red-400"
          >
            {icons.logout}
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Admin Dashboard</p>
            <p className="text-lg font-bold text-slate-900">Umuhoza Quincaillerie</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow">
              A
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}

export default AdminLayout;
