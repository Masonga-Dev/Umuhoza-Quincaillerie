import { useEffect, useState, useCallback } from 'react';
import API from '../api';
import AdminLayout from '../components/AdminLayout';

const PAY_STATUSES = ['Pending', 'Processing', 'Paid', 'Failed', 'Cancelled', 'Refunded'];

function fmtPrice(v) { return Number(v || 0).toLocaleString('en-RW'); }

function Badge({ status }) {
  const palette = { Paid: 'bg-emerald-100 text-emerald-700', Pending: 'bg-amber-100 text-amber-700', Processing: 'bg-blue-100 text-blue-700', Failed: 'bg-red-100 text-red-700', Cancelled: 'bg-slate-100 text-slate-600', Refunded: 'bg-purple-100 text-purple-700' };
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold ${palette[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [toast, setToast] = useState(null);

  const flash = (msg, err = false) => { setToast({ msg, err }); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      const { data } = await API.get(`/payments?${params.toString()}`);
      setPayments(Array.isArray(data) ? data : []);
    } catch (e) {
      flash(e.response?.data?.message || 'Could not load payments', true);
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => { const id = setTimeout(load, q ? 300 : 0); return () => clearTimeout(id); }, [load, q]);

  // Manual confirmation (e.g. verified bank transfer) — admin only, audited server-side
  const updateStatus = async (p, next) => {
    if (next === 'Paid' && !window.confirm(`Mark ${p.payment_reference} as Paid?`)) return;
    try {
      await API.patch(`/payments/${p.id}`, { status: next });
      flash(`${p.payment_reference} → ${next}`);
      load();
    } catch (e) {
      flash(e.response?.data?.message || 'Update failed', true);
    }
  };

  const inputCls = 'rounded-xl border-2 border-slate-200 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-orange-400';

  return (
    <AdminLayout currentPage="/admin/payments">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
            <p className="text-sm text-slate-500">Payment intents for online orders</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input className={inputCls} placeholder="Search reference or order…" value={q} onChange={e => setQ(e.target.value)} />
            <select className={inputCls} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {PAY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {toast && (
          <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${toast.err ? 'border-2 border-red-200 bg-red-50 text-red-600' : 'border-2 border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {toast.msg}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Loading…</td></tr>
                ) : !payments.length ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No payments found.</td></tr>
                ) : payments.map(p => (
                  <tr key={p.id} className="border-b border-slate-100 transition hover:bg-orange-50/40">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">{p.payment_reference}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{p.order_number}</td>
                    <td className="px-4 py-3 text-slate-600">{p.customer_name}</td>
                    <td className="px-4 py-3 text-slate-600">{p.payment_method} · {p.provider}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{fmtPrice(p.amount)} {p.currency}</td>
                    <td className="px-4 py-3"><Badge status={p.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <select
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 outline-none focus:border-orange-400"
                        value={p.status}
                        onChange={e => { if (e.target.value !== p.status) updateStatus(p, e.target.value); }}
                      >
                        {PAY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Status changes here are admin overrides — real payment confirmations arrive through the provider webhook, which is signature-verified.
        </p>
      </div>
    </AdminLayout>
  );
}
