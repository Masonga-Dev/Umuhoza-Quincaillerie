import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import API from '../api';

function fmtPrice(v) {
  return Number(v || 0).toLocaleString('en-RW');
}

const STATUS_STEPS = ['Pending', 'Confirmed', 'Processing', 'Out for Delivery', 'Completed'];

function StatusTimeline({ status }) {
  if (status === 'Cancelled') {
    return (
      <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
        This order was cancelled.
      </div>
    );
  }
  const idx = status === 'Ready for Pickup'
    ? STATUS_STEPS.indexOf('Processing')
    : STATUS_STEPS.indexOf(status);

  return (
    <div className="flex items-center gap-1">
      {STATUS_STEPS.map((s, i) => (
        <div key={s} className="flex flex-1 items-center gap-1">
          <div className="flex flex-col items-center gap-1">
            <div className={`h-3 w-3 rounded-full ${i <= idx ? 'bg-orange-500' : 'bg-slate-200'}`} />
            <span className={`hidden text-[9px] sm:block ${i <= idx ? 'font-semibold text-orange-600' : 'text-slate-400'}`}>
              {s}
            </span>
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <div className={`mb-3 h-0.5 flex-1 ${i < idx ? 'bg-orange-500' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
      </div>
  );
}

export default function TrackOrder() {
  const loc = useLocation();
  const [form, setForm] = useState({
    order_number: loc.state?.order_number || '',
    phone: loc.state?.phone || '',
  });
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const track = async (e) => {
    e.preventDefault();
    setError(null);
    setOrder(null);
    if (!form.order_number.trim() || !form.phone.trim()) {
      setError('Order number and phone are required.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.get(
        `/orders/track?order_number=${encodeURIComponent(form.order_number.trim())}&phone=${encodeURIComponent(form.phone.trim())}`
      );
      setOrder(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Order not found. Check your order number and phone.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-orange-400';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Track your order</h1>

      <form onSubmit={track} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Order number</label>
            <input
              className={inputCls}
              value={form.order_number}
              onChange={e => setForm(f => ({ ...f, order_number: e.target.value }))}
              placeholder="ORD-2026-0001"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Phone number</label>
            <input
              className={inputCls}
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="078..."
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="h-[42px] rounded-xl bg-orange-500 px-6 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
            >
              {loading ? 'Checking…' : 'Track'}
            </button>
          </div>
        </div>

        {error && <p className="mt-3 text-sm font-semibold text-red-500">{error}</p>}
        <p className="mt-3 text-[11px] text-slate-400">
          For your privacy, tracking requires the phone number used at checkout.
        </p>
      </form>

      {order && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-mono text-lg font-bold text-slate-800">{order.order_number}</p>
              <p className="text-xs text-slate-400">Placed {new Date(order.placed_at).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-orange-600">{fmtPrice(order.total_amount)} RWF</p>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                order.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                Payment: {order.payment_status}
              </span>
            </div>
          </div>

          <div className="mt-5"><StatusTimeline status={order.status} /></div>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Items</p>
            <div className="space-y-2">
              {(order.items || []).map((it, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-slate-700">
                    {it.product_name}
                    {it.variant_label ? ` (${it.variant_label})` : ''} × {it.quantity}
                  </span>
                  <span className="font-semibold text-slate-800">{fmtPrice(it.subtotal)} RWF</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="text-center">
        <Link to="/products" className="text-sm font-semibold text-orange-500 hover:underline">
          ← Continue shopping
        </Link>
      </div>
    </div>
  );
}

