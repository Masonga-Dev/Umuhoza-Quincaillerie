import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';
import { emitDataChanged, useDataRefresh } from '../utils/dataEvents';
import { exportToCSV } from '../utils/exportCSV';
import ExportDropdown, { getPeriodStart, getPeriodEnd, getPeriodLabel } from '../components/ExportDropdown';

const HEADERS = () => ({ Authorization: `Bearer ${localStorage.getItem('umuhoza_token')}` });
const fmt = v => Number(v || 0).toLocaleString('en-RW');
const fmtDate = d => new Date(d).toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDateTime = d => new Date(d).toLocaleString('en-RW', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function PurchaseReturnModal({ purchase, onClose, onSuccess }) {
  const [returnQtys, setReturnQtys] = useState(
    (purchase.items || []).map(() => 0)
  );
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const items = purchase.items || [];
  const totalCost = items.reduce((s, item, i) => s + returnQtys[i] * Number(item.unit_cost || 0), 0);
  const hasItems = returnQtys.some(q => q > 0);

  const handleSubmit = async () => {
    if (!hasItems) return setError('Set quantity > 0 for at least one item.');
    setError(''); setSubmitting(true);
    try {
      await API.post(`/purchases/${purchase.id}/return`, {
        notes: notes.trim() || null,
        items: items
          .map((item, i) => ({ ...item, quantity: returnQtys[i] }))
          .filter(item => item.quantity > 0)
          .map(item => ({
            product_id: item.product_id,
            product_variant_id: item.product_variant_id || null,
            quantity: item.quantity,
            unit_cost: Number(item.unit_cost || 0),
          })),
      }, { headers: HEADERS() });
      onSuccess();
    } catch (e) { setError(e?.response?.data?.message || 'Failed to record return.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-base font-bold text-slate-900">Return to Supplier</p>
            <p className="text-xs text-slate-400">Purchase #{purchase.id} — enter quantities to return</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 text-lg">✕</button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-4 space-y-3">
          {items.map((item, i) => {
            const variant = [item.variant_color, item.variant_size].filter(Boolean).join(' / ');
            const alreadyReturned = Number(item.returned_quantity || 0);
            const maxReturnable = item.quantity - alreadyReturned;
            return (
              <div key={i} className={`flex items-center gap-3 rounded-xl border p-3 ${maxReturnable <= 0 ? 'border-slate-100 bg-slate-50 opacity-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{item.product_name}</p>
                  {variant && <p className="text-xs text-slate-400">{variant}</p>}
                  <p className="text-xs text-slate-400">
                    Purchased: {item.quantity} × {fmt(item.unit_cost)} RWF
                    {alreadyReturned > 0 && <span className="ml-2 text-orange-500">· {alreadyReturned} already returned · {maxReturnable} remaining</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs text-slate-500">Return:</span>
                  <input
                    type="number" min="0" max={maxReturnable}
                    value={returnQtys[i]}
                    disabled={maxReturnable <= 0}
                    onChange={e => { const next = [...returnQtys]; next[i] = Math.min(Math.max(0, parseInt(e.target.value) || 0), maxReturnable); setReturnQtys(next); }}
                    className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-center font-bold outline-none focus:border-orange-400 disabled:opacity-50"
                  />
                  <span className="text-xs text-slate-400">/{maxReturnable}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-slate-200 p-4 space-y-3">
          <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Reason for return (optional)…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Value returned: <span className="font-bold text-slate-800">{fmt(totalCost)} RWF</span>
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting || !hasItems}
                className="rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition">
                {submitting ? 'Processing…' : 'Confirm Return — Stock Reduced'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PurchaseDetailModal({ purchaseId, onClose, onReturned }) {
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReturn, setShowReturn] = useState(false);
  const [returnBanner, setReturnBanner] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    API.get(`/purchases/${purchaseId}`, { headers: HEADERS() })
      .then(r => setPurchase(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [purchaseId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') { if (showReturn) setShowReturn(false); else onClose(); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, showReturn]);

  const handleReturnSuccess = () => {
    setShowReturn(false);
    load();
    onReturned?.();
    emitDataChanged();
    setReturnBanner('Return recorded. Stock has been reduced — check Stock Management to confirm.');
    setTimeout(() => setReturnBanner(''), 8000);
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        {loading ? (
          <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"/></div>
        ) : !purchase ? (
          <div className="flex h-40 items-center justify-center text-slate-400">Failed to load purchase.</div>
        ) : (
          <>
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-lg font-bold text-slate-900">Purchase #{purchase.id}</p>
                <p className="text-sm text-slate-500 mt-0.5">{fmtDateTime(purchase.purchase_date)}</p>
                {purchase.supplier_name && <p className="text-sm text-slate-500">Supplier: <span className="font-semibold text-slate-700">{purchase.supplier_name}</span></p>}
                {purchase.reference_number && <p className="text-sm text-slate-500">Ref: <span className="font-mono text-slate-700">{purchase.reference_number}</span></p>}
              </div>
              <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-lg">✕</button>
            </div>

            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Product</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Unit Cost</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(purchase.items || []).map((item, i) => {
                    const variant = [item.variant_color, item.variant_size].filter(Boolean).join(' / ');
                    const returned = Number(item.returned_quantity || 0);
                    const net = item.quantity - returned;
                    const netSubtotal = net * Number(item.unit_cost || 0);
                    return (
                      <tr key={i} className={returned > 0 ? 'bg-orange-50/40' : ''}>
                        <td className="px-6 py-3.5">
                          <p className="font-medium text-slate-800">{item.product_name}</p>
                          {variant && <p className="text-xs text-slate-400">{variant}</p>}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="font-bold text-slate-800">{item.quantity}</span>
                          {returned > 0 && (
                            <div className="text-xs text-orange-500 font-semibold">−{returned} returned</div>
                          )}
                          {returned > 0 && (
                            <div className="text-xs text-emerald-600 font-bold">= {net} net</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right text-slate-600">{fmt(item.unit_cost)} RWF</td>
                        <td className="px-6 py-3.5 text-right">
                          {returned > 0 ? (
                            <>
                              <p className="text-xs text-slate-400 line-through">{fmt(item.subtotal)} RWF</p>
                              <p className="font-bold text-slate-900">{fmt(netSubtotal)} RWF</p>
                            </>
                          ) : (
                            <p className="font-bold text-slate-900">{fmt(item.subtotal)} RWF</p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {returnBanner && (
              <div className="border-t border-emerald-100 bg-emerald-50 px-6 py-3 text-sm font-medium text-emerald-700">
                ✓ {returnBanner}
              </div>
            )}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button onClick={() => setShowReturn(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100 transition">
                ↩ Return to Supplier
              </button>
              <div className="text-right">
                {Number(purchase.total_returned_cost) > 0 ? (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Cost <span className="text-orange-400">(after returns)</span></p>
                    <p className="text-2xl font-extrabold text-slate-900">
                      {fmt(Number(purchase.total_cost) - Number(purchase.total_returned_cost))} <span className="text-base font-semibold text-slate-400">RWF</span>
                    </p>
                    <p className="text-xs text-slate-400">Original: {fmt(purchase.total_cost)} · Returned: <span className="text-orange-500">{fmt(purchase.total_returned_cost)}</span></p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Cost</p>
                    <p className="text-2xl font-extrabold text-slate-900">{fmt(purchase.total_cost)} <span className="text-base font-semibold text-slate-400">RWF</span></p>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    {showReturn && purchase && (
      <PurchaseReturnModal purchase={purchase} onClose={() => setShowReturn(false)} onSuccess={handleReturnSuccess} />
    )}
    </>
  );
}

function generateRef(count) {
  const year = new Date().getFullYear();
  const num = String(count + 1).padStart(3, '0');
  return `INV-UMU-${year}-${num}`;
}

function NewPurchaseForm({ products, suppliers, onSuccess, onClose, purchaseCount }) {
  const [items, setItems] = useState([{ product_id: '', product_variant_id: '', quantity: 1, unit_cost: 0 }]);
  const [supplierId, setSupplierId] = useState('');
  const [reference, setReference] = useState(() => generateRef(purchaseCount || 0));
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const getProduct = id => products.find(p => String(p.id) === String(id));
  const getVariants = id => getProduct(id)?.variants || [];

  const updateItem = (i, field, value) => {
    setItems(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      if (field === 'product_id') { next[i].product_variant_id = ''; next[i].unit_cost = Number(getProduct(value)?.cost_price || 0); }
      if (field === 'product_variant_id' && value) {
        const v = getProduct(next[i].product_id)?.variants?.find(x => String(x.id) === String(value));
        if (v) next[i].unit_cost = Number(v.cost_price || 0);
      }
      return next;
    });
  };

  const addItem = () => setItems(p => [...p, { product_id: '', product_variant_id: '', quantity: 1, unit_cost: 0 }]);
  const removeItem = i => setItems(p => p.filter((_, idx) => idx !== i));

  const total = items.reduce((s, it) => s + Number(it.unit_cost || 0) * Number(it.quantity || 0), 0);
  const validItems = items.filter(it => it.product_id && Number(it.quantity) > 0);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!validItems.length) return setError('Add at least one product with quantity > 0.');
    setSubmitting(true);
    try {
      await API.post('/purchases', {
        supplier_id: supplierId ? Number(supplierId) : null,
        reference_number: reference.trim() || null,
        purchase_date: purchaseDate,
        notes: notes.trim() || null,
        items: validItems.map(it => ({
          product_id: Number(it.product_id),
          product_variant_id: it.product_variant_id ? Number(it.product_variant_id) : null,
          quantity: Number(it.quantity),
          unit_cost: Number(it.unit_cost),
        })),
      }, { headers: HEADERS() });
      onSuccess();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to record purchase.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Record New Purchase</h3>
            <p className="text-xs text-slate-400 mt-0.5">Record incoming stock from a supplier</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-lg">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Purchase info */}
          <div className="grid gap-3 sm:grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Supplier</label>
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                <option value="">No supplier / walk-in</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Reference Number</label>
              <input value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. INV-2024-001"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Purchase Date</label>
              <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              {purchaseDate && (
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(purchaseDate + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Notes</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>

          {/* Items */}
          {items.map((item, i) => {
            const variants = getVariants(item.product_id);
            const subtotal = Number(item.unit_cost || 0) * Number(item.quantity || 0);
            return (
              <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Item {i + 1}</span>
                  {items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-xs font-semibold text-red-500 hover:text-red-700">× Remove</button>}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Product *</label>
                    <select value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)} required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                      <option value="">Choose a product…</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>)}
                    </select>
                  </div>
                  {variants.length > 0 && (
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Variant</label>
                      <select value={item.product_variant_id} onChange={e => updateItem(i, 'product_variant_id', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                        <option value="">No specific variant</option>
                        {variants.map(v => <option key={v.id} value={v.id}>{[v.color, v.size].filter(Boolean).join(' / ') || v.sku || `Variant ${v.id}`}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Quantity *</label>
                    <input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Unit Cost (RWF)</label>
                    <input type="number" min="0" step="any" value={item.unit_cost} onChange={e => updateItem(i, 'unit_cost', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                  </div>
                </div>
                {subtotal > 0 && <p className="mt-3 text-right text-sm font-bold text-slate-700">Subtotal: <span className="text-blue-600">{fmt(subtotal)} RWF</span></p>}
              </div>
            );
          })}

          <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-base font-bold">+</span>
            Add another item
          </button>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex-shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">{validItems.length} item{validItems.length !== 1 ? 's' : ''}</span>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Cost</p>
              <p className="text-2xl font-extrabold text-slate-900">{fmt(total)} <span className="text-base font-semibold text-slate-400">RWF</span></p>
            </div>
          </div>
          {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
          <div className="flex gap-3">
            <button onClick={handleSubmit} disabled={submitting || !validItems.length}
              className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Recording…' : `Confirm Purchase — ${fmt(total)} RWF`}
            </button>
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { refreshKey, bindRefresh } = useDataRefresh();

  const load = useCallback(() => {
    setLoading(true);
    API.get('/purchases', { headers: HEADERS() })
      .then(r => setPurchases(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);
  useEffect(bindRefresh, [bindRefresh]);

  useEffect(() => {
    API.get('/suppliers', { headers: HEADERS() }).then(r => setSuppliers(r.data || [])).catch(console.error);
    API.get('/products', { headers: HEADERS(), params: { pageSize: 500 } }).then(r => {
      const prods = r.data.data || [];
      Promise.all(prods.map(p =>
        API.get(`/products/${p.id}/variants`, { headers: HEADERS() })
          .then(vr => ({ ...p, variants: vr.data || [] }))
          .catch(() => ({ ...p, variants: [] }))
      )).then(setProducts);
    }).catch(console.error);
  }, []);

  const handleExport = async (period) => {
    try {
      const res = await API.get('/purchases/export', {
        headers: HEADERS(),
        params: period && period !== 'all' ? { period } : {},
      });
      const data = res.data || [];
      const rows = data.map(r => [
        r.purchase_id,
        r.reference_number || '',
        new Date(r.purchase_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        r.supplier_name || '',
        r.supplier_contact || '',
        r.product_name || '',
        r.product_sku || '',
        r.variant || '',
        r.quantity,
        r.unit_cost,
        r.subtotal,
        r.payment_status || '',
        r.payment_method || '',
        r.recorded_by || '',
      ]);
      exportToCSV(
        `purchases-detail-${getPeriodLabel(period)}-${new Date().toISOString().slice(0, 10)}.csv`,
        ['Purchase ID', 'Reference Number', 'Purchase Date', 'Supplier', 'Supplier Contact',
         'Product', 'SKU', 'Variant', 'Quantity', 'Unit Cost (RWF)', 'Subtotal (RWF)',
         'Payment Status', 'Payment Method', 'Recorded By'],
        rows
      );
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  const handleSuccess = () => {
    setShowForm(false);
    setSuccess('Purchase recorded and stock updated successfully.');
    load();
    emitDataChanged();
    setTimeout(() => setSuccess(''), 8000);
  };

  const totalCost = purchases.reduce((s, p) => s + Number(p.total_cost || 0), 0);

  const filtered = purchases.filter(p => {
    const q = search.toLowerCase();
    if (q && !(
      (p.supplier_name || '').toLowerCase().includes(q) ||
      (p.reference_number || '').toLowerCase().includes(q) ||
      String(p.id).includes(q)
    )) return false;
    if (supplierFilter && String(p.supplier_id) !== supplierFilter && p.supplier_name !== supplierFilter) return false;
    const d = new Date(p.purchase_date);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });
  const filteredCost = filtered.reduce((s, p) => s + Number(p.total_cost || 0), 0);

  return (
    <AdminLayout currentPage="/admin/purchases">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Purchases</h2>
            <p className="mt-1 text-sm text-slate-500">Record incoming stock from suppliers. Stock is updated automatically.</p>
          </div>
          <div className="flex gap-2">
            <ExportDropdown onExport={handleExport} />
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700">
              <span className="text-lg leading-none">+</span> Record Purchase
            </button>
          </div>
        </div>

        {success && (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 shadow-sm">
            <span className="text-sm font-semibold text-emerald-700">{success}</span>
            <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-emerald-700 text-lg">✕</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Purchases</p>
            <p className="mt-1.5 text-2xl font-extrabold text-blue-600">{purchases.length}</p>
            <p className="mt-1 text-xs text-slate-400">All time</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Cost</p>
            <p className="mt-1.5 text-2xl font-extrabold text-emerald-600">{fmt(totalCost)} <span className="text-sm font-semibold text-slate-400">RWF</span></p>
            <p className="mt-1 text-xs text-slate-400">All time</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Suppliers</p>
            <p className="mt-1.5 text-2xl font-extrabold text-violet-600">{suppliers.length}</p>
            <p className="mt-1 text-xs text-slate-400">Registered</p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
            <div className="relative flex-1 min-w-0 sm:min-w-[180px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search supplier, reference, or #…"
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400">
              <option value="">All Suppliers</option>
              {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">From</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">To</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
            </div>
            {(search || supplierFilter || dateFrom || dateTo) && (
              <button onClick={() => { setSearch(''); setSupplierFilter(''); setDateFrom(''); setDateTo(''); }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3">
            <span className="text-sm text-slate-500">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
            {(search || supplierFilter || dateFrom || dateTo) && (
              <span className="text-sm text-slate-500">Filtered total: <span className="font-bold text-slate-800">{fmt(filteredCost)} RWF</span></span>
            )}
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"/></div>
          ) : filtered.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-400">
              <p className="text-sm font-semibold">{purchases.length === 0 ? 'No purchases recorded yet.' : 'No purchases match your filters.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">#</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Supplier</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Reference</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Total Cost</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-mono text-sm font-bold text-slate-600">#{p.id}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{fmtDate(p.purchase_date)}</td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-700">{p.supplier_name || <span className="text-slate-300">—</span>}</td>
                      <td className="px-5 py-4 font-mono text-sm text-slate-500">{p.reference_number || <span className="text-slate-300">—</span>}</td>
                      <td className="px-5 py-4 text-right font-bold text-slate-900">{fmt(p.total_cost)} <span className="text-xs font-normal text-slate-400">RWF</span></td>
                      <td className="px-5 py-4 text-right">
                        <button onClick={() => setViewId(p.id)}
                          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-blue-600 hover:text-white">
                          View
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

      {showForm && <NewPurchaseForm products={products} suppliers={suppliers} onSuccess={handleSuccess} onClose={() => setShowForm(false)} purchaseCount={purchases.length} />}
      {viewId && <PurchaseDetailModal purchaseId={viewId} onClose={() => setViewId(null)} onReturned={load} />}
    </AdminLayout>
  );
}
