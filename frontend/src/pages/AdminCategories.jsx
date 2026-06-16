import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const fieldCls = 'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100';
const labelCls = 'block text-sm font-medium text-slate-700';

const EMPTY = { name: '', name_rw: '', name_fr: '', description: '' };

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const token = localStorage.getItem('umuhoza_token');

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = () => {
    API.get('/categories')
      .then(r => setCategories(r.data))
      .catch(() => setError('Unable to load categories.'))
      .finally(() => setLoading(false));
  };

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const resetForm = () => {
    setEditingCategory(null);
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
    setError('');
    if (!form.name.trim()) return setError('English name is required.');
    setSaving(true);
    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('name_rw', form.name_rw);
      data.append('name_fr', form.name_fr);
      data.append('description', form.description);
      if (imageFile) data.append('image', imageFile);
      if (editingCategory?.image_path) data.append('existing_image_path', editingCategory.image_path);

      if (editingCategory) {
        await axios.put(`${BACKEND}/api/categories/${editingCategory.id}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${BACKEND}/api/categories`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save category.');
    } finally { setSaving(false); }
  };

  const handleEdit = cat => {
    setEditingCategory(cat);
    setForm({ name: cat.name || '', name_rw: cat.name_rw || '', name_fr: cat.name_fr || '', description: cat.description || '' });
    setImagePreview(cat.image_path ? `${BACKEND}/${cat.image_path}` : null);
    setImageFile(null);
    setError('');
  };

  const handleDelete = async cat => {
    if (!window.confirm(`Delete category '${cat.name}'?`)) return;
    try {
      await API.delete(`/categories/${cat.id}`, { headers: { Authorization: `Bearer ${token}` } });
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
          <p className="mt-2 text-slate-600">Manage product categories with English, Kinyarwanda, and French names.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* List */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Category List</h3>
            {loading ? (
              <p className="mt-4 text-slate-500">Loading…</p>
            ) : categories.length ? (
              <div className="mt-4 space-y-3">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    {cat.image_path ? (
                      <img src={`${BACKEND}/${cat.image_path}`} alt={cat.name} className="h-14 w-14 flex-shrink-0 rounded-xl object-cover border border-slate-200" />
                    ) : (
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-400 text-xl">📦</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">{cat.name}</p>
                      {(cat.name_rw || cat.name_fr) && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {[cat.name_rw && `RW: ${cat.name_rw}`, cat.name_fr && `FR: ${cat.name_fr}`].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {cat.description && <p className="text-sm text-slate-500 mt-0.5 truncate">{cat.description}</p>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleEdit(cat)} className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">Edit</button>
                      <button onClick={() => handleDelete(cat)} className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-slate-500">No categories yet. Add one →</p>
            )}
          </div>

          {/* Form */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm self-start sticky top-4">
            <h3 className="text-xl font-semibold text-slate-900">{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Names */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Category Name</p>
                <div>
                  <label className={labelCls}>English <span className="text-red-500">*</span></label>
                  <input value={form.name} onChange={set('name')} placeholder="e.g. Tools" className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>Kinyarwanda</label>
                  <input value={form.name_rw} onChange={set('name_rw')} placeholder="e.g. Ibikoresho" className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>French</label>
                  <input value={form.name_fr} onChange={set('name_fr')} placeholder="e.g. Outils" className={fieldCls} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={3} value={form.description} onChange={set('description')} placeholder="Optional description…" className={fieldCls} />
              </div>

              {/* Image */}
              <div>
                <label className={labelCls}>Category Image</label>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="mt-2 text-sm text-slate-700 w-full" />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="mt-2 h-24 w-full rounded-xl object-cover border border-slate-200" />
                )}
              </div>

              {error && <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

              <div className="flex gap-3">
                <button type="submit" disabled={saving}
                  className="flex-1 rounded-full bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70">
                  {saving ? 'Saving…' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
                {editingCategory && (
                  <button type="button" onClick={resetForm}
                    className="rounded-full bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-300">
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

export default AdminCategories;
