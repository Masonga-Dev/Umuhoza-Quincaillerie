import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const EMPTY = { category_id: '', name: '', name_rw: '', name_fr: '', description: '', description_rw: '', description_fr: '' };

const PALETTE = [
  { bg: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-rose-100', text: 'text-rose-700' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700' },
];

const LANGS = [
  { code: 'en', label: 'English', nameKey: 'name', descKey: 'description' },
  { code: 'rw', label: 'Kinyarwanda', badge: 'RW', nameKey: 'name_rw', descKey: 'description_rw', badgeCls: 'bg-emerald-100 text-emerald-700' },
  { code: 'fr', label: 'Français', badge: 'FR', nameKey: 'name_fr', descKey: 'description_fr', badgeCls: 'bg-violet-100 text-violet-700' },
];

function timeAgo(d) {
  if (!d) return '';
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (days === 0) return 'Updated today';
  if (days === 1) return 'Updated 1 day ago';
  if (days < 7) return `Updated ${days} days ago`;
  const w = Math.floor(days / 7);
  if (w < 5) return `Updated ${w} week${w !== 1 ? 's' : ''} ago`;
  const m = Math.floor(days / 30);
  return `Updated ${m} month${m !== 1 ? 's' : ''} ago`;
}

export default function AdminSubcategories() {
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [allSubs, setAllSubs] = useState([]);
  const [filterCatId, setFilterCatId] = useState(searchParams.get('category') || '');
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [activeLang, setActiveLang] = useState('en');
  const fileRef = useRef();

  useEffect(() => {
    API.get('/categories').then(r => setCategories(r.data || [])).catch(console.error);
    API.get('/subcategories').then(r => setAllSubs(r.data || [])).catch(console.error);
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

  const refreshAllSubs = () => API.get('/subcategories').then(r => setAllSubs(r.data || [])).catch(console.error);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const reset = () => {
    setEditing(null); setForm(EMPTY); setImageFile(null); setImagePreview(null);
    setError(''); setShowForm(false); setActiveLang('en');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleImageChange = e => {
    const f = e.target.files?.[0];
    if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.category_id) return setError('Please select a parent category.');
    if (!form.name.trim()) return setError('English name is required.');
    setError(''); setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (imageFile) data.append('image', imageFile);
      if (!imageFile && imagePreview && editing?.image_path) data.append('existing_image_path', editing.image_path);
      if (editing) { await API.put(`/subcategories/${editing.id}`, data); }
      else { await API.post('/subcategories', data); }
      reset(); fetchSubcategories(); refreshAllSubs();
    } catch (err) { setError(err?.response?.data?.message || 'Could not save subcategory.'); }
    finally { setSaving(false); }
  };

  const handleEdit = sub => {
    setEditing(sub);
    setForm({
      category_id: sub.category_id, name: sub.name || '', name_rw: sub.name_rw || '', name_fr: sub.name_fr || '',
      description: sub.description || '', description_rw: sub.description_rw || '', description_fr: sub.description_fr || '',
    });
    setImagePreview(sub.image_path ? `${BACKEND}/${sub.image_path}` : null);
    setImageFile(null); setError(''); setActiveLang('en'); setShowForm(true);
  };

  const handleDelete = async sub => {
    if (!window.confirm(`Delete subcategory "${sub.name}"? Products will be kept but un-linked.`)) return;
    try {
      await API.delete(`/subcategories/${sub.id}`);
      fetchSubcategories(); refreshAllSubs();
    } catch (err) { setError(err?.response?.data?.message || 'Could not delete.'); }
  };

  const totalProducts = allSubs.reduce((s, sub) => s + Number(sub.product_count || 0), 0);
  const parentCatCount = new Set(allSubs.map(s => s.category_id)).size;
  const lang = LANGS.find(l => l.code === activeLang) || LANGS[0];

  const filtered = subcategories.filter(sub =>
    !search || [sub.name, sub.name_rw, sub.name_fr, sub.category_name].some(v => (v || '').toLowerCase().includes(search.toLowerCase()))
  );

  const filterCatName = filterCatId ? (categories.find(c => String(c.id) === String(filterCatId))?.name || '') : '';

  return (
    <AdminLayout currentPage="/admin/products/subcategories">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Subcategories</h2>
            <p className="mt-1 text-sm text-slate-500">Organise products within categories using subcategories.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setEditing(null); setForm(EMPTY); setError(''); setActiveLang('en'); setShowForm(true); }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition">
              <span className="text-lg leading-none">+</span> Add Subcategory
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              label: 'Total Subcategories', value: allSubs.length,
              icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h7"/></svg>,
              iconBg: 'bg-blue-100', iconColor: 'text-blue-600', valColor: 'text-blue-600', border: 'border-blue-100',
            },
            {
              label: 'Parent Categories', value: parentCatCount,
              icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
              iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', valColor: 'text-emerald-600', border: 'border-emerald-100',
            },
            {
              label: 'Total Products', value: totalProducts,
              icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
              iconBg: 'bg-violet-100', iconColor: 'text-violet-600', valColor: 'text-violet-600', border: 'border-violet-100',
            },
          ].map(s => (
            <div key={s.label} className={`flex items-center gap-4 rounded-2xl border ${s.border} bg-white p-5 shadow-sm`}>
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${s.iconBg} ${s.iconColor}`}>{s.icon}</div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
                <p className={`text-3xl font-extrabold leading-none mt-0.5 ${s.valColor}`}>{s.value.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1" style={{ minWidth: 220 }}>
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subcategories…"
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"/>
          </div>
          <select value={filterCatId} onChange={e => setFilterCatId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 transition">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
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

        {filterCatName && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Showing subcategories in:</span>
            <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">{filterCatName}</span>
            <button onClick={() => setFilterCatId('')} className="text-xs text-slate-400 hover:text-red-500 transition">✕ Clear</button>
          </div>
        )}

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
            <span className="text-5xl select-none">📂</span>
            <p className="text-sm font-semibold">{search ? 'No subcategories match your search.' : 'No subcategories yet. Add the first one!'}</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(sub => {
              const color = PALETTE[sub.id % PALETTE.length];
              return (
                <div key={sub.id} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md hover:-translate-y-0.5 duration-200">
                  {/* Image area */}
                  <div className="relative h-36 flex-shrink-0 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                    {sub.image_path ? (
                      <img src={`${BACKEND}/${sub.image_path}`} alt={sub.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/>
                    ) : (
                      <div className="flex h-full items-center justify-center select-none opacity-10 text-7xl">📂</div>
                    )}
                    <div className={`absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-white ${color.bg} shadow-md`}>
                      <span className={`text-xs font-extrabold ${color.text}`}>{sub.name.charAt(0).toUpperCase()}</span>
                    </div>
                    {/* Category badge */}
                    <div className="absolute right-2 top-2">
                      <span className="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold text-blue-700 shadow-sm backdrop-blur-sm">{sub.category_name}</span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">{sub.name}</h3>
                      {(sub.name_rw || sub.name_fr) && (
                        <p className="mt-0.5 text-xs text-slate-400 truncate">{[sub.name_rw, sub.name_fr].filter(Boolean).join(' · ')}</p>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      <span className="font-bold text-slate-700">{sub.product_count || 0}</span> Products
                    </p>

                    <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                      <button onClick={() => handleEdit(sub)}
                        className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(sub)}
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-400">{timeAgo(sub.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Subcategory</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Category</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Products</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {sub.image_path ? (
                          <img src={`${BACKEND}/${sub.image_path}`} alt={sub.name} className="h-10 w-10 flex-shrink-0 rounded-xl object-cover border border-slate-200"/>
                        ) : (
                          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 text-sm font-bold ${PALETTE[sub.id % PALETTE.length].bg} ${PALETTE[sub.id % PALETTE.length].text}`}>
                            {sub.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{sub.name}</p>
                          {(sub.name_rw || sub.name_fr) && (
                            <p className="text-xs text-slate-400 truncate max-w-[180px]">{[sub.name_rw, sub.name_fr].filter(Boolean).join(' · ')}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{sub.category_name}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-700">{sub.product_count || 0}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(sub)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition">Edit</button>
                        <button onClick={() => handleDelete(sub)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                <h3 className="text-lg font-bold text-slate-900">{editing ? 'Edit Subcategory' : 'Add New Subcategory'}</h3>
                {editing && <p className="mt-0.5 text-xs text-slate-400">Editing: <span className="font-semibold text-slate-600">{editing.name}</span></p>}
              </div>
              <button onClick={reset} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition text-xl leading-none">✕</button>
            </div>

            {/* Category selector (outside language tabs) */}
            <div className="border-b border-slate-100 px-6 py-4">
              <label className="block text-sm font-semibold text-slate-700">
                Parent Category <span className="text-red-500">*</span>
              </label>
              <select value={form.category_id} onChange={set('category_id')}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100">
                <option value="">Select a category…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Language tabs */}
            <div className="flex border-b border-slate-100 px-4">
              {LANGS.map(l => (
                <button key={l.code} onClick={() => setActiveLang(l.code)}
                  className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold transition ${activeLang === l.code ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  {l.label}
                  {l.badge && <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold leading-none ${l.badgeCls}`}>{l.badge}</span>}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
              <div className="flex-1 space-y-5 p-6">

                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Subcategory Name {activeLang === 'en' && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    value={form[lang.nameKey]}
                    onChange={set(lang.nameKey)}
                    placeholder={activeLang === 'en' ? 'e.g. Screws' : activeLang === 'rw' ? 'e.g. Ingata' : 'e.g. Vis'}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Description <span className="font-normal text-xs text-slate-400">(shown on customer interface)</span>
                  </label>
                  <textarea
                    rows={3} maxLength={255}
                    value={form[lang.descKey]}
                    onChange={set(lang.descKey)}
                    placeholder={activeLang === 'en' ? 'Brief description…' : activeLang === 'rw' ? 'Ibisobanuro…' : 'Description…'}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 resize-none"
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">{(form[lang.descKey] || '').length}/255</p>
                </div>

                {/* Image — English tab only */}
                {activeLang === 'en' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Subcategory Image</label>
                    {imagePreview ? (
                      <div className="relative mt-1.5">
                        <img src={imagePreview} alt="Preview" className="h-36 w-full rounded-xl object-cover border border-slate-200"/>
                        <button type="button"
                          onClick={() => { setImageFile(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow hover:bg-red-50 hover:text-red-500 transition text-sm leading-none">✕</button>
                      </div>
                    ) : (
                      <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-7 transition hover:border-blue-400 hover:bg-blue-50/40">
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden"/>
                        <svg className="h-7 w-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
                        </svg>
                        <span className="text-sm font-semibold text-slate-500">Click to upload image</span>
                        <span className="text-xs text-slate-400">PNG, JPG up to 2MB</span>
                      </label>
                    )}
                  </div>
                )}

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
                  {saving ? 'Saving…' : editing ? 'Update Subcategory' : 'Create Subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
