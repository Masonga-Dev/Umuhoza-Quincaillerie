import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const TABS = ['Homepage', 'Announcements', 'Gallery', 'Contact Info'];

function fieldClass() {
  return 'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100';
}
function labelClass() { return 'block text-sm font-medium text-slate-700'; }

function SaveBar({ saving, saved, onSave, label = 'Save Changes' }) {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onSave}
        disabled={saving}
        className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-60"
      >
        {saving ? 'Saving…' : label}
      </button>
      {saved && <span className="text-sm font-medium text-emerald-600">Saved!</span>}
    </div>
  );
}

// ─── Homepage Tab ─────────────────────────────────────────────────────────────
function HomepageTab({ token }) {
  const [settings, setSettings] = useState({});
  const [whyItems, setWhyItems] = useState([]);
  const [heroPreview, setHeroPreview] = useState(null);
  const [heroFile, setHeroFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [whyForm, setWhyForm] = useState({ title: '', title_rw: '', title_fr: '', description: '', description_rw: '', description_fr: '' });
  const [editingWhy, setEditingWhy] = useState(null);
  const [whySaving, setWhySaving] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.all([
      API.get('/admin/settings', { headers }),
      API.get('/admin/homepage-content', { headers }),
    ]).then(([sRes, hRes]) => {
      setSettings(sRes.data || {});
      setWhyItems((hRes.data || []).filter((s) => s.section_name === 'why_choose_us'));
      if (sRes.data?.heroImage) setHeroPreview(`${BACKEND}/${sRes.data.heroImage}`);
    }).catch(console.error);
  }, []);

  const handleHeroImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeroFile(file);
      setHeroPreview(URL.createObjectURL(file));
    }
  };

  const saveHero = async () => {
    setSaving(true); setSaved(false);
    try {
      let payload = { ...settings };
      if (heroFile) {
        const form = new FormData();
        form.append('image', heroFile);
        // Raw axios: avoids the API instance's Content-Type: application/json default
        // which would break multer's multipart parser.
        const res = await axios.post(`${BACKEND}/api/admin/upload/hero`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        payload.heroImage = res.data.image_path;
      }
      await API.post('/admin/settings', payload, { headers });
      setSettings(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const saveWhyItem = async () => {
    if (!whyForm.title.trim()) return;
    setWhySaving(true);
    try {
      if (editingWhy) {
        await API.put(`/admin/homepage-content/${editingWhy.id}`, {
          section_name: 'why_choose_us', title: whyForm.title, description: whyForm.description,
          display_order: editingWhy.display_order, is_active: 1,
        }, { headers });
        setWhyItems((prev) => prev.map((i) => i.id === editingWhy.id ? { ...i, ...whyForm } : i));
      } else {
        const res = await API.post('/admin/homepage-content', {
          section_name: 'why_choose_us', title: whyForm.title, description: whyForm.description,
          display_order: whyItems.length, is_active: 1,
        }, { headers });
        setWhyItems((prev) => [...prev, { id: res.data.id, section_name: 'why_choose_us', ...whyForm, display_order: whyItems.length, is_active: 1 }]);
      }
      setWhyForm({ title: '', title_rw: '', title_fr: '', description: '', description_rw: '', description_fr: '' }); setEditingWhy(null);
    } catch (e) { console.error(e); } finally { setWhySaving(false); }
  };

  const deleteWhyItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    await API.delete(`/admin/homepage-content/${id}`, { headers });
    setWhyItems((prev) => prev.filter((i) => i.id !== id));
  };

  const set = (key) => (e) => setSettings((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Hero Section</h3>
        <p className="mt-1 text-sm text-slate-500">The first banner customers see on the homepage.</p>
        <div className="mt-5 space-y-4">
          <div>
            <label className={labelClass()}>Hero Title</label>
            <input type="text" value={settings.heroTitle || ''} onChange={set('heroTitle')} placeholder="Quality Construction Materials" className={fieldClass()} />
          </div>
          <div>
            <label className={labelClass()}>Hero Description</label>
            <textarea rows={3} value={settings.heroDescription || ''} onChange={set('heroDescription')} placeholder="We provide high-quality materials…" className={fieldClass()} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass()}>Primary Button Text</label>
              <input type="text" value={settings.heroCta || ''} onChange={set('heroCta')} placeholder="View Products" className={fieldClass()} />
            </div>
            <div>
              <label className={labelClass()}>Badge Label</label>
              <input type="text" value={settings.heroBadge || ''} onChange={set('heroBadge')} placeholder="Quality You Can Build On" className={fieldClass()} />
            </div>
          </div>
          <div>
            <label className={labelClass()}>Hero Background Image</label>
            <div className="mt-2 flex items-center gap-4">
              <input type="file" accept="image/*" onChange={handleHeroImageChange} className="text-sm text-slate-700" />
              {heroPreview && (
                <img src={heroPreview} alt="Hero preview" className="h-20 w-32 rounded-lg object-cover border border-slate-200" />
              )}
            </div>
          </div>
        </div>
        <div className="mt-6">
          <SaveBar saving={saving} saved={saved} onSave={saveHero} label="Save Hero Section" />
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Why Choose Us — Items</h3>
        <p className="mt-1 text-sm text-slate-500">These appear in the "Why Customers Choose Us" panel.</p>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          {/* List */}
          <div className="space-y-3">
            {whyItems.length === 0 && <p className="text-sm text-slate-400">No items yet. Add one →</p>}
            {whyItems.map((item) => (
              <div key={item.id} className="flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                </div>
                <div className="ml-3 flex gap-2 flex-shrink-0">
                  <button onClick={() => { setEditingWhy(item); setWhyForm({ title: item.title, title_rw: item.title_rw || '', title_fr: item.title_fr || '', description: item.description || '', description_rw: item.description_rw || '', description_fr: item.description_fr || '' }); }}
                    className="text-xs font-medium text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => deleteWhyItem(item.id)}
                    className="text-xs font-medium text-red-500 hover:underline">Delete</button>
                </div>
              </div>
            ))}
          </div>
          {/* Form */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">{editingWhy ? 'Edit Item' : 'Add Item'}</p>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Title</p>
              <input type="text" value={whyForm.title} onChange={(e) => setWhyForm((p) => ({ ...p, title: e.target.value }))} placeholder="English *" className={fieldClass()} />
              <input type="text" value={whyForm.title_rw} onChange={(e) => setWhyForm((p) => ({ ...p, title_rw: e.target.value }))} placeholder="Kinyarwanda" className={fieldClass()} />
              <input type="text" value={whyForm.title_fr} onChange={(e) => setWhyForm((p) => ({ ...p, title_fr: e.target.value }))} placeholder="Français" className={fieldClass()} />
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</p>
              <textarea rows={2} value={whyForm.description} onChange={(e) => setWhyForm((p) => ({ ...p, description: e.target.value }))} placeholder="English…" className={fieldClass()} />
              <textarea rows={2} value={whyForm.description_rw} onChange={(e) => setWhyForm((p) => ({ ...p, description_rw: e.target.value }))} placeholder="Kinyarwanda…" className={fieldClass()} />
              <textarea rows={2} value={whyForm.description_fr} onChange={(e) => setWhyForm((p) => ({ ...p, description_fr: e.target.value }))} placeholder="Français…" className={fieldClass()} />
            </div>
            <div className="flex gap-3">
              <button onClick={saveWhyItem} disabled={whySaving}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
                {whySaving ? 'Saving…' : editingWhy ? 'Update' : 'Add Item'}
              </button>
              {editingWhy && (
                <button onClick={() => { setEditingWhy(null); setWhyForm({ title: '', title_rw: '', title_fr: '', description: '', description_rw: '', description_fr: '' }); }}
                  className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Company Stats override */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Company Stats Labels</h3>
        <p className="mt-1 text-sm text-slate-500">Numbers are calculated automatically. You can override the Years Experience value.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass()}>Years of Experience</label>
            <input type="text" value={settings.years_experience || ''} onChange={set('years_experience')} placeholder="5" className={fieldClass()} />
          </div>
        </div>
        <div className="mt-5">
          <SaveBar saving={saving} saved={saved} onSave={saveHero} label="Save Stats" />
        </div>
      </div>
    </div>
  );
}

// ─── Announcements Tab ────────────────────────────────────────────────────────
function AnnouncementsTab({ token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', title_rw: '', title_fr: '', content: '', content_rw: '', content_fr: '', status: 'Draft' });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    API.get('/admin/announcements', { headers })
      .then((r) => setItems(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const resetForm = () => { setForm({ title: '', title_rw: '', title_fr: '', content: '', content_rw: '', content_fr: '', status: 'Draft' }); setEditing(null); setError(''); };

  const handleSave = async () => {
    if (!form.title.trim()) return setError('English title is required.');
    setSaving(true); setError('');
    try {
      if (editing) {
        await API.put(`/admin/announcements/${editing.id}`, form, { headers });
        setItems((prev) => prev.map((i) => i.id === editing.id ? { ...i, ...form } : i));
      } else {
        const res = await API.post('/admin/announcements', form, { headers });
        setItems((prev) => [{ id: res.data.id, ...form, created_at: new Date().toISOString() }, ...prev]);
      }
      resetForm();
    } catch (e) { setError(e?.response?.data?.message || 'Error saving.'); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (item) => {
    const newStatus = item.status === 'Published' ? 'Draft' : 'Published';
    await API.put(`/admin/announcements/${item.id}`, { ...item, status: newStatus }, { headers });
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: newStatus } : i));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    await API.delete(`/admin/announcements/${id}`, { headers });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* List */}
      <div className="space-y-3">
        {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}
        {!loading && items.length === 0 && <p className="text-sm text-slate-400">No announcements yet. Create one →</p>}
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600 line-clamp-2">{item.content}</p>
              </div>
              <span className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${item.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {item.status}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => toggleStatus(item)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${item.status === 'Published' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                {item.status === 'Published' ? 'Unpublish' : 'Publish'}
              </button>
              <button onClick={() => { setEditing(item); setForm({ title: item.title, title_rw: item.title_rw || '', title_fr: item.title_fr || '', content: item.content || '', content_rw: item.content_rw || '', content_fr: item.content_fr || '', status: item.status }); }}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">Edit</button>
              <button onClick={() => handleDelete(item.id)}
                className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm self-start sticky top-4">
        <h3 className="text-base font-semibold text-slate-900">{editing ? 'Edit Announcement' : 'New Announcement'}</h3>
        <div className="mt-4 space-y-4">
          {/* Title multilingual */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Title</p>
            <div>
              <label className={labelClass()}>English <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. New stock arrived" className={fieldClass()} />
            </div>
            <div>
              <label className={labelClass()}>Kinyarwanda</label>
              <input type="text" value={form.title_rw} onChange={(e) => setForm((p) => ({ ...p, title_rw: e.target.value }))} placeholder="Amakuru mu Kinyarwanda" className={fieldClass()} />
            </div>
            <div>
              <label className={labelClass()}>French</label>
              <input type="text" value={form.title_fr} onChange={(e) => setForm((p) => ({ ...p, title_fr: e.target.value }))} placeholder="Titre en français" className={fieldClass()} />
            </div>
          </div>
          {/* Content multilingual */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Content</p>
            <div>
              <label className={labelClass()}>English</label>
              <textarea rows={3} value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} placeholder="Announcement details…" className={fieldClass()} />
            </div>
            <div>
              <label className={labelClass()}>Kinyarwanda</label>
              <textarea rows={2} value={form.content_rw} onChange={(e) => setForm((p) => ({ ...p, content_rw: e.target.value }))} placeholder="Ibisobanuro mu Kinyarwanda…" className={fieldClass()} />
            </div>
            <div>
              <label className={labelClass()}>French</label>
              <textarea rows={2} value={form.content_fr} onChange={(e) => setForm((p) => ({ ...p, content_fr: e.target.value }))} placeholder="Détails en français…" className={fieldClass()} />
            </div>
          </div>
          <div>
            <label className={labelClass()}>Status</label>
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className={fieldClass()}>
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
            </select>
          </div>
          {error && <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
            </button>
            {editing && (
              <button onClick={resetForm} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Gallery Tab ──────────────────────────────────────────────────────────────
function GalleryTab({ token }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef();
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    API.get('/admin/gallery', { headers })
      .then((r) => setImages(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      form.append('title', title);
      // Raw axios: avoids the API instance's Content-Type: application/json default
      // which would break multer's multipart parser.
      const res = await axios.post(`${BACKEND}/api/admin/gallery/upload`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setImages((prev) => [{ id: res.data.id, title, image_path: res.data.image_path, created_at: new Date().toISOString() }, ...prev]);
      setFile(null); setPreview(null); setTitle('');
      if (inputRef.current) inputRef.current.value = '';
    } catch (e) { console.error(e); } finally { setUploading(false); }
  };

  const handleDelete = async (img) => {
    if (!window.confirm('Delete this image?')) return;
    await API.delete(`/admin/gallery/${img.id}`, { headers });
    setImages((prev) => prev.filter((i) => i.id !== img.id));
  };

  return (
    <div className="space-y-6">
      {/* Upload card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Upload New Image</h3>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label className={labelClass()}>Image</label>
            <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="mt-2 text-sm text-slate-700" />
          </div>
          <div className="flex-1 min-w-48">
            <label className={labelClass()}>Caption (optional)</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Showroom display" className={fieldClass()} />
          </div>
          {preview && <img src={preview} alt="preview" className="h-16 w-24 rounded-lg object-cover border border-slate-200" />}
          <button onClick={handleUpload} disabled={!file || uploading}
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-50">
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? <p className="text-sm text-slate-500">Loading gallery…</p> : null}
      {!loading && images.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
          <p className="text-sm">No images uploaded yet.</p>
        </div>
      )}
      {images.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <img src={`${BACKEND}/${img.image_path}`} alt={img.title || ''} className="h-48 w-full object-cover" />
              <div className="p-3 flex items-center justify-between">
                <p className="text-sm text-slate-700 truncate">{img.title || 'Untitled'}</p>
                <button onClick={() => handleDelete(img)}
                  className="text-xs font-semibold text-red-500 hover:text-red-700">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Contact Info Tab ─────────────────────────────────────────────────────────
function ContactTab({ token }) {
  const [form, setForm] = useState({ sitePhone: '', siteEmail: '', siteAddress: '', whatsapp: '', businessHours: '', facebook: '', instagram: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    API.get('/admin/settings', { headers })
      .then((r) => setForm((prev) => ({ ...prev, ...(r.data || {}) })))
      .catch(console.error);
  }, []);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      await API.post('/admin/settings', form, { headers });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const Field = ({ label, k, type = 'text', placeholder }) => (
    <div>
      <label className={labelClass()}>{label}</label>
      <input type={type} value={form[k] || ''} onChange={set(k)} placeholder={placeholder} className={fieldClass()} />
    </div>
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Contact Information</h3>
      <p className="mt-1 text-sm text-slate-500">These details appear on the Contact page and footer.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Phone Number" k="sitePhone" placeholder="+250 788 123 456" />
        <Field label="WhatsApp Number" k="whatsapp" placeholder="+250 788 123 456" />
        <Field label="Email Address" k="siteEmail" type="email" placeholder="info@umuhoza.com" />
        <Field label="Business Hours" k="businessHours" placeholder="Mon–Sat · 7:30 AM – 6:00 PM" />
        <div className="sm:col-span-2">
          <label className={labelClass()}>Physical Address</label>
          <textarea rows={2} value={form.siteAddress || ''} onChange={set('siteAddress')} placeholder="Kigali, Rwanda" className={fieldClass()} />
        </div>
        <Field label="Facebook URL" k="facebook" placeholder="https://facebook.com/umuhoza" />
        <Field label="Instagram URL" k="instagram" placeholder="https://instagram.com/umuhoza" />
      </div>
      <div className="mt-6">
        <SaveBar saving={saving} saved={saved} onSave={handleSave} />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function AdminContent() {
  const [activeTab, setActiveTab] = useState('Homepage');
  const token = localStorage.getItem('umuhoza_token');

  return (
    <AdminLayout currentPage="/admin/content">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Website Content</h1>
          <p className="mt-1 text-sm text-slate-500">Manage all customer-facing content from here — no code changes needed.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Homepage' && <HomepageTab token={token} />}
        {activeTab === 'Announcements' && <AnnouncementsTab token={token} />}
        {activeTab === 'Gallery' && <GalleryTab token={token} />}
        {activeTab === 'Contact Info' && <ContactTab token={token} />}
      </div>
    </AdminLayout>
  );
}

export default AdminContent;
