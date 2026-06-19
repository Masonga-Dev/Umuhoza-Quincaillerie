import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

const fc = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100';
const lc = 'block text-sm font-medium text-slate-700';

export default function AdminAddProduct() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [form, setForm] = useState({
    category_id: '', subcategory_id: '',
    brand: '',
    name: '', name_rw: '', name_fr: '',
    description: '', description_rw: '', description_fr: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    API.get('/categories').then(r => setCategories(r.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (!form.category_id) { setSubcategories([]); setForm(p => ({ ...p, subcategory_id: '' })); return; }
    API.get('/subcategories', { params: { category_id: form.category_id } })
      .then(r => setSubcategories(r.data || []))
      .catch(console.error);
  }, [form.category_id]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Product name (English) is required.');
    if (!form.category_id) return setError('Please select a category.');
    setError(''); setSaving(true);
    try {
      const res = await API.post('/products', form);
      navigate(`/admin/products/${res.data.id}/edit?tab=Variants`);
    } catch (e) { setError(e?.response?.data?.message || 'Could not create product.'); }
    finally { setSaving(false); }
  };

  return (
    <AdminLayout currentPage="/admin/products/add">
      <div className="space-y-6">
        <button onClick={() => navigate('/admin/products')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
          ← Back to Products
        </button>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">Add New Product</h2>
          <p className="mt-1 text-sm text-slate-500">
            Fill in the basic details. Prices are set per-variant after creation.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <svg className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Category */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Category</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={lc}>Category <span className="text-red-500">*</span></label>
                <select required value={form.category_id}
                  onChange={e => { set('category_id')(e); setForm(p => ({ ...p, subcategory_id: '' })); }}
                  className={fc}>
                  <option value="">Select category…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lc}>Subcategory <span className="text-slate-400 font-normal">(optional)</span></label>
                <select value={form.subcategory_id} onChange={set('subcategory_id')} className={fc}
                  disabled={!form.category_id || !subcategories.length}>
                  <option value="">{!form.category_id ? 'Select category first' : subcategories.length ? 'Select subcategory…' : 'No subcategories'}</option>
                  {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Product Identity */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Product Identity</h3>
            <div>
              <label className={lc}>Brand <span className="text-slate-400 font-normal">(optional)</span></label>
              <input value={form.brand} onChange={set('brand')}
                placeholder="e.g. Simba, Cimerwa, Twiga, Ameki" className={fc} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={lc}>Name (English) <span className="text-red-500">*</span></label>
                <input required value={form.name} onChange={set('name')} placeholder="e.g. Interior Paint" className={fc} />
              </div>
              <div>
                <label className={lc}>Name (Kinyarwanda) <span className="text-slate-400 font-normal">(optional)</span></label>
                <input value={form.name_rw} onChange={set('name_rw')} placeholder="Izina mu Kinyarwanda" className={fc} />
              </div>
              <div>
                <label className={lc}>Name (French) <span className="text-slate-400 font-normal">(optional)</span></label>
                <input value={form.name_fr} onChange={set('name_fr')} placeholder="Nom en français" className={fc} />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Description <span className="text-slate-300 font-normal normal-case tracking-normal">(optional)</span>
            </h3>
            <div>
              <label className={lc}>English</label>
              <textarea rows={3} value={form.description} onChange={set('description')} placeholder="Describe the product…" className={fc} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={lc}>Kinyarwanda</label>
                <textarea rows={2} value={form.description_rw} onChange={set('description_rw')} placeholder="Ibisobanuro by'igicuruzwa…" className={fc} />
              </div>
              <div>
                <label className={lc}>French</label>
                <textarea rows={2} value={form.description_fr} onChange={set('description_fr')} placeholder="Description du produit…" className={fc} />
              </div>
            </div>
          </div>

          {/* What's next */}
          <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
            <svg className="h-5 w-5 flex-shrink-0 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
            </svg>
            <div>
              <p className="text-sm font-semibold text-blue-800">After creating the product:</p>
              <ol className="mt-1 list-decimal list-inside space-y-0.5 text-sm text-blue-700">
                <li>Add variants — set color, size/weight, unit, and price per variant</li>
                <li>Upload images per variant (e.g. Red vs Blue)</li>
                <li>Record a purchase to add stock</li>
              </ol>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button type="submit" disabled={saving}
              className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Creating…' : 'Create Product → Add Variants'}
            </button>
            <button type="button" onClick={() => navigate('/admin/products')}
              className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
          </div>

        </form>
      </div>
    </AdminLayout>
  );
}
