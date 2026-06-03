import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import API from '../api';

function AdminContent() {
  const [activeTab, setActiveTab] = useState('homepage');
  const [homepage, setHomepage] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    const token = localStorage.getItem('umuhoza_token');
    setLoading(true);
    try {
      const [homeRes, announcementsRes, galleryRes] = await Promise.all([
        API.get('/admin/homepage-content', { headers: { Authorization: `Bearer ${token}` } }),
        API.get('/admin/announcements', { headers: { Authorization: `Bearer ${token}` } }),
        API.get('/admin/gallery', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setHomepage(homeRes.data || []);
      setAnnouncements(announcementsRes.data || []);
      setGallery(galleryRes.data || []);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout currentPage="/admin/content">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Website Content</h2>
          <p className="mt-2 text-slate-600">Manage website content without coding</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          {['homepage', 'announcements', 'gallery', 'contact'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-semibold transition ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-6">
            <p className="text-slate-600">Loading content...</p>
          </div>
        ) : (
          <>
            {/* Homepage */}
            {activeTab === 'homepage' && (
              <div className="space-y-4">
                {homepage.length > 0 ? (
                  homepage.map((section) => (
                    <div key={section.id} className="rounded-2xl bg-white p-6 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 capitalize">
                            {section.section_name}
                          </h3>
                          {section.title && (
                            <p className="mt-2 font-semibold text-slate-700">{section.title}</p>
                          )}
                          {section.description && (
                            <p className="mt-1 text-sm text-slate-600">{section.description}</p>
                          )}
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 font-semibold">Edit</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-white p-6 text-center">
                    <p className="text-slate-600">No homepage content yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Announcements */}
            {activeTab === 'announcements' && (
              <div className="space-y-4">
                <button className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
                  + New Announcement
                </button>
                {announcements.length > 0 ? (
                  announcements.map((ann) => (
                    <div key={ann.id} className="rounded-2xl bg-white p-6 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900">{ann.title}</h3>
                          <p className="mt-2 text-slate-600">{ann.content}</p>
                          <div className="mt-3 flex items-center gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                ann.status === 'Published'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {ann.status}
                            </span>
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 font-semibold">Edit</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-white p-6 text-center">
                    <p className="text-slate-600">No announcements yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Gallery */}
            {activeTab === 'gallery' && (
              <div className="space-y-4">
                <button className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
                  + Upload Image
                </button>
                {gallery.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {gallery.map((img) => (
                      <div key={img.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                        <img
                          src={`/uploads/gallery/${img.filename || img.image_path}`}
                          alt={img.title}
                          className="h-40 w-full object-cover"
                        />
                        {img.title && (
                          <div className="p-3">
                            <p className="font-semibold text-slate-900">{img.title}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white p-6 text-center">
                    <p className="text-slate-600">No gallery images yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Contact */}
            {activeTab === 'contact' && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Phone</label>
                    <input
                      type="tel"
                      placeholder="+250 123 456 789"
                      className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Email</label>
                    <input
                      type="email"
                      placeholder="info@umuhoza.com"
                      className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Address</label>
                    <textarea
                      placeholder="Your address here"
                      className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2"
                      rows="3"
                    ></textarea>
                  </div>
                  <button className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminContent;
