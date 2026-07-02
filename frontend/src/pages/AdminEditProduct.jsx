import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://umuhoza-backend.onrender.com';
const imgUrl = p => !p ? '' : p.startsWith('http') ? p : `${BACKEND}/${p}`;
const TABS = ['Details', 'Images', 'Variants'];
const fc = 'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100';
const lc = 'block text-sm font-medium text-slate-700';

function determineStatus(qty, min = 5) {
  const q = Number(qty ?? 0), m = Number(min ?? 5);
  if (q <= 0) return 'Out of Stock';
  if (q <= m) return 'Low Stock';
  return 'In Stock';
}

// ── Details Tab ───────────────────────────────────────────────────────────────
function DetailsTab({ product, categories, onSaved }) {
  const [form, setForm] = useState({
    category_id: product.category_id || '',
    subcategory_id: product.subcategory_id || '',
    sku: product.sku || '',
    brand: product.brand || '',
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
          <label className={lc}>Category *</label>
          <select value={form.category_id}
            onChange={e => { set('category_id')(e); setForm(p => ({ ...p, subcategory_id: '' })); }}
            className={fc}>
            <option value="">Select category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className={lc}>Subcategory</label>
          <select value={form.subcategory_id} onChange={set('subcategory_id')} className={fc}
            disabled={!form.category_id || !subcategories.length}>
            <option value="">{form.category_id ? (subcategories.length ? 'Select subcategory' : 'No subcategories') : 'Select category first'}</option>
            {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className={lc}>SKU</label>
          <p className="mt-2 rounded-xl border border-slate-100 bg-slate-100 px-4 py-3 font-mono text-sm text-slate-500 select-all">
            {form.sku || <span className="italic text-slate-400">auto-generated</span>}
          </p>
        </div>
      </div>

      {/* Brand + Name */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Product Identity</p>
        <div>
          <label className={lc}>Brand <span className="font-normal text-slate-400">(optional)</span></label>
          <input value={form.brand} onChange={set('brand')}
            placeholder="e.g. Simba, Cimerwa, Twiga, Ameki" className={fc} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={lc}>Name (English) *</label>
            <input value={form.name} onChange={set('name')} className={fc} />
          </div>
          <div>
            <label className={lc}>Name (Kinyarwanda)</label>
            <input value={form.name_rw} onChange={set('name_rw')} placeholder="Izina mu Kinyarwanda" className={fc} />
          </div>
          <div>
            <label className={lc}>Name (French)</label>
            <input value={form.name_fr} onChange={set('name_fr')} placeholder="Nom en français" className={fc} />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</p>
        <div>
          <label className={lc}>English</label>
          <textarea rows={3} value={form.description} onChange={set('description')} className={fc} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={lc}>Kinyarwanda</label>
            <textarea rows={2} value={form.description_rw} onChange={set('description_rw')} placeholder="Ibisobanuro…" className={fc} />
          </div>
          <div>
            <label className={lc}>French</label>
            <textarea rows={2} value={form.description_fr} onChange={set('description_fr')} placeholder="Description…" className={fc} />
          </div>
        </div>
      </div>

      {error && <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={saving}
          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        {saved && <span className="text-sm font-medium text-emerald-600">✓ Saved</span>}
      </div>
    </div>
  );
}

// ── Images Tab ────────────────────────────────────────────────────────────────
function ImagesTab({ product }) {
  const [images, setImages] = useState(product.images || []);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleUpload = async e => {
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

  const handleSetPrimary = async imgId => {
    try {
      await API.put(`/products/${product.id}/images/${imgId}/primary`, {});
      setImages(prev => prev.map(i => ({ ...i, is_primary: i.id === imgId ? 1 : 0 })));
    } catch (e) { console.error(e); }
  };

  const handleDelete = async imgId => {
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
          <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V21h18v-4.5M12 3v12m0 0l-3-3m3 3l3-3"/>
          </svg>
          <span className="text-sm text-slate-500">{uploading ? 'Uploading…' : 'Click to upload product image'}</span>
        </label>
      </div>
      {images.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map(img => (
            <div key={img.id} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <img src={imgUrl(img.image_path)} alt="" className="h-36 w-full object-cover" />
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

// ── Variant Card ──────────────────────────────────────────────────────────────
function VariantCard({ variant: v, index, onEdit, onDelete }) {
  const cost = Number(v.cost_price || 0);
  const sell = Number(v.selling_price || 0);
  const profit = sell - cost;
  const showProfit = cost > 0 && sell > 0;
  const fmt = n => Number(n || 0).toLocaleString('en-RW');
  const sc = s =>
    s === 'In Stock' ? 'bg-emerald-100 text-emerald-700' :
    s === 'Low Stock' ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-700';

  const descriptor = [
    v.color,
    [v.size, v.unit].filter(Boolean).join(' '),
  ].filter(Boolean).join(' / ');

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Image */}
      {v.image_path ? (
        <img src={imgUrl(v.image_path)} alt={descriptor || 'Variant'}
          className="h-36 w-full object-cover" />
      ) : (
        <div className="flex h-20 w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
          <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Variant #{index + 1}</p>
            <p className="mt-0.5 font-semibold text-slate-900 leading-snug">
              {descriptor || <span className="italic text-slate-400">Base variant</span>}
            </p>
            <p className="mt-0.5 truncate font-mono text-xs text-slate-400">{v.sku}</p>
          </div>
          <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${sc(v.status)}`}>
            {v.status}
          </span>
        </div>

        {/* Price grid */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 rounded-xl border border-slate-100 bg-slate-50 text-center">
          <div className="px-1 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Cost</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-600">{fmt(v.cost_price)}</p>
          </div>
          <div className="px-1 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">Selling</p>
            <p className="mt-0.5 text-sm font-bold text-blue-600">{fmt(v.selling_price)}</p>
          </div>
          <div className="px-1 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">Profit</p>
            {showProfit ? (
              <p className={`mt-0.5 text-xs font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {profit >= 0 ? '+' : ''}{fmt(profit)}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-slate-300">—</p>
            )}
          </div>
        </div>

        {/* Stock */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Stock: <span className="font-bold text-slate-800">{v.stock_quantity}</span> units</span>
          <span className="text-slate-400">Min: {v.minimum_stock}</span>
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2">
          <button onClick={() => onEdit(v)}
            className="flex-1 rounded-xl border border-slate-200 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
            Edit
          </button>
          <button onClick={() => onDelete(v.id)}
            className="flex-1 rounded-xl border border-red-200 bg-red-50 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Variants Tab ──────────────────────────────────────────────────────────────
const EMPTY_V = { color: '', size: '', unit: '', selling_price: '', cost_price: '', minimum_stock: 5 };

function VariantsTab({ product, onVariantCountChange }) {
  const [variants, setVariants] = useState(product.variants || []);
  const [form, setForm] = useState(EMPTY_V);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileRef = useRef();
  const formRef = useRef();

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const updateVariants = next => { setVariants(next); onVariantCountChange?.(next.length); };

  const handleImageChange = e => {
    const f = e.target.files?.[0];
    if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
  };

  const removeImage = () => {
    setImageFile(null); setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSave = async () => {
    if (!form.selling_price || Number(form.selling_price) <= 0) {
      return setError('Selling price is required and must be greater than 0.');
    }
    setError(''); setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, String(v)));
      if (imageFile) {
        data.append('image', imageFile);
      } else if (editing?.image_path && imagePreview) {
        data.append('existing_image_path', editing.image_path);
      }

      if (editing) {
        const res = await API.put(`/products/${product.id}/variants/${editing.id}`, data);
        const newImagePath = res.data.image_path !== undefined ? res.data.image_path : editing.image_path;
        updateVariants(variants.map(v => v.id === editing.id
          ? { ...v, ...form, image_path: newImagePath, status: determineStatus(v.stock_quantity, form.minimum_stock) }
          : v));
      } else {
        const res = await API.post(`/products/${product.id}/variants`, data);
        updateVariants([...variants, {
          id: res.data.id, sku: res.data.sku, product_id: product.id,
          ...form, image_path: res.data.image_path || null,
          stock_quantity: 0, status: 'Out of Stock',
        }]);
      }
      setForm(EMPTY_V); setEditing(null); setImageFile(null); setImagePreview(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) { setError(e?.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleEdit = v => {
    setEditing(v);
    setForm({
      color: v.color || '',
      size: v.size || '',
      unit: v.unit || '',
      selling_price: v.selling_price || '',
      cost_price: v.cost_price || '',
      minimum_stock: v.minimum_stock || 5,
    });
    setImagePreview(v.image_path ? imgUrl(v.image_path) : null);
    setImageFile(null);
    if (fileRef.current) fileRef.current.value = '';
    setError('');
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const cancelEdit = () => {
    setEditing(null); setForm(EMPTY_V);
    setImageFile(null); setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
    setError('');
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this variant? This cannot be undone.')) return;
    try {
      await API.delete(`/products/${product.id}/variants/${id}`);
      updateVariants(variants.filter(v => v.id !== id));
    } catch (e) { console.error(e); }
  };

  const fmt = n => Number(n || 0).toLocaleString('en-RW');
  const liveProfit = Number(form.selling_price || 0) - Number(form.cost_price || 0);
  const showLiveProfit = Number(form.selling_price) > 0 || Number(form.cost_price) > 0;
  const editingIndex = editing ? variants.findIndex(v => v.id === editing.id) : -1;

  return (
    <div className="space-y-5">

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
        <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
        </svg>
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Each variant = one configuration with its own price and image.</span>{' '}
          Example: Red 5kg and Blue 10kg are two variants.{' '}
          <span className="font-semibold">Stock comes only from Purchases — never entered here.</span>
        </p>
      </div>

      {/* Variant cards */}
      {variants.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {variants.map((v, i) => (
            <VariantCard key={v.id} variant={v} index={i} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-8 text-center">
          <p className="text-sm font-semibold text-amber-800">No variants yet — product has no selling price</p>
          <p className="mt-1 text-xs text-amber-600">Use the form below to add your first variant</p>
        </div>
      )}

      {/* Add / Edit form */}
      <div ref={formRef} className="scroll-mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        {/* Form header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h4 className="font-bold text-slate-800">
              {editing ? `Editing Variant #${editingIndex + 1}` : '+ New Variant'}
            </h4>
            <p className="mt-0.5 text-xs text-slate-400">
              SKU is auto-generated · Color, Size, and Unit are all optional
            </p>
          </div>
          {editing && (
            <button onClick={cancelEdit}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              ✕ Cancel
            </button>
          )}
        </div>

        {/* Fields grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={lc}>Color <span className="font-normal text-slate-400">(optional)</span></label>
            <input value={form.color} onChange={set('color')}
              placeholder="Red, White, Black…" className={fc} />
          </div>
          <div>
            <label className={lc}>Size / Weight / Length <span className="font-normal text-slate-400">(optional)</span></label>
            <input value={form.size} onChange={set('size')}
              placeholder="10, 5, 2…" className={fc} />
          </div>
          <div>
            <label className={lc}>Unit <span className="font-normal text-slate-400">(optional)</span></label>
            <input value={form.unit} onChange={set('unit')}
              placeholder="kg, liter, m, piece, bag…" className={fc} />
          </div>
          <div>
            <label className={lc}>Cost Price (RWF) <span className="font-normal text-slate-400">(optional)</span></label>
            <input type="number" min="0" step="any" value={form.cost_price} onChange={set('cost_price')}
              placeholder="Your purchase cost" className={fc} />
          </div>
          <div>
            <label className={lc}>Selling Price (RWF) <span className="text-red-500">*</span></label>
            <input type="number" min="1" step="any" value={form.selling_price} onChange={set('selling_price')}
              placeholder="Price for customers" className={fc} />
          </div>
          <div>
            <label className={lc}>Low Stock Alert (qty)</label>
            <input type="number" min="0" value={form.minimum_stock} onChange={set('minimum_stock')} className={fc} />
          </div>
        </div>

        {/* Live profit preview */}
        {showLiveProfit && (
          <div className={`mt-4 flex items-center gap-3 rounded-xl border px-4 py-2.5 ${liveProfit >= 0 ? 'border-emerald-100 bg-emerald-50' : 'border-red-100 bg-red-50'}`}>
            <span className={`text-sm font-medium ${liveProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              Profit: <span className="font-bold">{liveProfit >= 0 ? '+' : ''}{fmt(liveProfit)} RWF</span>
            </span>
            {Number(form.selling_price) > 0 && Number(form.cost_price) > 0 && Number(form.selling_price) > Number(form.cost_price) && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                {Math.round((liveProfit / Number(form.selling_price)) * 100)}% margin
              </span>
            )}
          </div>
        )}

        {/* Variant image */}
        <div className="mt-5">
          <label className={lc}>
            Variant Image <span className="font-normal text-slate-400">(optional — show the right color per variant)</span>
          </label>
          <div className="mt-2 flex items-start gap-4">
            {imagePreview ? (
              <div className="relative flex-shrink-0">
                <img src={imagePreview} alt="Preview"
                  className="h-24 w-24 rounded-xl object-cover border border-slate-200" />
                <button type="button" onClick={removeImage}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white hover:bg-red-600">
                  ×
                </button>
              </div>
            ) : (
              <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-3xl text-slate-200">
                🖼️
              </div>
            )}
            <div className="flex-1">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200" />
              <p className="mt-1.5 text-xs text-slate-400">
                Each variant can have a different photo. E.g. Red paint vs Blue paint.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-5 flex gap-3">
          <button onClick={handleSave} disabled={saving}
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
            {saving ? 'Saving…' : editing ? 'Update Variant' : 'Save Variant'}
          </button>
          {editing && (
            <button onClick={cancelEdit}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [variantCount, setVariantCount] = useState(null);
  const activeTab = searchParams.get('tab') || 'Details';

  useEffect(() => {
    Promise.all([
      API.get(`/products/${id}`),
      API.get('/categories'),
    ])
      .then(([pRes, cRes]) => {
        setProduct(pRes.data);
        setCategories(cRes.data);
        setVariantCount(pRes.data.variants?.length ?? 0);
      })
      .catch(() => setError('Could not load product.'))
      .finally(() => setLoading(false));
  }, [id]);

  const setTab = tab => setSearchParams({ tab });
  const vCount = variantCount ?? product?.variants?.length ?? 0;

  return (
    <AdminLayout currentPage="/admin/products">
      <div className="space-y-6">
        <button onClick={() => navigate('/admin/products')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
          ← Back to Products
        </button>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">Edit Product</h2>
          {product && (
            <p className="mt-1 text-sm text-slate-500">
              {[product.brand, product.name].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {error && (
          <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {loading ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : product ? (
          <>
            {/* Tab bar */}
            <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              {TABS.map(tab => (
                <button key={tab} onClick={() => setTab(tab)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${activeTab === tab ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}>
                  {tab === 'Images'
                    ? `Images (${product.images?.length || 0})`
                    : tab === 'Variants'
                    ? (
                      <span className="flex items-center justify-center gap-1.5">
                        Variants ({vCount})
                        {vCount === 0 && <span className="h-2 w-2 rounded-full bg-amber-400" title="No variants — product has no price" />}
                      </span>
                    )
                    : tab}
                </button>
              ))}
            </div>

            {activeTab === 'Details' && (
              <DetailsTab product={product} categories={categories} onSaved={f => setProduct(p => ({ ...p, ...f }))} />
            )}
            {activeTab === 'Images' && <ImagesTab product={product} />}
            {activeTab === 'Variants' && (
              <VariantsTab product={product} onVariantCountChange={setVariantCount} />
            )}
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
