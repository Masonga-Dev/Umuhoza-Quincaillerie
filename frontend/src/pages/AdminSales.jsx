import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

function AdminSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('umuhoza_token');
    setLoading(true);
    API.get('/sales', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => setSales(Array.isArray(response.data) ? response.data : []))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  const totalSales = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

  return (
    <AdminLayout currentPage="/admin/sales">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Sales Records</h2>
          <p className="mt-2 text-slate-600">Track all transactions</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-600 uppercase">Total Sales</h3>
            <p className="mt-4 text-4xl font-bold text-blue-600">{totalSales.toLocaleString()} RWF</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-600 uppercase">Total Transactions</h3>
            <p className="mt-4 text-4xl font-bold text-green-600">{sales.length}</p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-6">
            <p className="text-slate-600">Loading sales data...</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="text-left py-2 px-2 font-semibold">Invoice</th>
                    <th className="text-left py-2 px-2 font-semibold">Amount</th>
                    <th className="text-left py-2 px-2 font-semibold">Sold By</th>
                    <th className="text-left py-2 px-2 font-semibold">Date</th>
                    <th className="text-left py-2 px-2 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.length > 0 ? (
                    sales.map((sale) => (
                      <tr key={sale.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-2 font-mono">{sale.invoice_number}</td>
                        <td className="py-3 px-2 font-semibold">{sale.total_amount} RWF</td>
                        <td className="py-3 px-2 text-slate-600">{sale.sold_by_name || '—'}</td>
                        <td className="py-3 px-2 text-slate-600">
                          {new Date(sale.sale_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500">
                        No sales records yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminSales;
