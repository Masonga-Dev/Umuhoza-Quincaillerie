import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

function AdminReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('umuhoza_token');
    setLoading(true);
    API.get('/reports/daily', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => setReport(response.data))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout currentPage="/admin/reports">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Reports</h2>
          <p className="mt-2 text-slate-600">View daily and comprehensive reports</p>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-6">
            <p className="text-slate-600">Loading reports...</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-600 uppercase">Daily Revenue</h3>
                <p className="mt-4 text-4xl font-bold text-blue-600">
                  {report?.summary?.total_sales || '0'} RWF
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-600 uppercase">Transactions</h3>
                <p className="mt-4 text-4xl font-bold text-green-600">
                  {report?.summary?.total_transactions || '0'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-600 uppercase">Best Seller</h3>
                <p className="mt-4 text-2xl font-bold text-purple-600">
                  {report?.best_selling?.[0]?.name || 'N/A'}
                </p>
              </div>
            </div>

            {report?.best_selling?.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900">Top Selling Products</h3>
                <div className="mt-4 space-y-2">
                  {report.best_selling.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          #{idx + 1} {item.name}
                        </div>
                        <div className="text-sm text-slate-600">{item.quantity_sold} units sold</div>
                      </div>
                      <div className="text-right">
                        <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600"
                            style={{
                              width: `${Math.min(
                                (item.quantity_sold / (report.best_selling[0]?.quantity_sold || 1)) * 100,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminReports;
