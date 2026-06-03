import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

function AdminSettings() {
  const [settings, setSettings] = useState({
    siteName: 'Umuhoza Quincaillerie',
    siteEmail: 'info@umuhoza.com',
    sitePhone: '+250 123 456 789',
    siteAddress: 'Kigali, Rwanda',
    businessHours: 'Mon-Fri: 8AM-6PM, Sat: 9AM-5PM',
    currencySymbol: 'RWF',
  });
  const [saveMessage, setSaveMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
  };

  const handleSave = async () => {
    const token = localStorage.getItem('umuhoza_token');
    try {
      await API.post('/admin/settings', settings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Error saving settings');
      console.error(error);
    }
  };

  return (
    <AdminLayout currentPage="/admin/settings">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Settings</h2>
          <p className="mt-2 text-slate-600">Configure your store settings</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">Site Name</label>
              <input
                type="text"
                name="siteName"
                value={settings.siteName}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  name="siteEmail"
                  value={settings.siteEmail}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Phone</label>
                <input
                  type="tel"
                  name="sitePhone"
                  value={settings.sitePhone}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Address</label>
              <textarea
                name="siteAddress"
                value={settings.siteAddress}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2"
                rows="2"
              ></textarea>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Business Hours</label>
                <textarea
                  name="businessHours"
                  value={settings.businessHours}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2"
                  rows="2"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Currency Symbol</label>
                <input
                  type="text"
                  name="currencySymbol"
                  value={settings.currencySymbol}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2"
                />
              </div>
            </div>

            {saveMessage && (
              <div
                className={`rounded-lg p-3 text-sm font-semibold ${
                  saveMessage.includes('successfully')
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {saveMessage}
              </div>
            )}

            <button
              onClick={handleSave}
              className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Save Settings
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-6">
          <h3 className="text-lg font-semibold text-slate-900">System Information</h3>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div>Backend: <span className="font-mono text-slate-900">http://localhost:4000</span></div>
            <div>Frontend: <span className="font-mono text-slate-900">http://localhost:3000</span></div>
            <div>Database: <span className="font-mono text-slate-900">umuhoza_quincaillerie</span></div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminSettings;
