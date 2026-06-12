import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

function fmtPrice(v) {
  return Number(v || 0).toLocaleString('en-RW');
}

function AdminSales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState([{ product_id: '', quantity: 1, unit_price: 0, name: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewSale, setViewSale] = useState(null);
  const token = localStorage.getItem('umuhoza_token');
  const headers = { Authorization: `Bearer ${token}` };

  const loadSales = () => {
    setLoading(true);
    API.get('/sales', { headers })
      .then((r) => setSales(Array.isArray(r.data) ? r.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSales();
    API.get('/products', { headers, params: { pageSize: 500 } })
      .then((r) => setProducts(r.data.data || []))
      .catch(console.error);
  }, []);

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

  const addItem = () =>
    setItems((prev) => [...prev, { product_id: '', quantity: 1, unit_price: 0, name: '' }]);

  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const updateItem = (i, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      if (field === 'product_id') {
        const prod = products.find((p) => String(p.id) === String(value));
        next[i].unit_price = prod ? Number(prod.selling_price) : 0;
        next[i].name = prod ? prod.name : '';
      }
      return next;
    });
  };

  const saleTotal = items.reduce(
    (sum, it) => sum + Number(it.unit_price || 0) * Number(it.quantity || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const validItems = items.filter((it) => it.product_id && Number(it.quantity) > 0);
    if (validItems.length === 0) return setError('Add at least one product with quantity > 0.');

    setSubmitting(true);
    try {
      const res = await API.post(
        '/sales',
        {
          items: validItems.map((it) => ({
            product_id: it.product_id,
            quantity: Number(it.quantity),
            unit_price: Number(it.unit_price),
          })),
          total_amount: saleTotal,
        },
        { headers }
      );
      setSuccess(`Sale recorded — Invoice: ${res.data.invoice_number}`);
      setItems([{ product_id: '', quantity: 1, unit_price: 0, name: '' }]);
      setShowForm(false);
      loadSales();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to record sale.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout currentPage="/admin/sales">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Sales</h2>
            <p className="mt-1 text-sm text-slate-500">Record and track all sales transactions.</p>
          </div>
          <button
            onClick={() => { setShowForm((p) => !p); setError(''); }}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
          >
            {showForm ? '✕ Cancel' : '+ Record New Sale'}
          </button>
        </div>

        {/* Toast */}
        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
            {success}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Revenue</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">{fmtPrice(totalRevenue)} RWF</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Transactions</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{sales.length}</p>
          </div>
        </div>

        {/* New Sale Form */}
        {showForm && (
          <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">New Sale</h3>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="space-y-3">
                {items.map((item, i) => {
                  const prod = products.find((p) => String(p.id) === String(item.product_id));
                  return (
                    <div key={i} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[2fr_1fr_1fr_auto]">
                      {/* Product select */}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Product</label>
                        <select
                          value={item.product_id}
                          onChange={(e) => updateItem(i, 'product_id', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          required
                        >
                          <option value="">Select product…</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — {fmtPrice(p.selling_price)} RWF (Stock: {p.stock_quantity})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          max={prod ? prod.stock_quantity : undefined}
                          value={item.quantity}
                          onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          required
                        />
                      </div>

                      {/* Subtotal */}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Subtotal</label>
                        <div className="flex h-[42px] items-center rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-700">
                          {fmtPrice(Number(item.unit_price) * Number(item.quantity))} RWF
                        </div>
                      </div>

                      {/* Remove */}
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          disabled={items.length === 1}
                          className="h-[42px] w-[42px] flex items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-30"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={addItem}
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                + Add another product
              </button>

              {/* Total */}
              <div className="flex items-center justify-end gap-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                <span className="text-sm font-medium text-slate-600">Grand Total</span>
                <span className="text-2xl font-bold text-slate-900">{fmtPrice(saleTotal)} RWF</span>
              </div>

              {error && (
                <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? 'Recording…' : 'Record Sale'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError(''); setItems([{ product_id: '', quantity: 1, unit_price: 0, name: '' }]); }}
                  className="rounded-xl border border-slate-200 px-8 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sales table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="font-semibold text-slate-900">Sales History</h3>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Invoice</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Sold By</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-400">
                        No sales recorded yet. Click "Record New Sale" to get started.
                      </td>
                    </tr>
                  ) : (
                    sales.map((sale) => (
                      <tr key={sale.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono text-sm font-semibold text-blue-600">{sale.invoice_number}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{fmtPrice(sale.total_amount)} RWF</td>
                        <td className="py-3 px-4 text-slate-600">{sale.sold_by_name || '—'}</td>
                        <td className="py-3 px-4 text-slate-500">{new Date(sale.sale_date).toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setViewSale(sale)}
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sale detail modal */}
        {viewSale && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setViewSale(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Sale Details</h3>
                  <p className="text-sm font-mono font-semibold text-blue-600">{viewSale.invoice_number}</p>
                </div>
                <button onClick={() => setViewSale(null)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">✕</button>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="flex justify-between"><span className="text-slate-500">Total Amount</span><span className="font-semibold">{fmtPrice(viewSale.total_amount)} RWF</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Sold By</span><span>{viewSale.sold_by_name || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Date</span><span>{new Date(viewSale.sale_date).toLocaleString('en-RW')}</span></div>
              </div>
              <button onClick={() => setViewSale(null)} className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800">Close</button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminSales;
