import { useEffect, useState, useCallback } from 'react';
import API from '../api';
import AdminLayout from '../components/AdminLayout';

function fmtPrice(v) { return Number(v || 0).toLocaleString('en-RW'); }

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState(null);

  const flash = (msg, err = false) => { setToast({ msg, err }); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      setCustomers(Array.isArray(data) ? data : []);
    } catch (e) {
      flash(e.response?.data?.message || 'Could not load customers', true);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => { const id = setTimeout(load, q ? 300 : 0); return () => clearTimeout(id); }, [load, q]);

  const openDetail = async (id) => {
    try { const { data } = await API.get(`/customers/${id}`); setDetail(data); }
    catch (e) { flash(e.response?.data?.message || 'Could not load customer', true); }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete customer ${c.name}?`)) return;
    try {
      await API.delete(`/customers/${c.id}`);
      flash('Customer deleted');
      setDetail(null);
      load();
    } catch (e) {
      flash(e.response?.data?.message || 'Delete failed', true);
    }
  };

  const inputCls = 'w-full rounded-xl border-2 border-slate-200 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-orange-400';

  return (
    <AdminLayout currentPage="/admin/customers">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
            <p className="text-sm text-slate-500">Customers from online orders and store records</p>
          </div>
          <input
            className="w-full rounded-xl border-2 border-slate-200 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-orange-400 sm:w-72"
            placeholder="Search name, phone, email…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
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
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3 text-right">Orders</th>
                  <th className="px-4 py-3 text-right">Total spent</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Loading…</td></tr>
                ) : !customers.length ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No customers found.</td></tr>
                ) : customers.map(c => (
                  <tr key={c.id} className="cursor-pointer border-b border-slate-100 transition hover:bg-orange-50/40" onClick={() => openDetail(c.id)}>
                    <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                    <td className="px-4 py-3 text-slate-600">{c.phone}</td>
                    <td className="px-4 py-3 text-slate-600">{c.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{[c.district, c.sector].filter(Boolean).join(', ') || '—'}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{c.order_count}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{fmtPrice(c.total_spent)}</td>
                    <td className="px-4 py-3 text-right text-orange-500">View →</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Customer detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetail(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xl font-bold text-slate-800">{detail.name}</p>
                <p className="text-sm text-slate-500">{detail.phone}{detail.email ? ` · ${detail.email}` : ''}</p>
              </div>
              <button onClick={() => setDetail(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">✕</button>
            </div>

            <div className="mt-3 text-sm text-slate-600">
              {[detail.province, detail.district, detail.sector, detail.address_details].filter(Boolean).join(', ') || 'No address on file'}
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Order history ({(detail.orders || []).length})</p>
              <div className="space-y-2">
                {!(detail.orders || []).length && <p className="text-sm text-slate-400">No orders yet.</p>}
                {(detail.orders || []).map(o => (
                  <div key={o.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <div>
                      <p className="font-mono font-semibold text-slate-800">{o.order_number}</p>
                      <p className="text-xs text-slate-400">{new Date(o.placed_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-800">{fmtPrice(o.total_amount)}</p>
                      <p className="text-xs text-slate-500">{o.status} · {o.payment_status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => remove(detail)}
              className="mt-5 w-full rounded-xl border-2 border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
            >
              Delete customer
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              Customers with orders cannot be deleted (protected by the database).
            </p>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
