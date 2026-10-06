import { useEffect, useState, useCallback } from 'react';
import API from '../api';
import AdminLayout from '../components/AdminLayout';
import { useLanguage } from '../i18n/LanguageContext';

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Ready for Pickup', 'Out for Delivery', 'Completed', 'Cancelled'];
const PAY_STATUSES = ['Pending', 'Processing', 'Paid', 'Failed', 'Cancelled', 'Refunded'];
const NEXT_STATUS = {
  Pending:          ['Confirmed', 'Cancelled'],
  Confirmed:        ['Processing', 'Ready for Pickup', 'Out for Delivery', 'Completed', 'Cancelled'],
  Processing:       ['Ready for Pickup', 'Out for Delivery', 'Completed', 'Cancelled'],
  'Ready for Pickup':['Completed', 'Cancelled'],
  'Out for Delivery':['Completed', 'Cancelled'],
  Completed:        ['Cancelled'],
  Cancelled:        [],
};

function fmtPrice(v) { return Number(v || 0).toLocaleString('en-RW'); }

function Badge({ status, kind }) {
  const palette = kind === 'pay'
    ? { Paid: 'bg-emerald-100 text-emerald-700', Pending: 'bg-amber-100 text-amber-700', Processing: 'bg-blue-100 text-blue-700', Failed: 'bg-red-100 text-red-700', Cancelled: 'bg-slate-100 text-slate-600', Refunded: 'bg-purple-100 text-purple-700' }
    : { Pending: 'bg-amber-100 text-amber-700', Confirmed: 'bg-blue-100 text-blue-700', Processing: 'bg-indigo-100 text-indigo-700', 'Ready for Pickup': 'bg-cyan-100 text-cyan-700', 'Out for Delivery': 'bg-violet-100 text-violet-700', Completed: 'bg-emerald-100 text-emerald-700', Cancelled: 'bg-red-100 text-red-700' };
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold ${palette[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

export default function AdminOrders() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null); // full order detail
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const flash = (msg, err = false) => { setToast({ msg, err }); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      const { data } = await API.get(`/orders?${params.toString()}`);
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      flash(e.response?.data?.message || 'Could not load orders', true);
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => { const id = setTimeout(load, q ? 300 : 0); return () => clearTimeout(id); }, [load, q]);

  const openDetail = async (id) => {
    try {
      const { data } = await API.get(`/orders/${id}`);
      setSelected(data);
    } catch (e) { flash(e.response?.data?.message || 'Could not load order', true); }
  };

  const transition = async (next) => {
    if (!selected) return;
    if (next === 'Cancelled' && !window.confirm(`Cancel order ${selected.order_number}? Stock will be restored.`)) return;
    setBusy(true);
    try {
      await API.patch(`/orders/${selected.id}/status`, { status: next });
      flash(`Order ${next.toLowerCase()}`);
      setSelected(null);
      load();
    } catch (e) {
      flash(e.response?.data?.message || 'Status update failed', true);
    } finally {
      setBusy(false);
    }
  };

  const inputCls = 'rounded-xl border-2 border-slate-200 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-orange-400';

  return (
    <AdminLayout currentPage="/admin/orders">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{t('admin.ordersPage.title')}</h1>
            <p className="text-sm text-slate-500">{t('admin.ordersPage.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              className={inputCls}
              placeholder={t('admin.ordersPage.searchPlaceholder')}
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            <select className={inputCls} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">{t('admin.ordersPage.allStatuses')}</option>
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {toast && (
          <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${toast.err ? 'bg-red-50 text-red-600 border-2 border-red-200' : 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200'}`}>
            {toast.msg}
          </div>
        )}

        {/* Orders table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">Loading…</td></tr>
                ) : !orders.length ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">No orders found.</td></tr>
                ) : orders.map(o => (
                  <tr key={o.id} className="cursor-pointer border-b border-slate-100 transition hover:bg-orange-50/40" onClick={() => openDetail(o.id)}>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">{o.order_number}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{new Date(o.placed_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{o.customer_name}</p>
                      <p className="text-xs text-slate-400">{o.customer_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{o.item_count}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{fmtPrice(o.total_amount)}</td>
                    <td className="px-4 py-3"><Badge status={o.payment_status} kind="pay" /></td>
                    <td className="px-4 py-3"><Badge status={o.status} /></td>
                    <td className="px-4 py-3 text-right text-orange-500">View →</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !busy && setSelected(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xl font-bold text-slate-800">{selected.order_number}</p>
                <p className="text-xs text-slate-400">{new Date(selected.placed_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelected(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200" disabled={busy}>✕</button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge status={selected.status} />
              <Badge status={selected.payment_status} kind="pay" />
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">{selected.fulfillment_type}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                {selected.province ? [selected.province, selected.district, selected.sector].filter(Boolean).join(', ') : 'Store pickup'}
              </span>
            </div>

            {/* Items */}
            <div className="mt-4 rounded-2xl border border-slate-200">
              {(selected.items || []).map(it => (
                <div key={it.id} className="flex justify-between border-b border-slate-100 px-4 py-2.5 text-sm last:border-0">
                  <span className="text-slate-700">{it.product_name}{it.variant_label ? ` (${it.variant_label})` : ''} × {it.quantity}</span>
                  <span className="font-semibold text-slate-800">{fmtPrice(it.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{fmtPrice(selected.subtotal)}</span></div>
              <div className="flex justify-between text-slate-500"><span>Delivery fee</span><span>{fmtPrice(selected.delivery_fee)}</span></div>
              {Number(selected.discount) > 0 && <div className="flex justify-between text-slate-500"><span>Discount</span><span>− {fmtPrice(selected.discount)}</span></div>}
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-800"><span>Total</span><span className="text-orange-600">{fmtPrice(selected.total_amount)} RWF</span></div>
            </div>

            {/* Payments */}
            {(selected.payments || []).length > 0 && (
              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                {selected.payments.map(p => (
                  <div key={p.id} className="flex justify-between">
                    <span className="font-mono">{p.payment_reference} · {p.payment_method} · {p.provider}</span>
                    <Badge status={p.status} kind="pay" />
                  </div>
                ))}
              </div>
            )}

            {/* Status transitions */}
            <div className="mt-5 border-t border-slate-200 pt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Move to</p>
              <div className="flex flex-wrap gap-2">
                {(NEXT_STATUS[selected.status] || []).map(next => (
                  <button
                    key={next}
                    disabled={busy}
                    onClick={() => transition(next)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                      next === 'Cancelled'
                        ? 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100'
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
                  >
                    {next}
                  </button>
                ))}
                {!(NEXT_STATUS[selected.status] || []).length && (
                  <p className="text-sm text-slate-400">No further transitions available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
