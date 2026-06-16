import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

const HEADERS = () => ({ Authorization: `Bearer ${localStorage.getItem('umuhoza_token')}` });
const fieldCls = 'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100';
const labelCls = 'block text-sm font-medium text-slate-700';
const EMPTY = { name: '', contact_person: '', phone: '', email: '', address: '', notes: '' };

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = () => {
    API.get('/suppliers', { headers: HEADERS() })
      .then(r => setSuppliers(r.data || []))
      .catch(() => setError('Could not load suppliers.'))
      .finally(() => setLoading(false));
  };

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const reset = () => { setEditing(null); setForm(EMPTY); setError(''); };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Supplier name is required.');
    setError(''); setSaving(true);
    try {
      if (editing) {
        await API.put(`/suppliers/${editing.id}`, form, { headers: HEADERS() });
      } else {
        await API.post('/suppliers', form, { headers: HEADERS() });
      }
      reset();
      fetchSuppliers();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save supplier.');
    } finally { setSaving(false); }
  };

  const handleEdit = s => { setEditing(s); setForm({ name: s.name, contact_person: s.contact_person || '', phone: s.phone || '', email: s.email || '', address: s.address || '', notes: s.notes || '' }); setError(''); };

  const handleDelete = async s => {
    if (!window.confirm(`Delete supplier '${s.name}'?`)) return;
    try {
      await API.delete(`/suppliers/${s.id}`, { headers: HEADERS() });
      fetchSuppliers();
    } catch (err) { setError(err?.response?.data?.message || 'Could not delete.'); }
  };

  return (
    <AdminLayout currentPage="/admin/suppliers">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Suppliers</h2>
          <p className="mt-1 text-sm text-slate-500">Manage suppliers used when recording stock purchases.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          {/* List */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900">Supplier List</h3>
            {loading ? <p className="mt-4 text-sm text-slate-500">Loading…</p> : suppliers.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">No suppliers yet. Add one →</p>
            ) : (
              <div className="mt-4 space-y-3">
                {suppliers.map(s => (
                  <div key={s.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{s.name}</p>
                      {s.contact_person && <p className="text-sm text-slate-500 mt-0.5">Contact: {s.contact_person}</p>}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        {s.phone && <span className="text-xs text-slate-400">{s.phone}</span>}
                        {s.email && <span className="text-xs text-slate-400">{s.email}</span>}
                        {s.address && <span className="text-xs text-slate-400 truncate">{s.address}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleEdit(s)} className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200">Edit</button>
                      <button onClick={() => handleDelete(s)} className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm self-start sticky top-4">
            <h3 className="font-semibold text-slate-900">{editing ? 'Edit Supplier' : 'Add Supplier'}</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div><label className={labelCls}>Supplier Name <span className="text-red-500">*</span></label><input value={form.name} onChange={set('name')} placeholder="e.g. Kigali Hardware Ltd" className={fieldCls} /></div>
              <div><label className={labelCls}>Contact Person</label><input value={form.contact_person} onChange={set('contact_person')} placeholder="e.g. Jean Uwimana" className={fieldCls} /></div>
              <div><label className={labelCls}>Phone</label><input value={form.phone} onChange={set('phone')} placeholder="+250 788 000 000" className={fieldCls} /></div>
              <div><label className={labelCls}>Email</label><input type="email" value={form.email} onChange={set('email')} placeholder="supplier@email.com" className={fieldCls} /></div>
              <div><label className={labelCls}>Address</label><textarea rows={2} value={form.address} onChange={set('address')} placeholder="Physical address…" className={fieldCls} /></div>
              <div><label className={labelCls}>Notes</label><textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="Any notes…" className={fieldCls} /></div>
              {error && <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                  {saving ? 'Saving…' : editing ? 'Update' : 'Add Supplier'}
                </button>
                {editing && <button type="button" onClick={reset} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>}
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
