import { useEffect, useState, useCallback } from 'react';
import API from '../api';
import AdminLayout from '../components/AdminLayout';
import { useLanguage } from '../i18n/LanguageContext';

function fmtPrice(v) { return Number(v || 0).toLocaleString('en-RW'); }
function fmtDT(d) { return new Date(d).toLocaleString('en-RW', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }

function itemLabel(it) {
  const variant = [it.variant_color, it.variant_size].filter(Boolean).join(' / ');
  return `${it.product_name}${variant ? ` (${variant})` : ''}`;
}

export default function AdminPurchaseReturns() {
  const { t } = useLanguage();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  const flash = (msg, err = false) => { setToast({ msg, err }); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/purchases/returns');
      setReturns(Array.isArray(data) ? data : []);
    } catch (e) {
      flash(e.response?.data?.message || 'Could not load purchase returns', true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = returns.filter(r => {
    if (!q) return true;
    const hay = `${r.reference_number || ''} ${r.supplier_name || ''} ${r.created_by_name || ''} ${r.notes || ''}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const inputCls = 'rounded-xl border-2 border-slate-200 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-orange-400';

  return (
    <AdminLayout currentPage="/admin/purchase-returns">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{t('admin.purchaseReturnsPage.title')}</h1>
            <p className="text-sm text-slate-500">{t('admin.purchaseReturnsPage.subtitle')}</p>
          </div>
          <input
            className={`${inputCls} w-full sm:w-72`}
            placeholder={t('admin.purchaseReturnsPage.searchPlaceholder')}
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
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Purchase</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3 text-right">Credit value</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">By</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">Loading…</td></tr>
                ) : !filtered.length ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">{t('admin.purchaseReturnsPage.empty')}</td></tr>
                ) : filtered.map(r => (
                  <tr key={r.id} className="cursor-pointer border-b border-slate-100 transition hover:bg-orange-50/40" onClick={() => setSelected(r)}>
                    <td className="px-4 py-3 font-semibold text-slate-700">RET-{String(r.id).padStart(3, '0')}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{r.reference_number || `#${r.purchase_id}`}</td>
                    <td className="px-4 py-3 text-slate-600">{r.supplier_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{(r.items || []).length}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{fmtPrice(r.total_returned_cost)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmtDT(r.created_at)}</td>
                    <td className="px-4 py-3 text-slate-600">{r.created_by_name || '—'}</td>
                    <td className="px-4 py-3 text-right text-orange-500">View →</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xl font-bold text-slate-800">RET-{String(selected.id).padStart(3, '0')}</p>
                <p className="text-xs text-slate-400">{fmtDT(selected.created_at)} · {selected.created_by_name || '—'}</p>
              </div>
              <button onClick={() => setSelected(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">✕</button>
            </div>

            <div className="mt-3 text-sm text-slate-600">
              <p>Purchase: <span className="font-mono font-semibold">{selected.reference_number || `#${selected.purchase_id}`}</span></p>
              <p>Supplier: <span className="font-semibold">{selected.supplier_name || '—'}</span></p>
              {selected.notes && <p className="mt-1 italic text-slate-500">"{selected.notes}"</p>}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200">
              {(selected.items || []).map((it, i) => (
                <div key={i} className="flex justify-between border-b border-slate-100 px-4 py-2.5 text-sm last:border-0">
                  <span className="text-slate-700">{itemLabel(it)} × {it.quantity}</span>
                  <span className="font-semibold text-slate-800">{fmtPrice(it.subtotal)} RWF</span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-800">
              <span>Total credit</span>
              <span className="text-orange-600">{fmtPrice(selected.total_returned_cost)} RWF</span>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
