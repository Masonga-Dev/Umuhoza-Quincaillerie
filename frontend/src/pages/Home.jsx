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
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 text-white shadow-2xl">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1581092337167-1d1fc8f7ef6f?auto=format&fit=crop&w=1600&q=80"
            alt="Hardware store shelves"
            className="h-full w-full object-cover opacity-40"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/90" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="max-w-xl space-y-6">
            <span className="inline-flex rounded-full bg-blue-500/20 px-4 py-2 text-sm font-semibold uppercase tracking-[0.32em] text-blue-200">
              Quality You Can Build On
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Quality Construction Materials & Hardware Solutions
            </h1>
            <p className="text-lg leading-8 text-slate-200">
              We provide high-quality construction materials, tools, plumbing, electrical and more at the best prices.
              Your trusted partner in every building project.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <a href="/products" className="inline-flex items-center justify-center rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/30 transition hover:bg-amber-300">
                View Products
              </a>
              <a href="/contact" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/15">
                Contact Us
              </a>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 px-5 py-5 backdrop-blur-sm">
                <p className="text-3xl font-extrabold">500+</p>
                <p className="text-sm text-slate-300">Products Available</p>
              </div>
              <div className="rounded-3xl bg-white/10 px-5 py-5 backdrop-blur-sm">
                <p className="text-3xl font-extrabold">1000+</p>
                <p className="text-sm text-slate-300">Customers Served</p>
              </div>
            </div>
          </div>
          <div className="relative flex items-end justify-end rounded-[2rem] bg-white/5 p-6 backdrop-blur-sm sm:p-8">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl shadow-slate-950/40">
              <img
                src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80"
                alt="Hardware store"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 rounded-[2rem] bg-white p-6 shadow-lg sm:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-3xl font-bold text-slate-900">500+</p>
            <p className="mt-2 text-sm text-slate-500">Products Available</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-3xl font-bold text-slate-900">10+</p>
            <p className="mt-2 text-sm text-slate-500">Categories</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-3xl font-bold text-slate-900">1000+</p>
            <p className="mt-2 text-sm text-slate-500">Customers Served</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-3xl font-bold text-slate-900">5+</p>
            <p className="mt-2 text-sm text-slate-500">Years Experience</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-[2rem] bg-slate-50 p-6 shadow-lg sm:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-500">Our Categories</p>
              <h2 className="mt-4 text-3xl font-extrabold text-slate-900">Shop By Category</h2>
              <p className="mt-3 text-slate-600">High-quality construction and hardware products in every category.</p>
            </div>
            <a href="/products" className="inline-flex h-fit items-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              View All Products
            </a>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {['Cement', 'Tools', 'Paints', 'Plumbing', 'Electrical', 'Roofing'].slice(0,5).map((category) => (
              <div key={category} className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  {category.charAt(0)}
                </div>
                <h3 className="text-base font-semibold text-slate-900">{category}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-500">Popular Products</p>
            <h2 className="mt-4 text-3xl font-extrabold text-slate-900">Our Best Sellers</h2>
            <p className="mt-3 text-slate-600">High quality materials from top brands. Available in-store at the best prices.</p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-2">
              {homepage.featured.length ? (
                homepage.featured.slice(0, 4).map((product) => (
                  <div key={product.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 h-44 overflow-hidden rounded-3xl bg-slate-100" />
                    <h3 className="text-xl font-semibold text-slate-900">{product.name}</h3>
                    <p className="mt-2 text-sm text-slate-600">{product.description || 'Top quality product for your next project.'}</p>
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-700">
                      <span className="rounded-full bg-slate-100 px-3 py-1">In Stock</span>
                      <span className="font-semibold text-slate-900">{product.category_name || 'General'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
                  Product data is loading or unavailable.
                </div>
              )}
            </div>
          </div>
          <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl">
            <h3 className="text-2xl font-semibold">Why Customers Choose Us</h3>
            <div className="mt-8 space-y-5">
              {[
                { title: 'Quality Products', desc: 'We stock only high quality and durable materials.' },
                { title: 'Competitive Prices', desc: 'Best prices on the market for all our products.' },
                { title: 'Reliable Stock', desc: 'Always available stock for your projects.' },
                { title: 'Professional Service', desc: 'Our team is always ready to help you succeed.' },
              ].map((item) => (
                <div key={item.title} className="rounded-3xl bg-slate-900/80 p-5">
                  <h4 className="text-lg font-semibold text-white">{item.title}</h4>
                  <p className="mt-2 text-sm text-slate-300">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-white p-8 shadow-lg">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-500">Latest Announcements</p>
            <div className="mt-6 space-y-4">
              {homepage.announcements.length ? (
                homepage.announcements.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{item.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-600">No announcements are available yet.</p>
              )}
            </div>
            <a href="/contact" className="mt-8 inline-flex items-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              View All Announcements
            </a>
          </div>
          <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-400">Testimonials</p>
            <h3 className="mt-4 text-3xl font-extrabold">Trusted by local contractors</h3>
            <p className="mt-6 text-slate-300">"Umuhoza Quincaillerie is our go-to store for all construction materials. Great quality, good prices and excellent service."</p>
            <div className="mt-8 flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-amber-400/20 ring-1 ring-amber-400/40" />
              <div>
                <p className="font-semibold">Jean Paul</p>
                <p className="text-sm text-slate-400">Contractor</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-[2rem] bg-slate-950 px-8 py-12 text-white shadow-2xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-400">Need Help? We Are Here!</p>
              <h3 className="mt-4 text-3xl font-extrabold">Call us or visit our store for any inquiries.</h3>
              <p className="mt-4 max-w-xl text-slate-300">Our team is ready to assist you with orders, product information and fast delivery.</p>
            </div>
            <div className="space-y-4">
              <a href="tel:+250788123456" className="inline-flex w-full items-center justify-between rounded-full bg-white/10 px-5 py-4 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/15">
                <span>+250 788 123 456</span>
                <span className="text-amber-400">Call Now</span>
              </a>
              <a href="https://wa.me/250788123456" target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-between rounded-full bg-amber-400 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-amber-300">
                <span>WhatsApp Us</span>
                <span className="font-bold">Send Message</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
