import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountDropdown from './AccountDropdown';

const icons = {
  dashboard: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
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
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  sales: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  suppliers: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  purchases: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="1" y="3" width="15" height="13" rx="1.5"/><path d="M16 8h4l3 3v5h-7V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  reports: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  content: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  settings: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  chevronDown: (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
};

const menuItems = [
  { label: 'Dashboard',       path: '/admin/dashboard', icon: 'dashboard' },
  {
    label: 'Products', icon: 'products',
    subItems: [
      { label: 'All Products',  path: '/admin/products' },
      { label: 'Add Product',   path: '/admin/products/add' },
      { label: 'Categories',    path: '/admin/products/categories' },
      { label: 'Subcategories', path: '/admin/products/subcategories' },
    ],
  },
  { label: 'Stock',           path: '/admin/stock',      icon: 'stock' },
  { label: 'Sales',           path: '/admin/sales',      icon: 'sales' },
  { label: 'Suppliers',       path: '/admin/suppliers',  icon: 'suppliers' },
  { label: 'Purchases',       path: '/admin/purchases',  icon: 'purchases' },
  { label: 'Reports',         path: '/admin/reports',    icon: 'reports' },
  { label: 'Website Content', path: '/admin/content',    icon: 'content' },
  { label: 'Settings',        path: '/admin/settings',   icon: 'settings' },
];

export default function AdminLayout({ children, currentPage }) {
  const navigate = useNavigate();
  const isOnProductsSection = currentPage?.startsWith('/admin/products');
  const [openMenu, setOpenMenu]     = useState(isOnProductsSection ? 'Products' : null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMenu  = (label) => setOpenMenu((prev) => (prev === label ? null : label));
  const isActive    = (path)  => currentPage === path;
  const isSubActive = (subs)  => subs.some((s) => currentPage === s.path);

  const goTo = (path) => { navigate(path); setMobileOpen(false); };
  const signOut = () => { localStorage.removeItem('umuhoza_token'); navigate('/admin'); };

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <img
          src="/logo.png"
          alt="UQ"
          className="h-12 w-12 rounded-xl object-cover flex-shrink-0"
          style={{ boxShadow: '0 0 0 2.5px #f59e0b, 0 4px 14px rgba(0,0,0,0.5)' }}
        />
        <div className="min-w-0">
          <p className="text-base font-extrabold text-white leading-tight truncate tracking-wide">Umuhoza</p>
          <p className="text-[10px] text-amber-400/70 mt-0.5 font-semibold tracking-widest uppercase">Admin Panel</p>
        </div>
        {/* Mobile close button */}
        <button
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {menuItems.map((item) => {
          if (item.subItems) {
            const open         = openMenu === item.label;
            const anySubActive = isSubActive(item.subItems);
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150"
                  style={anySubActive
                    ? { background: 'rgba(245,158,11,0.13)', color: '#fbbf24' }
                    : { color: 'rgba(148,163,184,0.9)' }}
                  onMouseEnter={e => { if (!anySubActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#f1f5f9'; }}}
                  onMouseLeave={e => { if (!anySubActive) { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'rgba(148,163,184,0.9)'; }}}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ color: anySubActive ? '#fbbf24' : 'inherit' }}>{icons[item.icon]}</span>
                    <span>{item.label}</span>
                  </div>
                  <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    style={{ color: anySubActive ? '#f59e0b' : 'rgba(100,116,139,0.8)' }}>
                    {icons.chevronDown}
                  </span>
                </button>
                {open && (
                  <div className="mt-0.5 ml-4 space-y-0.5 border-l pl-3"
                    style={{ borderColor: 'rgba(245,158,11,0.25)' }}>
                    {item.subItems.map((sub) => (
                      <button
                        key={sub.path}
                        onClick={() => goTo(sub.path)}
                        className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition-all duration-150"
                        style={isActive(sub.path)
                          ? { background: 'rgba(245,158,11,0.18)', color: '#fbbf24', fontWeight: 600 }
                          : { color: 'rgba(148,163,184,0.8)' }}
                        onMouseEnter={e => { if (!isActive(sub.path)) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#e2e8f0'; }}}
                        onMouseLeave={e => { if (!isActive(sub.path)) { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'rgba(148,163,184,0.8)'; }}}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => goTo(item.path)}
              className="relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 overflow-hidden"
              style={active
                ? { background: 'rgba(245,158,11,0.14)', color: '#fbbf24' }
                : { color: 'rgba(148,163,184,0.9)' }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#f1f5f9'; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'rgba(148,163,184,0.9)'; }}}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full"
                  style={{ height: '60%', background: '#f59e0b' }}/>
              )}
              <span style={{ color: active ? '#fbbf24' : 'inherit' }}>{icons[item.icon]}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-4 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={signOut}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition-all duration-150"
          style={{ color: '#f87171' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = ''; }}
        >
          <svg style={{ width: 14, height: 14, flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-300 ease-in-out lg:relative lg:z-auto lg:translate-x-0 lg:flex-shrink-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          background: 'linear-gradient(180deg, #0d1b3e 0%, #0a1628 55%, #071020 100%)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.35)',
        }}
      >
        <SidebarContent />
      </aside>

      {/* ── Main ── */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6 sm:py-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger — mobile only */}
            <button
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <div className="min-w-0">
              <p className="hidden text-xs font-semibold uppercase tracking-widest text-slate-400 sm:block">Admin Dashboard</p>
              <p className="truncate text-sm font-bold text-slate-900 sm:text-lg">Umuhoza Quincaillerie</p>
            </div>
          </div>
          <AccountDropdown onSignOut={signOut} />
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
