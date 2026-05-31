function Contact() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Contact Us</h2>
        <p className="mt-3 text-slate-600">Reach out to Umuhoza Quincaillerie for product availability, store hours, or general inquiries.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold">Store Information</h3>
          <ul className="mt-4 space-y-3 text-slate-700">
            <li>Phone: +250 788 123 456</li>
            <li>Email: info@umuhoza.com</li>
            <li>WhatsApp: +250 788 123 456</li>
            <li>Address: Umuhoza Quincaillerie, Kigali, Rwanda</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold">About the Store</h3>
          <p className="mt-4 text-slate-600">
            Umuhoza Quincaillerie specializes in construction materials, tools, and hardware supplies. Browse our catalog to see available products before visiting the store.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Contact;
