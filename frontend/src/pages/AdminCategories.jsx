import { useEffect, useRef, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const inp = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100';
const lbl = 'block text-xs font-semibold uppercase tracking-wide text-slate-500';

const EMPTY = { name: '', name_rw: '', name_fr: '', description: '', description_rw: '', description_fr: '' };

function LangBadge({ lang }) {
  const map = { EN: 'bg-blue-100 text-blue-700', RW: 'bg-emerald-100 text-emerald-700', FR: 'bg-violet-100 text-violet-700' };
  return <span className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none ${map[lang]}`}>{lang}</span>;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = () => {
    setLoading(true);
    API.get('/categories')
      .then(r => setCategories(r.data || []))
      .catch(() => setError('Unable to load categories.'))
      .finally(() => setLoading(false));
  };

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const reset = () => {
    setEditing(null);
    setForm(EMPTY);
    setImageFile(null);
    setImagePreview(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleImageChange = e => {
    const f = e.target.files?.[0];
    if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim()) return setError('English name is required.');
    setError(''); setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (imageFile) data.append('image', imageFile);
      if (editing?.image_path) data.append('existing_image_path', editing.image_path);

      if (editing) {
        await API.put(`/categories/${editing.id}`, data);
      } else {
        await API.post('/categories', data);
      }
      reset();
      fetchCategories();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save category.');
    } finally { setSaving(false); }
  };

  const handleEdit = cat => {
    setEditing(cat);
    setForm({
      name: cat.name || '',
      name_rw: cat.name_rw || '',
      name_fr: cat.name_fr || '',
      description: cat.description || '',
      description_rw: cat.description_rw || '',
      description_fr: cat.description_fr || '',
    });
    setImagePreview(cat.image_path ? `${BACKEND}/${cat.image_path}` : null);
    setImageFile(null);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async cat => {
    if (!window.confirm(`Delete category '${cat.name}'?`)) return;
    try {
      await API.delete(`/categories/${cat.id}`);
      fetchCategories();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to delete category.');
    }
  };

  return (
    <AdminLayout currentPage="/admin/products/categories">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Categories</h2>
          <p className="mt-1 text-slate-500 text-sm">Manage product categories with English, Kinyarwanda, and French names and descriptions.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* ── Category List ───────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="font-semibold text-slate-900">All Categories</h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{categories.length}</span>
            </div>

            {loading ? (
              <div className="flex h-40 items-center justify-center text-slate-400 text-sm">Loading…</div>
            ) : categories.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-slate-400">
                <span className="text-4xl">📦</span>
                <p className="text-sm">No categories yet. Add one →</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-start gap-4 p-4 hover:bg-slate-50 transition group">
                    {/* Thumbnail */}
                    {cat.image_path ? (
                      <img
                        src={`${BACKEND}/${cat.image_path}`}
                        alt={cat.name}
                        className="h-16 w-16 flex-shrink-0 rounded-xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-3xl select-none border border-slate-200">
                        📦
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-semibold text-slate-900 truncate">{cat.name}</p>
                        {cat.name_rw && <LangBadge lang="RW" />}
                        {cat.name_fr && <LangBadge lang="FR" />}
                      </div>
                      {(cat.name_rw || cat.name_fr) && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {[cat.name_rw && `${cat.name_rw}`, cat.name_fr && `${cat.name_fr}`].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {cat.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-snug">{cat.description}</p>
                      )}
                      {(cat.description_rw || cat.description_fr) && (
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                          {cat.description_rw && (
                            <span className="text-xs text-emerald-600 line-clamp-1"><span className="font-semibold">RW:</span> {cat.description_rw}</span>
                          )}
                          {cat.description_fr && (
                            <span className="text-xs text-violet-600 line-clamp-1"><span className="font-semibold">FR:</span> {cat.description_fr}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0 opacity-70 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Add / Edit Form ─────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm self-start sticky top-4">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="font-semibold text-slate-900">{editing ? 'Edit Category' : 'Add New Category'}</h3>
              {editing && (
                <p className="mt-0.5 text-xs text-slate-400">Editing: <span className="font-semibold text-slate-600">{editing.name}</span></p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">

              {/* Names */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  Category Name
                </p>
                <div>
                  <label className={lbl}>English <span className="text-red-500 normal-case font-normal">*required</span></label>
                  <input value={form.name} onChange={set('name')} placeholder="e.g. Tools" className={inp} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}><LangBadge lang="RW" /> &nbsp;Kinyarwanda</label>
                    <input value={form.name_rw} onChange={set('name_rw')} placeholder="e.g. Ibikoresho" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}><LangBadge lang="FR" /> &nbsp;French</label>
                    <input value={form.name_fr} onChange={set('name_fr')} placeholder="e.g. Outils" className={inp} />
                  </div>
                </div>
              </div>

              {/* Descriptions */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Description <span className="normal-case font-normal text-slate-400">(shown on customer interface)</span>
                </p>
                <div>
                  <label className={lbl}>English</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={set('description')}
                    placeholder="Brief description in English…"
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}><LangBadge lang="RW" /> &nbsp;Kinyarwanda</label>
                  <textarea
                    rows={2}
                    value={form.description_rw}
                    onChange={set('description_rw')}
                    placeholder="Ibisobanuro mu Kinyarwanda…"
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}><LangBadge lang="FR" /> &nbsp;French</label>
                  <textarea
                    rows={2}
                    value={form.description_fr}
                    onChange={set('description_fr')}
                    placeholder="Description en français…"
                    className={inp}
                  />
                </div>
              </div>

              {/* Image */}
              <div>
                <label className={lbl}>Category Image</label>
                <div className="mt-1.5 flex items-start gap-3">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="h-20 w-20 flex-shrink-0 rounded-xl object-cover border border-slate-200" />
                  ) : (
                    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 text-2xl">
                      🖼️
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200 transition"
                    />
                    <p className="mt-1 text-xs text-slate-400">JPG, PNG or WebP. Recommended: 400×300px.</p>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                        className="mt-1 text-xs text-red-500 hover:text-red-700"
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition"
                >
                  {saving ? 'Saving…' : editing ? 'Update Category' : 'Create Category'}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
