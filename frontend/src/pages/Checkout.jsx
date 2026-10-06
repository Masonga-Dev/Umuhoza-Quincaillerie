import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import { useCart } from '../cart/CartContext';

function fmtPrice(v) {
  return Number(v || 0).toLocaleString('en-RW');
}

const DELIVERY_FEE = 2000; // flat Kigali delivery fee shown in the summary
const PAYMENT_METHODS = [
  { value: 'MTN',    label: 'MTN Mobile Money' },
  { value: 'Airtel', label: 'Airtel Money' },
  { value: 'Card',   label: 'Debit / Credit Card' },
  { value: 'Cash',   label: 'Cash on pickup' },
];

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    fulfillment_type: 'Delivery',
    province: 'Kigali', district: '', sector: '', address_details: '', delivery_instructions: '',
    payment_method: 'MTN',
    discount: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const isDelivery = form.fulfillment_type === 'Delivery';

  const totals = useMemo(() => {
    const fee = isDelivery ? DELIVERY_FEE : 0;
    const disc = Math.min(Math.max(0, Number(form.discount) || 0), subtotal + fee);
    const total = Math.max(0, subtotal + fee - disc);
    return { fee, disc, total };
  }, [isDelivery, subtotal, form.discount]);

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
        <h1 className="text-xl font-bold text-slate-800">Nothing to check out</h1>
        <p className="mt-1 text-sm text-slate-500">Your cart is empty.</p>
        <Link to="/products" className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600">
          Browse products
        </Link>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.phone.trim()) {
      setError('Name and phone number are required.');
      return;
    }
    if (isDelivery && (!form.district.trim() || !form.sector.trim() || !form.address_details.trim())) {
      setError('District, sector and address details are required for delivery.');
      return;
    }

    setSubmitting(true);
    try {
      // Prices/stock are NEVER trusted from here — the server re-prices every item.
      const payload = {
        customer: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          province: isDelivery ? form.province.trim() : null,
          district: isDelivery ? form.district.trim() : null,
          sector: isDelivery ? form.sector.trim() : null,
          address_details: isDelivery ? form.address_details.trim() : null,
        },
        items: items.map(i => ({
          product_id: i.product_id,
          product_variant_id: i.product_variant_id,
          quantity: i.quantity,
        })),
        fulfillment_type: form.fulfillment_type,
        delivery_fee: totals.fee,
        discount: totals.disc,
        tax: 0,
        payment_method: form.payment_method,
        delivery_instructions: isDelivery && form.delivery_instructions.trim() ? form.delivery_instructions.trim() : null,
      };

      const { data } = await API.post('/orders', payload);
      clearCart();
      navigate('/order-confirmation', {
        replace: true,
        state: {
          order_number: data.order_number,
          payment_reference: data.payment_reference,
          total_amount: data.total_amount,
          payment_method: form.payment_method,
          phone: payload.customer.phone,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-orange-400';
  const labelCls = 'mb-1 block text-xs font-semibold text-slate-600';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Checkout</h1>

      {error && (
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* ── Left: information ── */}
        <div className="space-y-6">
          {/* Customer information */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-800">1 · Customer Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Full name *</label>
                <input className={inputCls} value={form.name} onChange={set('name')} placeholder="John Doe" required />
              </div>
              <div>
                <label className={labelCls}>Phone number *</label>
                <input className={inputCls} value={form.phone} onChange={set('phone')} placeholder="078..." required />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Email (optional)</label>
                <input type="email" className={inputCls} value={form.email} onChange={set('email')} placeholder="you@example.com" />
              </div>
            </div>
          </section>

          {/* Fulfillment */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-800">2 · Fulfillment</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              {['Pickup', 'Delivery'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, fulfillment_type: type }))}
                  className={`rounded-2xl border-2 p-4 text-left transition ${
                    form.fulfillment_type === type
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-slate-200 hover:border-orange-300'
                  }`}
                >
                  <p className="font-semibold text-slate-800">{type === 'Pickup' ? '🏬 Store Pickup' : '🚚 Delivery'}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {type === 'Pickup' ? 'Collect from our store — free' : `Kigali-wide — ${fmtPrice(DELIVERY_FEE)} RWF`}
                  </p>
                </button>
              ))}
            </div>

            {isDelivery && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Province</label>
                  <input className={inputCls} value={form.province} onChange={set('province')} />
                </div>
                <div>
                  <label className={labelCls}>District *</label>
                  <input className={inputCls} value={form.district} onChange={set('district')} placeholder="Gasabo" required />
                </div>
                <div>
                  <label className={labelCls}>Sector *</label>
                  <input className={inputCls} value={form.sector} onChange={set('sector')} placeholder="Kacyiru" required />
                </div>
                <div>
                  <label className={labelCls}>Address / details *</label>
                  <input className={inputCls} value={form.address_details} onChange={set('address_details')} placeholder="Street, house no." required />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Delivery instructions (optional)</label>
                  <textarea
                    className={`${inputCls} min-h-[70px] resize-y`}
                    value={form.delivery_instructions}
                    onChange={set('delivery_instructions')}
                    placeholder="Landmarks, best time to call…"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Payment */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-800">3 · Payment</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {PAYMENT_METHODS.map(m => (
                <label
                  key={m.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3.5 transition ${
                    form.payment_method === m.value
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-slate-200 hover:border-orange-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={m.value}
                    checked={form.payment_method === m.value}
                    onChange={set('payment_method')}
                    className="accent-orange-500"
                  />
                  <span className="text-sm font-semibold text-slate-800">{m.label}</span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
              Online payments are verified by our backend with the payment provider — never by your browser.
            </p>
          </section>
        </div>

        {/* ── Right: order summary ── */}
        <div className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">Order Summary</h2>

          <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
            {items.map(item => (
              <div key={item.key} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">{item.name}</p>
                  {item.variant_label && <p className="text-xs text-slate-400">{item.variant_label}</p>}
                  <p className="text-xs text-slate-400">× {item.quantity}</p>
                </div>
                <span className="shrink-0 font-semibold text-slate-700">
                  {fmtPrice(item.unit_price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span><span>{fmtPrice(subtotal)} RWF</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Delivery fee</span><span>{totals.fee ? `${fmtPrice(totals.fee)} RWF` : 'Free'}</span>
            </div>
            {totals.disc > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span><span>− {fmtPrice(totals.disc)} RWF</span>
              </div>
            )}
          </div>

          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-lg font-bold text-slate-800">
            <span>Total</span>
            <span className="text-orange-600">{fmtPrice(totals.total)} RWF</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 w-full rounded-2xl bg-orange-500 py-3 font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? 'Placing order…' : `Place Order · ${fmtPrice(totals.total)} RWF`}
          </button>

          <Link
            to="/cart"
            className="mt-3 block w-full rounded-2xl border-2 border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-600 transition hover:border-orange-300 hover:text-orange-600"
          >
            ← Back to cart
          </Link>
        </div>
      </form>
    </div>
  );
}

