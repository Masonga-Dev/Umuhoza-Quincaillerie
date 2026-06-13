import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

function fmtPrice(v) { return Number(v || 0).toLocaleString('en-RW'); }

export default function AdminSales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState([{ product_id: '', variant_id: '', quantity: 1, unit_price: 0 }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewSale, setViewSale] = useState(null);
  const token = localStorage.getItem('umuhoza_token');
  const headers = { Authorization: `Bearer ${token}` };

  const loadSales = () => {
    setLoading(true);
    API.get('/sales', { headers }).then(r => setSales(Array.isArray(r.data) ? r.data : [])).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSales();
    API.get('/products', { headers, params: { pageSize: 500 } })
      .then(r => {
        const prods = r.data.data || [];
        // Also load variants for each product
        Promise.all(prods.map(p =>
          API.get(`/products/${p.id}/variants`, { headers })
            .then(vr => ({ ...p, variants: vr.data || [] }))
            .catch(() => ({ ...p, variants: [] }))
        )).then(setProducts);
      })
      .catch(console.error);
  }, []);

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

  const updateItem = (i, field, value) => {
    setItems(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      if (field === 'product_id') {
        const prod = products.find(p => String(p.id) === String(value));
        next[i].variant_id = '';
        next[i].unit_price = prod ? Number(prod.selling_price) : 0;
      }
      if (field === 'variant_id' && value) {
        const prod = products.find(p => String(p.id) === String(next[i].product_id));
        const variant = prod?.variants?.find(v => String(v.id) === String(value));
        if (variant) next[i].unit_price = Number(variant.selling_price);
      }
      return next;
    });
  };

  const getItemProduct = (item) => products.find(p => String(p.id) === String(item.product_id));
  const getItemVariants = (item) => getItemProduct(item)?.variants || [];
  const getEffectiveStock = (item) => {
    const prod = getItemProduct(item);
    if (!prod) return 0;
    if (item.variant_id) {
      const v = prod.variants?.find(v => String(v.id) === String(item.variant_id));
      return v?.stock_quantity ?? 0;
    }
    return prod.stock_quantity ?? 0;
  };

  const saleTotal = items.reduce((sum, it) => sum + Number(it.unit_price || 0) * Number(it.quantity || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const validItems = items.filter(it => it.product_id && Number(it.quantity) > 0);
    if (!validItems.length) return setError('Add at least one product with quantity > 0.');
    setSubmitting(true);
    try {
      const res = await API.post('/sales', {
        items: validItems.map(it => ({
          product_id: Number(it.product_id),
          variant_id: it.variant_id ? Number(it.variant_id) : undefined,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
        })),
        total_amount: saleTotal,
      }, { headers });
      setSuccess(`Sale recorded — Invoice: ${res.data.invoice_number}`);
      setItems([{ product_id: '', variant_id: '', quantity: 1, unit_price: 0 }]);
      setShowForm(false);
      loadSales();
      setTimeout(() => setSuccess(''), 6000);
    } catch (e) { setError(e?.response?.data?.message || 'Failed to record sale.'); }
    finally { setSubmitting(false); }
  };

  return (
    <AdminLayout currentPage="/admin/sales">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Sales</h2>
            <p className="mt-1 text-sm text-slate-500">Record and track all sales transactions.</p>
          </div>
          <button onClick={() => { setShowForm(p => !p); setError(''); }}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700">
            {showForm ? '✕ Cancel' : '+ Record New Sale'}
          </button>
        </div>

        {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">{success}</div>}

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

        {/* Sale form */}
        {showForm && (
          <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-5">New Sale</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {items.map((item, i) => {
                const variants = getItemVariants(item);
                const hasVariants = variants.length > 0;
                const maxQty = getEffectiveStock(item);
                return (
                  <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-[2fr_2fr_1fr_1fr_auto]">
                      {/* Product */}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Product</label>
                        <select value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400" required>
                          <option value="">Select product…</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity})</option>
                          ))}
                        </select>
                      </div>

                      {/* Variant */}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                          Variant {!hasVariants && item.product_id ? <span className="text-slate-300">(none)</span> : ''}
                        </label>
                        <select value={item.variant_id} onChange={e => updateItem(i, 'variant_id', e.target.value)}
                          disabled={!hasVariants}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 disabled:opacity-40">
                          <option value="">— no variant —</option>
                          {variants.map(v => (
                            <option key={v.id} value={v.id}>
                              {[v.color, v.size].filter(Boolean).join(' / ') || v.sku || `Variant ${v.id}`} — {fmtPrice(v.selling_price)} RWF (Stock: {v.stock_quantity})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Qty */}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Qty (max {maxQty})</label>
                        <input type="number" min="1" max={maxQty || undefined} value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400" required />
                      </div>

                      {/* Subtotal */}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Subtotal</label>
                        <div className="flex h-[42px] items-center rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-700">
                          {fmtPrice(Number(item.unit_price) * Number(item.quantity))}
                        </div>
                      </div>

                      {/* Remove */}
                      <div className="flex items-end">
                        <button type="button" onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))}
                          disabled={items.length === 1}
                          className="h-[42px] w-[42px] flex items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-30">
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <button type="button" onClick={() => setItems(prev => [...prev, { product_id: '', variant_id: '', quantity: 1, unit_price: 0 }])}
                className="text-sm font-semibold text-blue-600 hover:underline">+ Add product</button>

              <div className="flex items-center justify-end gap-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                <span className="text-sm font-medium text-slate-600">Grand Total</span>
                <span className="text-2xl font-bold text-slate-900">{fmtPrice(saleTotal)} RWF</span>
              </div>

              {error && <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

              <div className="flex gap-3">
                <button type="submit" disabled={submitting}
                  className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-60">
                  {submitting ? 'Recording…' : 'Record Sale'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setError(''); setItems([{ product_id: '', variant_id: '', quantity: 1, unit_price: 0 }]); }}
                  className="rounded-xl border border-slate-200 px-8 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sales history */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="font-semibold text-slate-900">Sales History</h3>
          </div>
          {loading ? (
            <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"/></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>{['Invoice','Amount','Sold By','Date',''].map(h => <th key={h} className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {sales.length === 0 ? (
                    <tr><td colSpan="5" className="py-12 text-center text-slate-400">No sales recorded yet.</td></tr>
                  ) : sales.map(sale => (
                    <tr key={sale.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-semibold text-blue-600">{sale.invoice_number}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{fmtPrice(sale.total_amount)} RWF</td>
                      <td className="py-3 px-4 text-slate-600">{sale.sold_by_name || '—'}</td>
                      <td className="py-3 px-4 text-slate-500">{new Date(sale.sale_date).toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => setViewSale(sale)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail modal */}
        {viewSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewSale(null)}>
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Sale Details</h3>
                  <p className="font-mono font-semibold text-blue-600 text-sm">{viewSale.invoice_number}</p>
                </div>
                <button onClick={() => setViewSale(null)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">✕</button>
              </div>
              <div className="space-y-3 text-sm text-slate-700">
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
