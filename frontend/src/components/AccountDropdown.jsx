import { useState, useEffect, useRef } from 'react';
import API from '../api';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const imgUrl = p => !p ? '' : p.startsWith('http') ? p : `${BACKEND}/${p}`;
const HEADERS = () => ({ Authorization: `Bearer ${localStorage.getItem('umuhoza_token')}` });

function getInitial(name) { return (name || 'A').charAt(0).toUpperCase(); }

function Avatar({ user, size = 36 }) {
  if (user?.avatar_path) {
    return (
      <img
        src={imgUrl(user.avatar_path)}
        alt={user.name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
      />
    );
  }
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: 'linear-gradient(135deg,#1a2d5a,#2d4a8a)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, fontSize: size * 0.38,
        flexShrink: 0,
      }}
    >
      {getInitial(user?.name)}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4" style={{ background: '#f8fafc' }}>
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ProfilePanel({ user, onEdit, onClose }) {
  return (
    <Modal title="My Profile" onClose={onClose}>
      <div className="flex flex-col items-center gap-3 pb-4 border-b border-slate-100 mb-4">
        <Avatar user={user} size={80} />
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">{user?.name || '—'}</p>
          <span className="inline-block rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700 capitalize mt-1">
            {user?.role || 'admin'}
          </span>
        </div>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <span className="w-5 text-slate-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </span>
          <span className="text-slate-600">{user?.email || '—'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-5 text-slate-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
            </svg>
          </span>
          <span className="text-slate-600">{user?.phone || <span className="text-slate-300 italic">Not set</span>}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-5 text-slate-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </span>
          <span className="text-slate-600">
            Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-RW', { month: 'long', year: 'numeric' }) : '—'}
          </span>
        </div>
      </div>
      <button
        onClick={onEdit}
        className="mt-5 w-full rounded-xl bg-[#1a2d5a] py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d1b3e]"
      >
        Edit Profile
      </button>
    </Modal>
  );
}

function SettingsPanel({ user, onClose, onSaved }) {
  const [form, setForm]       = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [avatar, setAvatar]   = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [preview, setPreview] = useState(user?.avatar_path ? imgUrl(user.avatar_path) : null);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const fileRef               = useRef();

  const pickFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    setAvatar(f);
    setRemovePhoto(false);
    setPreview(URL.createObjectURL(f));
  };

  const handleRemovePhoto = () => {
    setAvatar(null);
    setRemovePhoto(true);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const save = async e => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      if (avatar) fd.append('avatar', avatar);
      if (removePhoto) fd.append('remove_avatar', 'true');
      const res = await API.put('/admin/me', fd, { headers: { ...HEADERS(), 'Content-Type': 'multipart/form-data' } });
      onSaved(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const hasPhoto = !!preview;

  return (
    <Modal title="Account Settings" onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        {/* Avatar picker */}
        <div className="flex items-center gap-4">
          <div
            className="h-16 w-16 rounded-full overflow-hidden flex-shrink-0 cursor-pointer border-2 border-dashed border-slate-200 hover:border-amber-400 transition"
            onClick={() => fileRef.current?.click()}
          >
            {preview
              ? <img src={preview} alt="" className="h-full w-full object-cover" />
              : <div className="h-full w-full flex items-center justify-center bg-slate-100 text-2xl font-bold text-slate-400">{getInitial(form.name)}</div>
            }
          </div>
          <div className="flex flex-col gap-1">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="text-xs font-semibold text-[#1a2d5a] hover:underline text-left">
              Change photo
            </button>
            {hasPhoto && (
              <button type="button" onClick={handleRemovePhoto}
                className="text-xs font-semibold text-red-500 hover:underline text-left">
                Remove photo
              </button>
            )}
            <p className="text-[11px] text-slate-400">JPG or PNG, max 3 MB</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#1a2d5a] focus:ring-2 focus:ring-[#1a2d5a]/10" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
          <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#1a2d5a] focus:ring-2 focus:ring-[#1a2d5a]/10" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number</label>
          <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+250 7XX XXX XXX"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#1a2d5a] focus:ring-2 focus:ring-[#1a2d5a]/10" />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>}

        <button type="submit" disabled={saving}
          className="w-full rounded-xl bg-[#1a2d5a] py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d1b3e] disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </Modal>
  );
}

function PasswordPanel({ onClose }) {
  const [form, setForm]   = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  const save = async e => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.next !== form.confirm) { setError('New passwords do not match'); return; }
    if (form.next.length < 6) { setError('New password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await API.put('/admin/me/password',
        { current_password: form.current, new_password: form.next },
        { headers: HEADERS() }
      );
      setSuccess('Password updated successfully!');
      setForm({ current: '', next: '', confirm: '' });
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally { setSaving(false); }
  };

  const field = (label, key, placeholder) => (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
      <input
        type="password" value={form[key]} placeholder={placeholder}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} required
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#1a2d5a] focus:ring-2 focus:ring-[#1a2d5a]/10"
      />
    </div>
  );

  return (
    <Modal title="Change Password" onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        {field('Current Password', 'current', 'Enter current password')}
        {field('New Password', 'next', 'Min. 6 characters')}
        {field('Confirm New Password', 'confirm', 'Repeat new password')}
        {error   && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>}
        {success && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-600">{success}</p>}
        <button type="submit" disabled={saving}
          className="w-full rounded-xl bg-[#1a2d5a] py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d1b3e] disabled:opacity-60">
          {saving ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </Modal>
  );
}

export default function AccountDropdown({ onSignOut }) {
  const [open, setOpen]     = useState(false);
  const [panel, setPanel]   = useState(null); // 'profile' | 'settings' | 'password'
  const [user, setUser]     = useState(null);
  const ref                 = useRef();

  useEffect(() => {
    API.get('/admin/me', { headers: HEADERS() }).then(r => setUser(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);

  const openPanel = (p) => { setOpen(false); setPanel(p); };

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 rounded-full transition hover:opacity-90 focus:outline-none"
          style={{ padding: 2 }}
        >
          <Avatar user={user} size={36} />
        </button>

        {open && (
          <div
            className="absolute right-0 top-full mt-2 z-50 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
            style={{ width: 260 }}
          >
            {/* Profile card */}
            <div className="flex items-center gap-3 px-4 py-4" style={{ background: 'linear-gradient(135deg,#0d1b3e,#1a2d5a)' }}>
              <Avatar user={user} size={44} />
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{user?.name || 'Administrator'}</p>
                <p className="text-[11px] text-amber-300/80 capitalize">{user?.role || 'admin'}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email || ''}</p>
              </div>
            </div>

            {/* Menu */}
            <div className="py-1.5">
              {[
                { icon: '👤', label: 'My Profile',       action: () => openPanel('profile')  },
                { icon: '⚙️', label: 'Account Settings',  action: () => openPanel('settings') },
                { icon: '🔒', label: 'Change Password',   action: () => openPanel('password') },
              ].map(({ icon, label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <span className="text-base leading-none w-5 text-center">{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            <div className="border-t border-slate-100 py-1.5">
              <button
                onClick={() => { setOpen(false); onSignOut(); }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 transition hover:bg-red-50"
              >
                <span className="text-base leading-none w-5 text-center">🚪</span>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Panels */}
      {panel === 'profile'  && <ProfilePanel  user={user} onClose={() => setPanel(null)} onEdit={() => setPanel('settings')} />}
      {panel === 'settings' && <SettingsPanel user={user} onClose={() => setPanel(null)} onSaved={u => setUser(u)} />}
      {panel === 'password' && <PasswordPanel onClose={() => setPanel(null)} />}
    </>
  );
}
