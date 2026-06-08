import { useNavigate } from 'react-router-dom';

function AdminLayout({ children, currentPage }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('umuhoza_token');
    navigate('/admin');
  };

  const menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    {
      label: 'Products',
      icon: '📦',
      subItems: [
        { label: 'All Products', path: '/admin/products' },
        { label: 'Add Product', path: '/admin/products/add' },
        { label: 'Categories', path: '/admin/products/categories' },
      ],
    },
    { label: 'Stock', path: '/admin/stock', icon: '📈' },
    { label: 'Sales', path: '/admin/sales', icon: '💳' },
    { label: 'Reports', path: '/admin/reports', icon: '📋' },
    { label: 'Website Content', path: '/admin/content', icon: '🌐' },
    { label: 'Settings', path: '/admin/settings', icon: '⚙️' },
  ];

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white shadow-lg">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold">Umuhoza</h1>
          <p className="text-sm text-slate-400">Admin Panel</p>
        </div>

        <nav className="flex flex-col gap-2 p-4">
          {menuItems.map((item) => {
            if (item.subItems) {
              return (
                <div key={item.label} className="space-y-1">
                  <div className="px-4 py-3 text-slate-300">
                    <span className="text-lg">{item.icon}</span> {item.label}
                  </div>
                  <div className="space-y-1 px-2">
                    {item.subItems.map((sub) => (
                      <button
                        key={sub.path}
                        onClick={() => navigate(sub.path)}
                        className={`w-full text-left rounded-lg px-4 py-3 transition ${
                          currentPage === sub.path
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full text-left px-4 py-3 rounded-lg transition ${
                  currentPage === item.path
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="text-lg">{item.icon}</span> {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 w-64 border-t border-slate-700 p-4">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

export default AdminLayout;
