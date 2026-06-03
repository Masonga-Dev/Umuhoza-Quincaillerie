import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

function AdminDashboard() {
  const [dailyReport, setDailyReport] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('umuhoza_token');
    setLoading(true);
    API.get('/reports/daily', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => setDailyReport(response.data))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
    API.get('/reports/inventory', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => setInventory(response.data))
      .catch((error) => console.error(error));
  }, []);

  return (
    <AdminLayout currentPage="/admin/dashboard">
      <div className="space-y-8">
        <section>
          <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
          <p className="mt-2 text-slate-600">Monitor sales, inventory, and product performance.</p>
        </section>

        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center">
            <p className="text-slate-600">Loading dashboard data...</p>
          </div>
        ) : (
          <>
            <section className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-600 uppercase">Total Sales Today</h3>
                <p className="mt-4 text-4xl font-bold text-blue-600">{dailyReport?.summary?.total_sales ?? '0'} RWF</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-600 uppercase">Transactions</h3>
                <p className="mt-4 text-4xl font-bold text-green-600">{dailyReport?.summary?.total_transactions ?? '0'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-600 uppercase">Low Stock Items</h3>
                <p className="mt-4 text-4xl font-bold text-orange-600">{inventory.filter((i) => i.status === 'Low Stock').length}</p>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Best Selling Products</h3>
              <div className="mt-4 space-y-2">
                {dailyReport?.best_selling?.length ? (
                  dailyReport.best_selling.map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-slate-600">{item.quantity_sold} sold</div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">No sales data yet.</p>
                )}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Low Stock Items</h3>
              <div className="mt-4 space-y-2">
                {inventory.length ? (
                  inventory
                    .filter((i) => i.status === 'Low Stock' || i.status === 'Out of Stock')
                    .slice(0, 10)
                    .map((product) => (
                      <div key={product.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                        <div>
                          <div className="font-semibold text-slate-900">{product.name}</div>
                          <div className="text-sm text-slate-600">{product.status}</div>
                        </div>
                        <div className="font-semibold text-slate-900">{product.stock_quantity} units</div>
                      </div>
                    ))
                ) : (
                  <p className="text-slate-500">All stock levels are good.</p>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
