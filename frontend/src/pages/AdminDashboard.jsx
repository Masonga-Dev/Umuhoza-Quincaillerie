import { useEffect, useState } from 'react';
import API from '../api';

function AdminDashboard() {
  const [dailyReport, setDailyReport] = useState(null);
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('umuhoza_token');
    if (!token) {
      return;
    }
    API.get('/reports/daily', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => setDailyReport(response.data))
      .catch((error) => console.error(error));
    API.get('/reports/inventory', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => setInventory(response.data))
      .catch((error) => console.error(error));
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Admin Dashboard</h2>
        <p className="mt-2 text-slate-600">Monitor sales, inventory, and product performance from this dashboard.</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Total Sales</h3>
          <p className="mt-4 text-3xl font-bold text-blue-600">{dailyReport?.summary?.total_sales ?? '—'} RWF</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Transactions Today</h3>
          <p className="mt-4 text-3xl font-bold text-slate-600">{dailyReport?.summary?.total_transactions ?? '—'}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Best Selling</h3>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            {dailyReport?.best_selling?.length ? (
              dailyReport.best_selling.map((item) => (
                <div key={item.name} className="rounded-2xl bg-slate-50 p-3">
                  <div className="font-semibold">{item.name}</div>
                  <div>{item.quantity_sold} sold</div>
                </div>
              ))
            ) : (
              <div className="text-slate-500">No sales data yet.</div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Inventory Status</h3>
        <div className="mt-4 space-y-3">
          {inventory.length ? (
            inventory.map((product) => (
              <div key={product.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900">{product.name}</div>
                    <div className="text-sm text-slate-600">{product.status}</div>
                  </div>
                  <div className="font-semibold text-slate-900">{product.stock_quantity}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-600">Inventory report is not available yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default AdminDashboard;
