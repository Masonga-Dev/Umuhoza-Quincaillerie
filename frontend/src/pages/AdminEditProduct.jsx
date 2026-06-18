import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const TABS = ['Details', 'Images', 'Variants'];

function fieldCls() { return 'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100'; }
function labelCls() { return 'block text-sm font-medium text-slate-700'; }

function determineStatus(qty, min = 5) {
  const q = Number(qty ?? 0), m = Number(min ?? 5);
  if (q <= 0) return 'Out of Stock';
  if (q <= m) return 'Low Stock';
  return 'In Stock';
}

function DetailsTab({ product, categories, onSaved }) {
  const [form, setForm] = useState({
    category_id: product.category_id || '',
    subcategory_id: product.subcategory_id || '',
    sku: product.sku || '',
    name: product.name || '',
    name_rw: product.name_rw || '',
    name_fr: product.name_fr || '',
    description: product.description || '',
    description_rw: product.description_rw || '',
    description_fr: product.description_fr || '',
  });
  const [subcategories, setSubcategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    if (!form.category_id) { setSubcategories([]); return; }
    API.get('/subcategories', { params: { category_id: form.category_id } })
      .then(r => setSubcategories(r.data || [])).catch(console.error);
  }, [form.category_id]);

  const handleSave = async () => {
    setError(''); setSaving(true);
    try {
      await API.put(`/products/${product.id}`, form);
      setSaved(true); setTimeout(() => setSaved(false), 3000);
      onSaved?.(form);
    } catch (e) { setError(e?.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      {/* Category + Subcategory + SKU */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelCls()}>Category *</label>
          <select value={form.category_id} onChange={e => { set('category_id')(e); setForm(p => ({ ...p, subcategory_id: '' })); }} className={fieldCls()}>
            <option value="">Select category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls()}>Subcategory</label>
          <select value={form.subcategory_id} onChange={set('subcategory_id')} className={fieldCls()} disabled={!form.category_id || !subcategories.length}>
            <option value="">{form.category_id ? (subcategories.length ? 'Select subcategory' : 'No subcategories') : 'Select category first'}</option>
            {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls()}>SKU</label>
          <p className="mt-2 rounded-xl border border-slate-100 bg-slate-100 px-4 py-3 font-mono text-sm text-slate-500 select-all">
            {form.sku || <span className="italic text-slate-400">auto-generated</span>}
          </p>
        </div>
      </div>

      {/* Product Name multilingual */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Product Name</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label className={labelCls()}>English *</label><input value={form.name} onChange={set('name')} className={fieldCls()} /></div>
          <div><label className={labelCls()}>Kinyarwanda</label><input value={form.name_rw} onChange={set('name_rw')} placeholder="Izina mu Kinyarwanda" className={fieldCls()} /></div>
          <div><label className={labelCls()}>French</label><input value={form.name_fr} onChange={set('name_fr')} placeholder="Nom en français" className={fieldCls()} /></div>
        </div>
      </div>

      {/* Description multilingual */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</p>
        <div>
          <label className={labelCls()}>English</label>
          <textarea rows={3} value={form.description} onChange={set('description')} className={fieldCls()} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls()}>Kinyarwanda</label>
            <textarea rows={3} value={form.description_rw} onChange={set('description_rw')} placeholder="Ibisobanuro…" className={fieldCls()} />
          </div>
          <div>
            <label className={labelCls()}>French</label>
            <textarea rows={3} value={form.description_fr} onChange={set('description_fr')} placeholder="Description…" className={fieldCls()} />
          </div>
        </div>
      </div>

      {error && <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={saving} className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        {saved && <span className="text-sm font-medium text-emerald-600">Saved!</span>}
      </div>
    </div>
  );
}

function ImagesTab({ product }) {
  const [images, setImages] = useState(product.images || []);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await API.post(`/products/${product.id}/images`, form);
      setImages(prev => [...prev, { id: res.data.id, image_path: res.data.image_path, is_primary: res.data.is_primary }]);
    } catch (e) { console.error(e); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handleSetPrimary = async (imgId) => {
    try {
      await API.put(`/products/${product.id}/images/${imgId}/primary`, {});
      setImages(prev => prev.map(i => ({ ...i, is_primary: i.id === imgId ? 1 : 0 })));
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (imgId) => {
    if (!window.confirm('Delete this image?')) return;
    try {
      await API.delete(`/products/${product.id}/images/${imgId}`);
      setImages(prev => prev.filter(i => i.id !== imgId));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-700">Upload Image</p>
        <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-4 transition hover:border-blue-400 hover:bg-blue-50">
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
          <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V21h18v-4.5M12 3v12m0 0l-3-3m3 3l3-3"/></svg>
          <span className="text-sm text-slate-500">{uploading ? 'Uploading…' : 'Click to upload'}</span>
        </label>
      </div>
      {images.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map(img => (
            <div key={img.id} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <img src={`${BACKEND}/${img.image_path}`} alt="" className="h-36 w-full object-cover" />
              {img.is_primary ? <div className="absolute top-2 left-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">Primary</div> : null}
              <div className="flex gap-1 p-2">
                {!img.is_primary && <button onClick={() => handleSetPrimary(img.id)} className="flex-1 rounded-lg bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">Set Primary</button>}
                <button onClick={() => handleDelete(img.id)} className="flex-1 rounded-lg bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">No images yet.</div>
      )}
    </div>
  );
}

const EMPTY_V = { color: '', size: '', selling_price: '', cost_price: '', minimum_stock: 5 };

function VariantsTab({ product }) {
  const [variants, setVariants] = useState(product.variants || []);
  const [form, setForm] = useState(EMPTY_V);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    setError(''); setSaving(true);
    try {
      if (editing) {
        await API.put(`/products/${product.id}/variants/${editing.id}`, form);
        setVariants(prev => prev.map(v => v.id === editing.id
          ? { ...v, ...form, status: determineStatus(v.stock_quantity, form.minimum_stock) }
          : v));
      } else {
        const res = await API.post(`/products/${product.id}/variants`, form);
        setVariants(prev => [...prev, { id: res.data.id, sku: res.data.sku, product_id: product.id, ...form, stock_quantity: 0, status: 'Out of Stock' }]);
      }
      setForm(EMPTY_V); setEditing(null);
    } catch (e) { setError(e?.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleEdit = v => {
    setEditing(v);
    setForm({ color: v.color || '', size: v.size || '', selling_price: v.selling_price || '', cost_price: v.cost_price || '', minimum_stock: v.minimum_stock || 5 });
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this variant?')) return;
    try {
      await API.delete(`/products/${product.id}/variants/${id}`);
      setVariants(prev => prev.filter(v => v.id !== id));
    } catch (e) { console.error(e); }
  };

  const sc = s => s === 'In Stock' ? 'bg-emerald-100 text-emerald-700' : s === 'Low Stock' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  const fmt = v => Number(v || 0).toLocaleString('en-RW');

  return (
    <div className="space-y-5">
      {/* Stock info banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4">
        <svg className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Stock is managed through Purchases.</span> To add stock for a variant, go to <span className="font-semibold">Purchases → Record Purchase</span> and select the product variant. Stock quantity cannot be set manually.
        </p>
      </div>

      {variants.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {['Color','Size','SKU','Cost Price','Selling Price','Stock','Status',''].map(h => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {variants.map(v => (
                  <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">{v.color || <span className="text-slate-300">—</span>}</td>
                    <td className="py-3 px-4">{v.size || <span className="text-slate-300">—</span>}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">{v.sku || <span className="text-slate-300">—</span>}</td>
                    <td className="py-3 px-4 text-slate-600">{fmt(v.cost_price)}</td>
                    <td className="py-3 px-4 font-semibold text-blue-600">{fmt(v.selling_price)}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                        {v.stock_quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${sc(v.status)}`}>{v.status}</span></td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(v)} className="text-xs font-semibold text-blue-600 hover:underline">Edit</button>
                        <button onClick={() => handleDelete(v.id)} className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 mb-4">{editing ? 'Edit Variant' : 'Add New Variant'}</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className={labelCls()}>Color</label><input value={form.color} onChange={set('color')} className={fieldCls()} placeholder="e.g. Red" /></div>
          <div><label className={labelCls()}>Size</label><input value={form.size} onChange={set('size')} className={fieldCls()} placeholder="e.g. 5kg" /></div>
          <div><label className={labelCls()}>Cost Price (RWF)</label><input type="number" min="0" value={form.cost_price} onChange={set('cost_price')} className={fieldCls()} /></div>
          <div><label className={labelCls()}>Selling Price (RWF)</label><input type="number" min="0" value={form.selling_price} onChange={set('selling_price')} className={fieldCls()} /></div>
          <div className="sm:col-span-2">
            <label className={labelCls()}>Low Stock Alert (qty)</label>
            <input type="number" min="0" value={form.minimum_stock} onChange={set('minimum_stock')} className={fieldCls()} />
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">SKU is auto-generated. Stock is read-only — updated via Purchases.</p>
        {error && <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
        <div className="mt-4 flex gap-3">
          <button onClick={handleSave} disabled={saving} className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Saving…' : editing ? 'Update Variant' : 'Add Variant'}
          </button>
          {editing && <button onClick={() => { setEditing(null); setForm(EMPTY_V); }} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>}
        </div>
      </div>
    </div>
  );
}

export default function AdminEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const activeTab = searchParams.get('tab') || 'Details';

  useEffect(() => {
    Promise.all([
      API.get(`/products/${id}`),
      API.get('/categories'),
    ])
      .then(([pRes, cRes]) => { setProduct(pRes.data); setCategories(cRes.data); })
      .catch(() => setError('Could not load product.'))
      .finally(() => setLoading(false));
  }, [id]);

  const setTab = tab => setSearchParams({ tab });

  return (
    <AdminLayout currentPage="/admin/products">
      <div className="space-y-6">
        <button onClick={() => navigate('/admin/products')} className="text-sm font-medium text-slate-500 hover:text-slate-900">← Back to Products</button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Edit Product</h2>
          {product && <p className="mt-1 text-sm text-slate-500">{product.name}</p>}
        </div>
        {error && <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {loading ? (
          <div className="flex h-40 items-center justify-center rounded-2xl bg-white border border-slate-200">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"/>
          </div>
        ) : product ? (
          <>
            <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              {TABS.map(tab => (
                <button key={tab} onClick={() => setTab(tab)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${activeTab === tab ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}>
                  {tab === 'Images' ? `Images (${product.images?.length || 0})` : tab === 'Variants' ? `Variants (${product.variants?.length || 0})` : tab}
                </button>
              ))}
            </div>
            {activeTab === 'Details' && <DetailsTab product={product} categories={categories} onSaved={f => setProduct(p => ({ ...p, ...f }))} />}
            {activeTab === 'Images' && <ImagesTab product={product} />}
            {activeTab === 'Variants' && <VariantsTab product={product} />}
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
