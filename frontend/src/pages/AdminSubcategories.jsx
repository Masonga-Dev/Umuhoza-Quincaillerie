import { useEffect, useRef, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const inp = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100';
const lbl = 'block text-xs font-semibold uppercase tracking-wide text-slate-500';
const EMPTY = { category_id: '', name: '', name_rw: '', name_fr: '', description: '', description_rw: '', description_fr: '' };

function LangBadge({ lang }) {
  const map = { EN: 'bg-blue-100 text-blue-700', RW: 'bg-emerald-100 text-emerald-700', FR: 'bg-violet-100 text-violet-700' };
  return <span className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none ${map[lang]}`}>{lang}</span>;
}

export default function AdminSubcategories() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [filterCatId, setFilterCatId] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    API.get('/categories').then(r => setCategories(r.data || [])).catch(console.error);
  }, []);

  useEffect(() => { fetchSubcategories(); }, [filterCatId]);

  const fetchSubcategories = () => {
    setLoading(true);
    const params = filterCatId ? { category_id: filterCatId } : {};
    API.get('/subcategories', { params })
      .then(r => setSubcategories(r.data || []))
      .catch(() => setError('Could not load subcategories.'))
      .finally(() => setLoading(false));
  };

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const reset = () => { setEditing(null); setForm(EMPTY); setImageFile(null); setImagePreview(null); setError(''); if (fileRef.current) fileRef.current.value = ''; };

  const handleImageChange = e => {
    const f = e.target.files?.[0];
    if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.category_id) return setError('Please select a category.');
    if (!form.name.trim()) return setError('Subcategory name is required.');
    setError(''); setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (imageFile) data.append('image', imageFile);
      // Only preserve existing image if user hasn't explicitly removed it
      if (!imageFile && imagePreview && editing?.image_path) data.append('existing_image_path', editing.image_path);
      if (editing) { await API.put(`/subcategories/${editing.id}`, data); }
      else { await API.post('/subcategories', data); }
      reset();
      fetchSubcategories();
    } catch (err) { setError(err?.response?.data?.message || 'Could not save subcategory.'); }
    finally { setSaving(false); }
  };

  const handleEdit = sub => {
    setEditing(sub);
    setForm({ category_id: sub.category_id, name: sub.name || '', name_rw: sub.name_rw || '', name_fr: sub.name_fr || '', description: sub.description || '', description_rw: sub.description_rw || '', description_fr: sub.description_fr || '' });
    setImagePreview(sub.image_path ? `${BACKEND}/${sub.image_path}` : null);
    setImageFile(null); setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async sub => {
    if (!window.confirm(`Delete subcategory '${sub.name}'? Products in this subcategory will be kept but un-linked.`)) return;
    try { await API.delete(`/subcategories/${sub.id}`); fetchSubcategories(); }
    catch (err) { setError(err?.response?.data?.message || 'Could not delete.'); }
  };

  return (
    <AdminLayout currentPage="/admin/products/subcategories">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Subcategories</h2>
          <p className="mt-1 text-slate-500 text-sm">Organise products within categories using subcategories.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* List */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-slate-900">All Subcategories</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{subcategories.length}</span>
              </div>
              <select
                value={filterCatId}
                onChange={e => setFilterCatId(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-400"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {loading ? (
              <div className="flex h-40 items-center justify-center text-slate-400 text-sm">Loading…</div>
            ) : subcategories.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-slate-400">
                <span className="text-3xl">📂</span>
                <p className="text-sm">No subcategories yet. Add one →</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {subcategories.map(sub => (
                  <div key={sub.id} className="flex items-start gap-4 p-4 hover:bg-slate-50 transition group">
                    {sub.image_path ? (
                      <img src={`${BACKEND}/${sub.image_path}`} alt={sub.name} className="h-14 w-14 flex-shrink-0 rounded-xl object-cover border border-slate-200" />
                    ) : (
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl select-none border border-slate-200">📂</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{sub.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        <span className="text-blue-600 font-medium">{sub.category_name}</span>
                        {(sub.name_rw || sub.name_fr) && <> · {[sub.name_rw, sub.name_fr].filter(Boolean).join(' / ')}</>}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {sub.name_rw && <LangBadge lang="RW" />}
                        {sub.name_fr && <LangBadge lang="FR" />}
                        <span className="text-xs text-slate-400">{sub.product_count} products</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0 opacity-70 group-hover:opacity-100 transition">
                      <button onClick={() => handleEdit(sub)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition">Edit</button>
                      <button onClick={() => handleDelete(sub)} className="rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm self-start sticky top-4">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="font-semibold text-slate-900">{editing ? 'Edit Subcategory' : 'Add Subcategory'}</h3>
              {editing && <p className="mt-0.5 text-xs text-slate-400">Editing: <span className="font-semibold text-slate-600">{editing.name}</span></p>}
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Parent category */}
              <div>
                <label className={lbl}>Parent Category <span className="text-red-500 normal-case font-normal">*required</span></label>
                <select value={form.category_id} onChange={set('category_id')} className={inp}>
                  <option value="">Select a category…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Names */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Subcategory Name</p>
                <div>
                  <label className={lbl}>English <span className="text-red-500 normal-case font-normal">*required</span></label>
                  <input value={form.name} onChange={set('name')} placeholder="e.g. Screws" className={inp} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}><LangBadge lang="RW" /> &nbsp;Kinyarwanda</label>
                    <input value={form.name_rw} onChange={set('name_rw')} placeholder="e.g. Ingata" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}><LangBadge lang="FR" /> &nbsp;French</label>
                    <input value={form.name_fr} onChange={set('name_fr')} placeholder="e.g. Vis" className={inp} />
                  </div>
                </div>
              </div>

              {/* Descriptions */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</p>
                <div>
                  <label className={lbl}>English</label>
                  <textarea rows={2} value={form.description} onChange={set('description')} placeholder="Brief description…" className={inp} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}><LangBadge lang="RW" /></label>
                    <textarea rows={2} value={form.description_rw} onChange={set('description_rw')} placeholder="Ibisobanuro…" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}><LangBadge lang="FR" /></label>
                    <textarea rows={2} value={form.description_fr} onChange={set('description_fr')} placeholder="Description…" className={inp} />
                  </div>
                </div>
              </div>

              {/* Image */}
              <div>
                <label className={lbl}>Image</label>
                <div className="mt-1.5 flex items-start gap-3">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="h-16 w-16 flex-shrink-0 rounded-xl object-cover border border-slate-200" />
                  ) : (
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 text-xl">🖼️</div>
                  )}
                  <div className="flex-1">
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange}
                      className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold hover:file:bg-slate-200 transition" />
                    {imagePreview && <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ''; }} className="mt-1 text-xs text-red-500 hover:text-red-700">Remove</button>}
                  </div>
                </div>
              </div>

              {error && <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition">
                  {saving ? 'Saving…' : editing ? 'Update Subcategory' : 'Create Subcategory'}
                </button>
                {editing && <button type="button" onClick={reset} className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">Cancel</button>}
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
