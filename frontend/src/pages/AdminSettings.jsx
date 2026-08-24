import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';
import { useLanguage } from '../i18n/LanguageContext';

const DEFAULTS = {
  siteName: '',
  siteEmail: '',
  sitePhone: '',
  siteAddress: '',
  whatsapp: '',
  businessHours: '',
  currencySymbol: 'RWF',
  years_experience: '5',
  facebook: '',
  instagram: '',
  footerText: '',
  show_prices: 'true',
};

function fieldClass() {
  return 'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100';
}

function AdminSettings() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const token = localStorage.getItem('umuhoza_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    API.get('/admin/settings', { headers })
      .then((r) => setSettings({ ...DEFAULTS, ...(r.data || {}) }))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setSettings((p) => ({ ...p, [k]: e.target.value }));

  const handlePriceToggle = async () => {
    const newVal = settings.show_prices === 'false' ? 'true' : 'false';
    setSettings(p => ({ ...p, show_prices: newVal }));
    try {
      await API.post('/admin/settings', { show_prices: newVal }, { headers });
      setToast(newVal === 'false' ? 'Prices hidden on customer site.' : 'Prices now visible on customer site.');
      setTimeout(() => setToast(''), 3000);
    } catch {
      setToast('Failed to update price visibility.');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.post('/admin/settings', settings, { headers });
      setToast('Settings saved successfully.');
      setTimeout(() => setToast(''), 3000);
    } catch (e) {
      setToast('Failed to save settings.');
      setTimeout(() => setToast(''), 3000);
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout currentPage="/admin/settings">
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="/admin/settings">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('admin.settingsPage.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('admin.settingsPage.subtitle')}</p>
        </div>

        {/* General */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">{t('admin.settingsPage.general')}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">{t('admin.settingsPage.siteName')}</label>
              <input type="text" value={settings.siteName} onChange={set('siteName')} placeholder="Umuhoza Quincaillerie" className={fieldClass()} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('admin.settingsPage.currencySymbol')}</label>
              <input type="text" value={settings.currencySymbol} onChange={set('currencySymbol')} placeholder="RWF" className={fieldClass()} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('admin.settingsPage.yearsExperience')}</label>
              <input type="text" value={settings.years_experience} onChange={set('years_experience')} placeholder="5" className={fieldClass()} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">{t('admin.settingsPage.footerText')}</label>
              <input type="text" value={settings.footerText} onChange={set('footerText')} placeholder="Your trusted partner for hardware and construction supplies." className={fieldClass()} />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">{t('admin.settingsPage.contactDetails')}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('admin.settingsPage.phone')}</label>
              <input type="tel" value={settings.sitePhone} onChange={set('sitePhone')} placeholder="+250 788 123 456" className={fieldClass()} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('admin.settingsPage.whatsapp')}</label>
              <input type="tel" value={settings.whatsapp} onChange={set('whatsapp')} placeholder="+250 788 123 456" className={fieldClass()} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('admin.settingsPage.email')}</label>
              <input type="email" value={settings.siteEmail} onChange={set('siteEmail')} placeholder="info@umuhoza.com" className={fieldClass()} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('admin.settingsPage.businessHours')}</label>
              <input type="text" value={settings.businessHours} onChange={set('businessHours')} placeholder="Mon–Sat · 7:30 AM–6:00 PM" className={fieldClass()} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">{t('admin.settingsPage.physicalAddress')}</label>
              <textarea rows={2} value={settings.siteAddress} onChange={set('siteAddress')} placeholder="Kigali, Rwanda" className={fieldClass()} />
            </div>
          </div>
        </div>

        {/* Customer Experience */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">{t('admin.settingsPage.customerExperience')}</h2>
          <p className="mt-1 text-sm text-slate-400">{t('admin.settingsPage.showPricesHint')}</p>
          <div className="mt-5 space-y-3">
            {/* Show Prices toggle */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">{t('admin.settingsPage.showPrices')}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t('admin.settingsPage.showPricesHint')}</p>
              </div>
              <button
                type="button"
                onClick={handlePriceToggle}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${settings.show_prices !== 'false' ? 'bg-blue-600' : 'bg-slate-300'}`}
                role="switch"
                aria-checked={settings.show_prices !== 'false'}
              >
                <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.show_prices !== 'false' ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Social */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">{t('admin.settingsPage.socialMedia')}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('admin.settingsPage.facebook')}</label>
              <input type="url" value={settings.facebook} onChange={set('facebook')} placeholder="https://facebook.com/umuhoza" className={fieldClass()} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('admin.settingsPage.instagram')}</label>
              <input type="url" value={settings.instagram} onChange={set('instagram')} placeholder="https://instagram.com/umuhoza" className={fieldClass()} />
            </div>
          </div>
        </div>

        {/* Toast + Save */}
        {toast && (
          <div className={`rounded-xl px-5 py-3 text-sm font-semibold ${toast.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {toast}
          </div>
        )}

        <div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : t('admin.settingsPage.saveAll')}
          </button>
        </div>

      </div>
    </AdminLayout>
  );
}

export default AdminSettings;
