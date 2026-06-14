import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

const HEADERS = () => ({ Authorization: `Bearer ${localStorage.getItem('umuhoza_token')}` });
const fmt = (v) => Number(v || 0).toLocaleString('en-RW');
const fmtDate = (d) => new Date(d).toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDateTime = (d) => new Date(d).toLocaleString('en-RW', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// ── Receipt printer ──────────────────────────────────────────────────────────
function printReceipt(sale) {
  const rows = (sale.items || []).map(it => {
    const variant = [it.variant_color, it.variant_size].filter(Boolean).join(' / ');
    return `<tr>
      <td style="padding:6px 8px;border-bottom:1px solid #eee">${it.product_name}${variant ? `<br><small style="color:#777">${variant}</small>` : ''}</td>
      <td style="padding:6px 8px;text-align:center;border-bottom:1px solid #eee">${it.quantity}</td>
      <td style="padding:6px 8px;text-align:right;border-bottom:1px solid #eee">${fmt(it.unit_price)}</td>
      <td style="padding:6px 8px;text-align:right;font-weight:700;border-bottom:1px solid #eee">${fmt(it.subtotal)}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Receipt ${sale.invoice_number}</title>
  <style>
    body{font-family:'Courier New',monospace;max-width:420px;margin:24px auto;font-size:13px;color:#111}
    h1{font-size:18px;margin:0;letter-spacing:.05em}
    .hr{border:none;border-top:1px dashed #bbb;margin:10px 0}
    table{width:100%;border-collapse:collapse}
    th{padding:6px 8px;font-size:11px;text-transform:uppercase;letter-spacing:.04em;background:#f7f7f7;text-align:left}
    th:not(:first-child){text-align:right}th:nth-child(2){text-align:center}
    @media print{.no-print{display:none}}
  </style></head>
  <body>
    <div style="text-align:center;padding-bottom:12px">
      <h1>UMUHOZA QUINCAILLERIE</h1>
      <p style="margin:3px 0;font-size:11px;color:#555">Kigali, Rwanda &nbsp;|&nbsp; +250 788 123 456</p>
      <p style="margin:3px 0;font-size:11px;color:#555">umuhozacompanyltd@gmail.com</p>
    </div>
    <hr class="hr">
    <table style="font-size:12px;margin-bottom:4px">
      <tr><td style="padding:2px 0"><strong>Invoice:</strong></td><td style="padding:2px 0;text-align:right">${sale.invoice_number}</td></tr>
      <tr><td style="padding:2px 0"><strong>Date:</strong></td><td style="padding:2px 0;text-align:right">${fmtDateTime(sale.sale_date)}</td></tr>
      <tr><td style="padding:2px 0"><strong>Served by:</strong></td><td style="padding:2px 0;text-align:right">${sale.sold_by_name || 'Staff'}</td></tr>
    </table>
    <hr class="hr">
    <table>
      <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <hr class="hr">
    <div style="text-align:right;font-size:16px;font-weight:700;padding:6px 8px">TOTAL: ${fmt(sale.total_amount)} RWF</div>
    <hr class="hr">
    <p style="text-align:center;font-size:11px;color:#777;margin-top:14px">Thank you for your business!<br>Please come again.</p>
    <div class="no-print" style="text-align:center;margin-top:16px">
      <button onclick="window.print()" style="padding:8px 24px;background:#1e40af;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px">Print</button>
    </div>
    <script>setTimeout(()=>window.print(),400)</script>
  </body></html>`;

  const w = window.open('', '_blank', 'width=520,height=720');
  w.document.write(html);
  w.document.close();
}

// ── Sale Detail Modal ────────────────────────────────────────────────────────
function SaleDetailModal({ saleId, onClose }) {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/sales/${saleId}`, { headers: HEADERS() })
      .then(r => setSale(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [saleId]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"/>
          </div>
        ) : !sale ? (
          <div className="flex h-40 items-center justify-center text-slate-400">Failed to load sale.</div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <span className="font-mono text-xl font-bold text-blue-600">{sale.invoice_number}</span>
                <p className="mt-1 text-sm text-slate-500">{fmtDateTime(sale.sale_date)}</p>
                <p className="text-sm text-slate-500">Served by: <span className="font-semibold text-slate-700">{sale.sold_by_name || 'Staff'}</span></p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => printReceipt(sale)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                    <rect x="6" y="14" width="12" height="8"/>
                  </svg>
                  Print Receipt
                </button>
                <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-lg">✕</button>
              </div>
            </div>

            {/* Items table */}
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Product</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Unit Price</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(sale.items || []).map((item, i) => {
                    const variant = [item.variant_color, item.variant_size].filter(Boolean).join(' / ');
                    return (
                      <tr key={i}>
                        <td className="px-6 py-3.5">
                          <p className="font-medium text-slate-800">{item.product_name}</p>
                          {variant && <p className="text-xs text-slate-400 mt-0.5">{variant}</p>}
                          {(item.variant_sku || item.product_sku) && (
                            <p className="font-mono text-xs text-slate-400 mt-0.5">SKU: {item.variant_sku || item.product_sku}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-slate-800">{item.quantity}</td>
                        <td className="px-4 py-3.5 text-right text-slate-600">{fmt(item.unit_price)} RWF</td>
                        <td className="px-6 py-3.5 text-right font-bold text-slate-900">{fmt(item.subtotal)} RWF</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
              <span className="text-sm text-slate-500">{sale.items?.length || 0} line item{sale.items?.length !== 1 ? 's' : ''}</span>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Amount</p>
                <p className="text-2xl font-extrabold text-slate-900">{fmt(sale.total_amount)} <span className="text-base font-semibold text-slate-400">RWF</span></p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── New Sale Form ────────────────────────────────────────────────────────────
function NewSaleForm({ products, onSuccess, onClose }) {
  const [items, setItems] = useState([{ product_id: '', variant_id: '', quantity: 1, unit_price: 0 }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const getProduct = (id) => products.find(p => String(p.id) === String(id));
  const getVariants = (id) => getProduct(id)?.variants || [];
  const getStock = (item) => {
    const p = getProduct(item.product_id);
    if (!p) return 0;
    if (item.variant_id) return p.variants?.find(v => String(v.id) === String(item.variant_id))?.stock_quantity ?? 0;
    return p.stock_quantity ?? 0;
  };

  const updateItem = (i, field, value) => {
    setItems(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      if (field === 'product_id') {
        const p = getProduct(value);
        next[i].variant_id = '';
        next[i].unit_price = p ? Number(p.selling_price || 0) : 0;
      }
      if (field === 'variant_id' && value) {
        const v = getProduct(next[i].product_id)?.variants?.find(x => String(x.id) === String(value));
        if (v) next[i].unit_price = Number(v.selling_price);
      }
      return next;
    });
  };

  const addItem = () => setItems(p => [...p, { product_id: '', variant_id: '', quantity: 1, unit_price: 0 }]);
  const removeItem = (i) => setItems(p => p.filter((_, idx) => idx !== i));

  const total = items.reduce((s, it) => s + Number(it.unit_price || 0) * Number(it.quantity || 0), 0);
  const validItems = items.filter(it => it.product_id && Number(it.quantity) > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validItems.length) return setError('Add at least one product with quantity > 0.');
    const over = validItems.find(it => Number(it.quantity) > getStock(it));
    if (over) return setError('One or more items exceed available stock.');
    setSubmitting(true);
    try {
      const res = await API.post('/sales', {
        items: validItems.map(it => ({
          product_id: Number(it.product_id),
          variant_id: it.variant_id ? Number(it.variant_id) : undefined,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
        })),
        total_amount: total,
      }, { headers: HEADERS() });
      onSuccess(res.data.invoice_number);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to record sale.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Record New Sale</h3>
            <p className="text-xs text-slate-400 mt-0.5">Add products and quantities to record a transaction</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-lg">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {items.map((item, i) => {
            const variants = getVariants(item.product_id);
            const maxQty = getStock(item);
            const subtotal = Number(item.unit_price || 0) * Number(item.quantity || 0);
            const overStock = item.product_id && Number(item.quantity) > maxQty && maxQty >= 0;

            return (
              <div key={i} className={`rounded-2xl border p-4 transition ${overStock ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Item {i + 1}</span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-xs font-semibold text-red-500 hover:text-red-700">× Remove</button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Product select */}
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Product *</label>
                    <select value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)} required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                      <option value="">Choose a product…</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.variants?.length ? `(${p.variants.length} variants)` : `— Stock: ${p.stock_quantity}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Variant (when applicable) */}
                  {variants.length > 0 && (
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Variant *</label>
                      <select value={item.variant_id} onChange={e => updateItem(i, 'variant_id', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                        <option value="">Select variant…</option>
                        {variants.map(v => (
                          <option key={v.id} value={v.id}>
                            {[v.color, v.size].filter(Boolean).join(' / ') || v.sku || `Variant ${v.id}`}
                            {' — '}{fmt(v.selling_price)} RWF · Stock: {v.stock_quantity}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Quantity {item.product_id && <span className="font-normal text-slate-400">(available: {maxQty})</span>}
                    </label>
                    <input type="number" min="1" max={maxQty || undefined} value={item.quantity}
                      onChange={e => updateItem(i, 'quantity', e.target.value)} required
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 ${overStock ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 bg-white focus:border-blue-400 focus:ring-blue-100'}`}/>
                    {overStock && <p className="mt-1 text-xs font-medium text-red-600">Exceeds available stock ({maxQty})</p>}
                  </div>

                  {/* Unit price */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Unit Price (RWF)</label>
                    <input type="number" min="0" step="any" value={item.unit_price}
                      onChange={e => updateItem(i, 'unit_price', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>
                  </div>
                </div>

                {subtotal > 0 && (
                  <p className="mt-3 text-right text-sm font-bold text-slate-700">
                    Subtotal: <span className="text-blue-600">{fmt(subtotal)} RWF</span>
                  </p>
                )}
              </div>
            );
          })}

          <button type="button" onClick={addItem}
            className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-base font-bold">+</span>
            Add another item
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex-shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">{validItems.length} item{validItems.length !== 1 ? 's' : ''}</span>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Grand Total</p>
              <p className="text-2xl font-extrabold text-slate-900">{fmt(total)} <span className="text-base font-semibold text-slate-400">RWF</span></p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
          )}

          <div className="flex gap-3">
            <button onClick={handleSubmit} disabled={submitting || !validItems.length}
              className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Recording sale…' : `Confirm Sale — ${fmt(total)} RWF`}
            </button>
            <button type="button" onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AdminSales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadSales = useCallback(() => {
    setLoading(true);
    API.get('/sales', { headers: HEADERS(), params: search ? { q: search } : {} })
      .then(r => setSales(Array.isArray(r.data) ? r.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { loadSales(); }, [loadSales]);

  useEffect(() => {
    API.get('/products', { headers: HEADERS(), params: { pageSize: 500 } })
      .then(r => {
        const prods = r.data.data || [];
        Promise.all(
          prods.map(p =>
            API.get(`/products/${p.id}/variants`, { headers: HEADERS() })
              .then(vr => ({ ...p, variants: vr.data || [] }))
              .catch(() => ({ ...p, variants: [] }))
          )
        ).then(setProducts);
      }).catch(console.error);
  }, []);

  // Client-side date range filter
  const filtered = sales.filter(s => {
    const d = new Date(s.sale_date);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  const today = new Date().toDateString();
  const todaySales = filtered.filter(s => new Date(s.sale_date).toDateString() === today);
  const todayRevenue = todaySales.reduce((s, x) => s + Number(x.total_amount || 0), 0);
  const totalRevenue = filtered.reduce((s, x) => s + Number(x.total_amount || 0), 0);

  const handleSuccess = (invoice) => {
    setShowForm(false);
    setSuccess(`Sale recorded successfully — Invoice: ${invoice}`);
    loadSales();
    setTimeout(() => setSuccess(''), 8000);
  };

  return (
    <AdminLayout currentPage="/admin/sales">
      <div className="space-y-6">

        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Sales</h2>
            <p className="mt-1 text-sm text-slate-500">Record transactions and track sales history.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
          >
            <span className="text-lg leading-none">+</span> Record New Sale
          </button>
        </div>

        {/* Success banner */}
        {success && (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {success}
            </div>
            <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-emerald-700 text-lg">✕</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Today's Revenue</p>
            <p className="mt-1.5 text-2xl font-extrabold text-blue-600">{fmt(todayRevenue)} <span className="text-sm font-semibold text-slate-400">RWF</span></p>
            <p className="mt-1 text-xs text-slate-400">{todaySales.length} transaction{todaySales.length !== 1 ? 's' : ''} today</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Revenue</p>
            <p className="mt-1.5 text-2xl font-extrabold text-emerald-600">{fmt(totalRevenue)} <span className="text-sm font-semibold text-slate-400">RWF</span></p>
            <p className="mt-1 text-xs text-slate-400">All time</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Transactions</p>
            <p className="mt-1.5 text-2xl font-extrabold text-violet-600">{filtered.length}</p>
            <p className="mt-1 text-xs text-slate-400">All time</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          {/* Search */}
          <div className="relative flex-1" style={{ minWidth: '200px' }}>
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search invoice or staff name…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          {/* Date from */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
          </div>
          {/* Date to */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
          </div>
          {(search || dateFrom || dateTo) && (
            <button onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Clear filters
            </button>
          )}
        </div>

        {/* Sales table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h3 className="font-semibold text-slate-900">Sales History</h3>
            {!loading && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {filtered.length} record{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"/>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-slate-400">
              <svg className="h-12 w-12 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <div className="text-center">
                <p className="text-sm font-semibold">No sales records found</p>
                <p className="text-xs mt-1">Record your first sale using the button above.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Invoice</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date & Time</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Served By</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(sale => (
                    <tr key={sale.id} className="group hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-bold text-blue-600">{sale.invoice_number}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        <span>{fmtDate(sale.sale_date)}</span>
                        <span className="ml-2 text-slate-400 text-xs">{new Date(sale.sale_date).toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-slate-900">{fmt(sale.total_amount)} <span className="text-xs font-normal text-slate-400">RWF</span></td>
                      <td className="px-5 py-4 text-sm text-slate-600">{sale.sold_by_name || '—'}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setViewId(sale.id)}
                          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-blue-600 hover:text-white"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Modals */}
      {showForm && <NewSaleForm products={products} onSuccess={handleSuccess} onClose={() => setShowForm(false)} />}
      {viewId && <SaleDetailModal saleId={viewId} onClose={() => setViewId(null)} />}
    </AdminLayout>
  );
}
