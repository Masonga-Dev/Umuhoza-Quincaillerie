import { useEffect, useState } from 'react';
import API from '../api';

function Home() {
  const [homepage, setHomepage] = useState({ banners: [], featured: [], announcements: [] });

  useEffect(() => {
    API.get('/public/homepage')
      .then((response) => setHomepage(response.data))
      .catch((error) => console.error(error));
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-xl">
        <h2 className="text-3xl font-semibold">Welcome to Umuhoza Quincaillerie</h2>
        <p className="mt-3 max-w-2xl text-slate-200">Browse products available in the store, check stock availability, and learn about our company before visiting for a physical purchase.</p>
      </section>

      <section>
        <h3 className="text-2xl font-semibold text-slate-900">Featured Products</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {homepage.featured.length ? (
            homepage.featured.map((product) => (
              <div key={product.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 h-48 overflow-hidden rounded-2xl bg-slate-100" />
                <h4 className="text-xl font-semibold text-slate-900">{product.name}</h4>
                <p className="mt-2 text-sm text-slate-600">{product.description || 'No description available.'}</p>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-700">
                  <span>{product.category_name}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">{product.status}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-600">No featured products yet. Please add products in the admin dashboard.</p>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-semibold text-slate-900">Announcements</h3>
        <div className="mt-4 space-y-4">
          {homepage.announcements.length ? (
            homepage.announcements.map((item) => (
              <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h4 className="text-lg font-semibold text-slate-900">{item.title}</h4>
                <p className="mt-2 text-slate-600">{item.content}</p>
              </article>
            ))
          ) : (
            <p className="text-slate-600">There are no announcements yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;
