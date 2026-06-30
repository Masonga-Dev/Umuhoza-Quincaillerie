import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

const EMPTY = { name: '', contact_person: '', phone: '', email: '', address: '', notes: '' };

const PALETTE = [
  { bg: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-rose-100', text: 'text-rose-700' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700' },
];

const FIELD = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100';
const LABEL = 'block text-sm font-semibold text-slate-700';

function timeAgo(d) {
  if (!d) return '';
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (days === 0) return 'Added today';
  if (days === 1) return 'Added 1 day ago';
  if (days < 7) return `Added ${days} days ago`;
  const w = Math.floor(days / 7);
  if (w < 5) return `Added ${w} week${w !== 1 ? 's' : ''} ago`;
  const m = Math.floor(days / 30);
  return `Added ${m} month${m !== 1 ? 's' : ''} ago`;
}

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = () => {
    API.get('/suppliers')
      .then(r => setSuppliers(r.data || []))
      .catch(() => setError('Could not load suppliers.'))
      .finally(() => setLoading(false));
  };

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const reset = () => { setEditing(null); setForm(EMPTY); setError(''); setShowForm(false); };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Supplier name is required.');
    setError(''); setSaving(true);
    try {
      if (editing) { await API.put(`/suppliers/${editing.id}`, form); }
      else { await API.post('/suppliers', form); }
      reset(); fetchSuppliers();
    } catch (err) { setError(err?.response?.data?.message || 'Could not save supplier.'); }
    finally { setSaving(false); }
  };

  const handleEdit = s => {
    setEditing(s);
    setForm({ name: s.name, contact_person: s.contact_person || '', phone: s.phone || '', email: s.email || '', address: s.address || '', notes: s.notes || '' });
    setError(''); setShowForm(true);
  };

  const handleDelete = async s => {
    if (!window.confirm(`Delete supplier "${s.name}"?`)) return;
    try { await API.delete(`/suppliers/${s.id}`); fetchSuppliers(); }
    catch (err) { setError(err?.response?.data?.message || 'Could not delete.'); }
  };

  const filtered = suppliers.filter(s =>
    !search || [s.name, s.contact_person, s.phone, s.email].some(v => (v || '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout currentPage="/admin/suppliers">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Suppliers</h2>
            <p className="mt-1 text-sm text-slate-500">Manage suppliers used when recording stock purchases.</p>
          </div>
          <button
            onClick={() => { setEditing(null); setForm(EMPTY); setError(''); setShowForm(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition">
            <span className="text-lg leading-none">+</span> Add Supplier
          </button>
        </div>

        {/* Stat */}
        <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm max-w-xs">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Suppliers</p>
            <p className="text-3xl font-extrabold leading-none mt-0.5 text-blue-600">{suppliers.length}</p>
          </div>
        </div>

        {/* Search + Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1" style={{ minWidth: 220 }}>
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers…"
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"/>
          </div>
          <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
            <button onClick={() => setViewMode('grid')} title="Grid view"
              className={`px-3 py-2.5 transition ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-700'}`}>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zm8 0A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zm-8 8A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zm8 0A1.5 1.5 0 0110.5 9h3A1.5 1.5 0 0115 10.5v3A1.5 1.5 0 0113.5 15h-3A1.5 1.5 0 019 13.5v-3z"/>
              </svg>
            </button>
            <button onClick={() => setViewMode('list')} title="List view"
              className={`px-3 py-2.5 transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-700'}`}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          </div>
        </div>

        {error && !showForm && (
          <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex h-56 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white text-slate-400">
            <span className="text-5xl select-none">🏭</span>
            <p className="text-sm font-semibold">{search ? 'No suppliers match your search.' : 'No suppliers yet. Add the first one!'}</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(s => {
              const color = PALETTE[s.id % PALETTE.length];
              return (
                <div key={s.id} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:-translate-y-0.5 duration-200">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-base font-extrabold ${color.bg} ${color.text}`}>
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{s.name}</h3>
                      {s.contact_person && <p className="text-xs text-slate-500 mt-0.5">{s.contact_person}</p>}
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    {s.phone && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <svg className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                        {s.phone}
                      </div>
                    )}
                    {s.email && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <svg className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                        <span className="truncate">{s.email}</span>
                      </div>
                    )}
                    {s.address && (
                      <div className="flex items-start gap-2 text-xs text-slate-500">
                        <svg className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        <span className="line-clamp-2">{s.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
                    <button onClick={() => handleEdit(s)}
                      className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(s)}
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">{timeAgo(s.created_at)}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Supplier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 hidden md:table-cell">Email / Phone</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(s => {
                  const color = PALETTE[s.id % PALETTE.length];
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ${color.bg} ${color.text}`}>
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{s.name}</p>
                            {s.address && <p className="text-xs text-slate-400 truncate max-w-[180px]">{s.address}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {s.contact_person ? (
                          <p className="text-sm text-slate-700">{s.contact_person}</p>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <div className="space-y-0.5">
                          {s.phone && <p className="text-xs text-slate-600">{s.phone}</p>}
                          {s.email && <p className="text-xs text-slate-400">{s.email}</p>}
                          {!s.phone && !s.email && <span className="text-slate-300 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(s)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition">Edit</button>
                          <button onClick={() => handleDelete(s)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {/* Centered modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={reset}>
          <div className="w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{editing ? 'Edit Supplier' : 'Add New Supplier'}</h3>
                {editing && <p className="mt-0.5 text-xs text-slate-400">Editing: <span className="font-semibold text-slate-600">{editing.name}</span></p>}
              </div>
              <button onClick={reset} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition text-xl leading-none">✕</button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
              <div className="flex-1 space-y-4 p-6">

                <div>
                  <label className={LABEL}>Supplier Name <span className="text-red-500">*</span></label>
                  <input value={form.name} onChange={set('name')} placeholder="e.g. Kigali Hardware Ltd" className={FIELD}/>
                </div>

                <div>
                  <label className={LABEL}>Contact Person</label>
                  <input value={form.contact_person} onChange={set('contact_person')} placeholder="e.g. Jean Uwimana" className={FIELD}/>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Phone</label>
                    <input value={form.phone} onChange={set('phone')} placeholder="+250 788 000 000" className={FIELD}/>
                  </div>
                  <div>
                    <label className={LABEL}>Email</label>
                    <input type="email" value={form.email} onChange={set('email')} placeholder="supplier@email.com" className={FIELD}/>
                  </div>
                </div>

                <div>
                  <label className={LABEL}>Address</label>
                  <textarea rows={2} value={form.address} onChange={set('address')} placeholder="Physical address…" className={FIELD}/>
                </div>

                <div>
                  <label className={LABEL}>Notes</label>
                  <textarea rows={3} value={form.notes} onChange={set('notes')} placeholder="Any additional notes…" className={FIELD}/>
                </div>

                {error && <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              </div>

              {/* Footer */}
              <div className="flex gap-3 border-t border-slate-200 p-6">
                <button type="button" onClick={reset}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition">
                  {saving ? 'Saving…' : editing ? 'Update Supplier' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
