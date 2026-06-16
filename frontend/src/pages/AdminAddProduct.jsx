import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

const fieldCls = 'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100';
const labelCls = 'block text-sm font-medium text-slate-700';

function genSKU() { return 'UMU-' + Math.random().toString(36).toUpperCase().slice(2, 8); }

export default function AdminAddProduct() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    category_id: '', name: '', name_rw: '', name_fr: '',
    sku: genSKU(), description: '', description_rw: '', description_fr: '',
    selling_price: '', cost_price: '', stock_quantity: 0, minimum_stock: 5,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('umuhoza_token');
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    API.get('/categories').then(r => setCategories(r.data || [])).catch(console.error);
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const res = await API.post('/products', form, { headers: { Authorization: `Bearer ${token}` } });
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
          <p className="mt-1 text-sm text-slate-500">After creating, you'll be taken to upload images and add variants.</p>
        </div>

        {error && <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {/* Category + SKU */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Category <span className="text-red-500">*</span></label>
              <select required value={form.category_id} onChange={set('category_id')} className={fieldCls}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>SKU <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <input required value={form.sku} onChange={set('sku')} className={fieldCls} />
                <button type="button" onClick={() => setForm(p => ({ ...p, sku: genSKU() }))}
                  className="mt-2 flex-shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                  Gen
                </button>
              </div>
            </div>
          </div>

          {/* Product Name (multilingual) */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Product Name</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls}>English <span className="text-red-500">*</span></label>
                <input required value={form.name} onChange={set('name')} placeholder="e.g. Portland Cement" className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Kinyarwanda</label>
                <input value={form.name_rw} onChange={set('name_rw')} placeholder="e.g. Sima ya Portland" className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>French</label>
                <input value={form.name_fr} onChange={set('name_fr')} placeholder="e.g. Ciment Portland" className={fieldCls} />
              </div>
            </div>
          </div>

          {/* Pricing + Stock */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><label className={labelCls}>Selling Price (RWF)</label><input type="number" min="0" value={form.selling_price} onChange={set('selling_price')} className={fieldCls} /></div>
            <div><label className={labelCls}>Purchase Price (RWF)</label><input type="number" min="0" value={form.cost_price} onChange={set('cost_price')} className={fieldCls} /></div>
            <div><label className={labelCls}>Stock Quantity</label><input type="number" min="0" value={form.stock_quantity} onChange={set('stock_quantity')} className={fieldCls} /></div>
            <div><label className={labelCls}>Minimum Stock</label><input type="number" min="0" value={form.minimum_stock} onChange={set('minimum_stock')} className={fieldCls} /></div>
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

          <button type="submit" disabled={saving}
            className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Creating…' : 'Create Product & Continue →'}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
