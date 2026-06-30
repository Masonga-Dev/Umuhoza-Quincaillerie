import { useEffect, useRef, useState } from 'react';

const INDUSTRIES = [
  {
    name: 'Plumbing & Construction',
    icon: (
      <svg viewBox="0 0 88 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <rect x="6" y="36" width="48" height="12" rx="4" fill="#1d4ed8"/>
        <rect x="6" y="36" width="48" height="4"  rx="2" fill="#3b82f6"/>
        <rect x="46" y="20" width="12" height="30" rx="4" fill="#1d4ed8"/>
        <rect x="46" y="20" width="4"  height="30" rx="2" fill="#3b82f6"/>
        <rect x="43" y="14" width="18" height="10" rx="4" fill="#2563eb"/>
        <rect x="43" y="14" width="18" height="4"  rx="2" fill="#60a5fa"/>
        <rect x="2"  y="29" width="18" height="22" rx="5" fill="#ea580c"/>
        <rect x="2"  y="29" width="18" height="6"  rx="4" fill="#fb923c"/>
        <rect x="9"  y="19" width="4"  height="13" rx="2" fill="#c2410c"/>
        <rect x="5"  y="17" width="12" height="5"  rx="2.5" fill="#f97316"/>
        <rect x="6"  y="16" width="10" height="3"  rx="1.5" fill="#fb923c"/>
        <ellipse cx="11" cy="57" rx="2.5" ry="3.5" fill="#93c5fd"/>
        <ellipse cx="17" cy="62" rx="1.8" ry="2.5" fill="#bfdbfe"/>
        <ellipse cx="7"  cy="63" rx="1.5" ry="2"   fill="#60a5fa"/>
        <rect x="60" y="26" width="16" height="8" rx="3" fill="#1e40af"/>
        <rect x="63" y="28" width="10" height="4" rx="2" fill="#3b82f6"/>
      </svg>
    ),
  },
  {
    name: 'Agriculture & Irrigation',
    icon: (
      <svg viewBox="0 0 88 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <ellipse cx="44" cy="70" rx="32" ry="7" fill="#92400e" opacity="0.25"/>
        <path d="M44 68 Q42 52 44 38" stroke="#15803d" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M44 52 Q30 44 28 32 Q38 36 44 52Z" fill="#16a34a"/>
        <path d="M44 44 Q60 36 62 24 Q50 30 44 44Z" fill="#22c55e"/>
        <path d="M44 38 Q36 28 38 18 Q46 24 44 38Z" fill="#4ade80"/>
        <ellipse cx="18" cy="30" rx="3"   ry="4.5" fill="#38bdf8"/>
        <ellipse cx="25" cy="20" rx="2.5" ry="3.5" fill="#7dd3fc"/>
        <ellipse cx="12" cy="20" rx="2"   ry="3"   fill="#0ea5e9"/>
        <ellipse cx="30" cy="12" rx="2"   ry="3"   fill="#38bdf8"/>
        <path d="M8 40 Q16 18 30 10" stroke="#7dd3fc" strokeWidth="1.5" strokeDasharray="3 3" fill="none"/>
        <rect x="4" y="38" width="10" height="5" rx="2.5" fill="#0284c7"/>
        <rect x="2" y="42" width="14" height="4" rx="2"   fill="#0369a1"/>
      </svg>
    ),
  },
  {
    name: 'Electrical & Wiring',
    icon: (
      <svg viewBox="0 0 88 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <path d="M32 72 L44 12 L56 72Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
        <path d="M36 72 L44 28 L52 72Z" fill="#cbd5e1"/>
        <rect x="26" y="32" width="36" height="4"   rx="2"    fill="#3b82f6"/>
        <rect x="30" y="44" width="28" height="3.5" rx="1.75" fill="#3b82f6"/>
        <rect x="33" y="56" width="22" height="3"   rx="1.5"  fill="#3b82f6"/>
        <path d="M14 38 Q28 46 44 38 Q60 30 74 38" stroke="#1d4ed8" strokeWidth="2" fill="none"/>
        <path d="M16 44 Q28 52 44 44 Q60 36 72 44" stroke="#1d4ed8" strokeWidth="2" fill="none"/>
        <circle cx="44" cy="38" r="3.5" fill="#fbbf24"/>
        <circle cx="44" cy="44" r="3"   fill="#fbbf24"/>
        <circle cx="22" cy="38" r="2.5" fill="#f59e0b"/>
        <circle cx="66" cy="38" r="2.5" fill="#f59e0b"/>
        <path d="M64 14 L58 30 L63 30 L57 46 L70 26 L64 26 Z" fill="#fbbf24"/>
        <path d="M64 14 L58 30 L63 30 L57 46 L70 26 L64 26 Z" fill="#fde68a" opacity="0.5"/>
        <circle cx="44" cy="10" r="4" fill="#3b82f6"/>
      </svg>
    ),
  },
  {
    name: 'Industrial Applications',
    icon: (
      <svg viewBox="0 0 88 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <rect x="10" y="46" width="68" height="22" rx="5" fill="#334155"/>
        <rect x="10" y="46" width="68" height="8"  rx="5" fill="#475569"/>
        <rect x="16" y="52" width="22" height="10" rx="3" fill="#1e293b"/>
        <circle cx="22" cy="57" r="2.5" fill="#22c55e"/>
        <circle cx="30" cy="57" r="2.5" fill="#f59e0b"/>
        <circle cx="34" cy="54" r="1.5" fill="#ef4444"/>
        <circle cx="54" cy="34" r="18" fill="#64748b"/>
        <circle cx="54" cy="34" r="13" fill="#475569"/>
        <circle cx="54" cy="34" r="6"  fill="#334155"/>
        {[0,45,90,135,180,225,270,315].map((deg, i) => (
          <rect key={i} x="51" y="14" width="6" height="8" rx="2" fill="#94a3b8" transform={`rotate(${deg} 54 34)`}/>
        ))}
        <circle cx="24" cy="32" r="11"  fill="#94a3b8"/>
        <circle cx="24" cy="32" r="7.5" fill="#64748b"/>
        <circle cx="24" cy="32" r="3.5" fill="#334155"/>
        {[0,60,120,180,240,300].map((deg, i) => (
          <rect key={i} x="21.5" y="19" width="5" height="7" rx="1.5" fill="#cbd5e1" transform={`rotate(${deg} 24 32)`}/>
        ))}
        <rect x="68" y="24" width="8"  height="24" rx="3" fill="#475569"/>
        <rect x="66" y="22" width="12" height="6"  rx="3" fill="#64748b"/>
        <ellipse cx="72" cy="16" rx="4"   ry="5"   fill="#94a3b8" opacity="0.5"/>
        <ellipse cx="70" cy="10" rx="3"   ry="4"   fill="#cbd5e1" opacity="0.4"/>
        <ellipse cx="74" cy="7"  rx="2.5" ry="3.5" fill="#e2e8f0" opacity="0.3"/>
      </svg>
    ),
  },
  {
    name: 'Home & Office Building',
    icon: (
      <svg viewBox="0 0 88 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <ellipse cx="44" cy="74" rx="30" ry="5" fill="#1a2d5a" opacity="0.12"/>
        <rect x="16" y="42" width="56" height="30" rx="3" fill="#dbeafe"/>
        <rect x="16" y="42" width="56" height="8"  rx="2" fill="#bfdbfe"/>
        <path d="M10 44 L44 12 L78 44Z" fill="#1d4ed8"/>
        <path d="M10 44 L44 15 L78 44" stroke="#1e40af" strokeWidth="1.5" fill="none"/>
        <rect x="36" y="54" width="16" height="18" rx="3" fill="#f97316"/>
        <rect x="36" y="54" width="16" height="5"  rx="2" fill="#fb923c"/>
        <circle cx="50" cy="63" r="1.5" fill="#fde68a"/>
        <rect x="20" y="48" width="12" height="10" rx="2" fill="#93c5fd"/>
        <line x1="26" y1="48" x2="26" y2="58" stroke="#60a5fa" strokeWidth="1"/>
        <line x1="20" y1="53" x2="32" y2="53" stroke="#60a5fa" strokeWidth="1"/>
        <rect x="56" y="48" width="12" height="10" rx="2" fill="#93c5fd"/>
        <line x1="62" y1="48" x2="62" y2="58" stroke="#60a5fa" strokeWidth="1"/>
        <line x1="56" y1="53" x2="68" y2="53" stroke="#60a5fa" strokeWidth="1"/>
        <rect x="56" y="16" width="8"  height="16" rx="2" fill="#64748b"/>
        <rect x="54" y="14" width="12" height="5"  rx="2" fill="#94a3b8"/>
        <circle cx="60" cy="10" r="4"   fill="#e2e8f0" opacity="0.7"/>
        <circle cx="64" cy="7"  r="3"   fill="#f1f5f9" opacity="0.5"/>
      </svg>
    ),
  },
  {
    name: 'Roofing & Waterproofing',
    icon: (
      <svg viewBox="0 0 88 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <path d="M8 46 L44 10 L80 46Z" fill="#b45309"/>
        {[0,1,2,3].map((row) => {
          const count = row + 2;
          return Array.from({ length: count }, (_, i) => {
            const startX = 44 - (count * 9.5 / 2) + i * 9.5;
            const y = 38 - row * 8;
            return <rect key={`${row}-${i}`} x={startX} y={y} width="9" height="8" rx="1.5" fill={row % 2 === 0 ? '#d97706' : '#b45309'} stroke="#92400e" strokeWidth="0.5"/>;
          });
        })}
        <rect x="40" y="8" width="8" height="6" rx="2" fill="#92400e"/>
        <rect x="14" y="46" width="60" height="20" rx="3" fill="#fef3c7"/>
        <rect x="14" y="46" width="60" height="6"  rx="2" fill="#fde68a"/>
        <path d="M10 46 Q44 42 78 46" stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M10 46 Q44 42 78 46 L78 50 Q44 46 10 50 Z" fill="#bfdbfe" opacity="0.6"/>
        <ellipse cx="20" cy="60" rx="2.5" ry="3.5" fill="#38bdf8"/>
        <ellipse cx="28" cy="66" rx="2"   ry="2.8" fill="#7dd3fc"/>
        <ellipse cx="14" cy="66" rx="1.8" ry="2.5" fill="#0ea5e9"/>
        <path d="M62 56 L72 56 L72 52 L80 58 L72 64 L72 60 L62 60 Z" fill="#f97316" opacity="0.85"/>
      </svg>
    ),
  },
];

export default function IndustriesSection() {
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="mx-auto max-w-7xl px-4 sm:px-6">
      <style>{`
        @keyframes cardBounceIn {
          0%   { opacity: 0; transform: translateY(48px) scale(0.82); }
          55%  { opacity: 1; transform: translateY(-12px) scale(1.06); }
          75%  { transform: translateY(6px) scale(0.97); }
          90%  { transform: translateY(-3px) scale(1.01); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2">
          <span className="h-px w-8 bg-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-500">What We Support</span>
          <span className="h-px w-8 bg-amber-400" />
        </div>
        <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">Industries We Serve</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
          Our hardware and construction materials cater to a wide range of industries,
          offering reliable quality and performance for every application.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {INDUSTRIES.map((ind, i) => (
          <div
            key={ind.name}
            style={
              visible
                ? { animation: `cardBounceIn 0.65s cubic-bezier(0.34,1.56,0.64,1) ${i * 110}ms both` }
                : { opacity: 0 }
            }
            className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white px-3 py-6 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-lg"
          >
            <div className="h-16 w-16 sm:h-20 sm:w-20">
              {ind.icon}
            </div>
            <p className="mt-3 text-xs font-semibold leading-snug text-slate-700 sm:text-sm">
              {ind.name}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
