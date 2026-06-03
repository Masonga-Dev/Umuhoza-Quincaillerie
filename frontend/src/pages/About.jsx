function About() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">About Umuhoza Quincaillerie</h1>
        <p className="mt-4 text-slate-600">
          Umuhoza Quincaillerie is a leading hardware and building supplies store dedicated to serving our community with high-quality products and exceptional customer service.
        </p>
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Our Mission</h2>
        <p className="mt-4 text-slate-600">
          To provide reliable, affordable, and diverse hardware solutions that empower our customers to build, repair, and create with confidence.
        </p>
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Why Choose Us</h2>
        <ul className="mt-4 space-y-3 text-slate-600">
          <li className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-blue-600"></span>
            <span>Wide selection of quality hardware and building materials</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-blue-600"></span>
            <span>Competitive prices and regular promotions</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-blue-600"></span>
            <span>Knowledgeable staff ready to assist you</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-blue-600"></span>
            <span>Fast and reliable service</span>
          </li>
        </ul>
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Get in Touch</h2>
        <p className="mt-4 text-slate-600">
          Have questions? Visit our <a href="/contact" className="font-semibold text-blue-600 hover:text-blue-700">Contact page</a> to reach out to us.
        </p>
      </section>
    </div>
  );
}

export default About;
