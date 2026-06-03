import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

function AdminStock() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('umuhoza_token');
    setLoading(true);
    API.get('/reports/inventory', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => setInventory(response.data))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  const lowStockItems = inventory.filter((item) => item.status === 'Low Stock');
  const outOfStockItems = inventory.filter((item) => item.status === 'Out of Stock');

  return (
    <AdminLayout currentPage="/admin/stock">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Stock Management</h2>
          <p className="mt-2 text-slate-600">Monitor inventory levels</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-600 uppercase">Total Items</h3>
            <p className="mt-4 text-4xl font-bold text-blue-600">{inventory.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-600 uppercase">Low Stock</h3>
            <p className="mt-4 text-4xl font-bold text-orange-600">{lowStockItems.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-600 uppercase">Out of Stock</h3>
            <p className="mt-4 text-4xl font-bold text-red-600">{outOfStockItems.length}</p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-6">
            <p className="text-slate-600">Loading inventory...</p>
          </div>
        ) : (
          <>
            {lowStockItems.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-orange-700">⚠️ Low Stock Items</h3>
                <div className="mt-4 space-y-2">
                  {lowStockItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg bg-orange-50 p-3">
                      <div>
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-sm text-slate-600">Minimum: {item.minimum_stock || 5}</div>
                      </div>
                      <div className="font-bold text-orange-600">{item.stock_quantity} units</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {outOfStockItems.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-red-700">🚨 Out of Stock Items</h3>
                <div className="mt-4 space-y-2">
                  {outOfStockItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg bg-red-50 p-3">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Restock</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lowStockItems.length === 0 && outOfStockItems.length === 0 && (
              <div className="rounded-2xl bg-white p-6 text-center">
                <p className="text-slate-600">✓ All stock levels are healthy</p>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminStock;
