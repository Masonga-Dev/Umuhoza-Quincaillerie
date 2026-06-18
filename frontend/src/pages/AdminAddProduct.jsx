import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

const fieldCls = 'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100';
const labelCls = 'block text-sm font-medium text-slate-700';

export default function AdminAddProduct() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [form, setForm] = useState({
    category_id: '', subcategory_id: '',
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
    setError(''); setSaving(true);
    try {
      const res = await API.post('/products', form);
      navigate(`/admin/products/${res.data.id}/edit?tab=Images`);
    } catch (e) { setError(e?.response?.data?.message || 'Could not create product'); }
    finally { setSaving(false); }
  };

  return (
    <AdminLayout currentPage="/admin/products/add">
      <div className="space-y-6">
        <button onClick={() => navigate('/admin/products')} className="text-sm font-medium text-slate-500 hover:text-slate-900">← Back to Products</button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Add New Product</h2>
          <p className="mt-1 text-sm text-slate-500">After creating, add product images then set up variants with prices. Stock is added via Purchases.</p>
        </div>

        {error && <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {/* Category + Subcategory */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Category <span className="text-red-500">*</span></label>
              <select required value={form.category_id} onChange={e => { set('category_id')(e); setForm(p => ({ ...p, subcategory_id: '' })); }} className={fieldCls}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Subcategory</label>
              <select value={form.subcategory_id} onChange={set('subcategory_id')} className={fieldCls} disabled={!form.category_id || !subcategories.length}>
                <option value="">{form.category_id ? (subcategories.length ? 'Select subcategory (optional)' : 'No subcategories') : 'Select category first'}</option>
                {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Product Name (multilingual) */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Product Name</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls}>English <span className="text-red-500">*</span></label>
                <input required value={form.name} onChange={set('name')} placeholder="e.g. Ameki Interior Paint" className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Kinyarwanda</label>
                <input value={form.name_rw} onChange={set('name_rw')} placeholder="Izina mu Kinyarwanda" className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>French</label>
                <input value={form.name_fr} onChange={set('name_fr')} placeholder="Nom en français" className={fieldCls} />
              </div>
            </div>
          </div>

          {/* Description (multilingual) */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</p>
            <div>
              <label className={labelCls}>English</label>
              <textarea rows={3} value={form.description} onChange={set('description')} placeholder="Describe the product…" className={fieldCls} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Kinyarwanda</label>
                <textarea rows={3} value={form.description_rw} onChange={set('description_rw')} placeholder="Ibisobanuro by'igicuruzwa…" className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>French</label>
                <textarea rows={3} value={form.description_fr} onChange={set('description_fr')} placeholder="Description du produit…" className={fieldCls} />
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-800">Next steps after creating:</p>
            <ol className="mt-2 list-decimal list-inside space-y-1 text-sm text-blue-700">
              <li>Upload product images (Images tab)</li>
              <li>Add variants — color, size, SKU, and prices (Variants tab)</li>
              <li>Record a purchase to add stock (Purchases page)</li>
            </ol>
          </div>

          <button type="submit" disabled={saving}
            className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Creating…' : 'Create Product & Continue →'}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
