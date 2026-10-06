import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import API from '../api';

function fmtPrice(v) {
  return Number(v || 0).toLocaleString('en-RW');
}

export default function OrderConfirmation() {
  const { state } = useLocation();
  const [payStatus, setPayStatus] = useState(null);
  const [payInstructions, setPayInstructions] = useState(null);

  // Start the provider payment once for online methods (Phase 8)
  useEffect(() => {
    if (!state?.payment_reference) return;
    if (state.payment_method === 'Cash') return;
    let cancelled = false;
    API.post(`/payments/${state.payment_reference}/initiate`)
      .then(({ data }) => {
        if (!cancelled && data.instructions) setPayInstructions(data.instructions);
        if (!cancelled && data.status) setPayStatus(data.status);
      })
      .catch(() => { /* status polling still runs */ });
    return () => { cancelled = true; };
  }, [state?.payment_reference, state?.payment_method]);

  // Poll payment status (backend verifies with the provider — browser never decides)
  useEffect(() => {
    if (!state?.payment_reference) return;
    const poll = async () => {
      try {
        const { data } = await API.get(`/payments/${state.payment_reference}/status`);
        setPayStatus(data.status);
      } catch { /* keep last known */ }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [state?.payment_reference]);

  if (!state?.order_number) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-slate-500">No recent order found.</p>
        <Link to="/products" className="mt-4 inline-block text-sm font-semibold text-orange-500 hover:underline">
          ← Back to products
        </Link>
      </div>
    );
  }

  const paid = payStatus === 'Paid';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Success banner */}
      <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-3xl text-white">✓</div>
        <h1 className="text-2xl font-bold text-emerald-800">Order placed successfully!</h1>
        <p className="mt-1 text-sm text-emerald-700">
          Thank you — we&apos;ll confirm your order shortly.
        </p>

        <div className="mt-5 grid gap-3 text-left sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Order number</p>
            <p className="mt-0.5 font-mono text-lg font-bold text-slate-800">{state.order_number}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Payment reference</p>
            <p className="mt-0.5 font-mono text-lg font-bold text-slate-800">{state.payment_reference}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-3 text-sm">
          <span className="text-slate-500">Total:</span>
          <span className="font-bold text-slate-800">{fmtPrice(state.total_amount)} RWF</span>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
            paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            Payment: {payStatus || state.payment_method || 'Pending'}
          </span>
        </div>
      </div>

      {payInstructions && !paid && (
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-800">
          {payInstructions}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/products"
          className="rounded-2xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
        >
          Continue shopping
        </Link>
        <Link
          to="/track-order"
          state={{ order_number: state.order_number, phone: state.phone }}
          className="rounded-2xl border-2 border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-400 hover:text-orange-600"
        >
          Track my order →
        </Link>
      </div>

      <p className="text-center text-xs text-slate-400">
        A confirmation is available via order tracking using your order number and phone.
      </p>
    </div>
  );
}
