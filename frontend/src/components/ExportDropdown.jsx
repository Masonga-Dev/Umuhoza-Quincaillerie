import { useState, useEffect, useRef } from 'react';

const PERIODS = [
  { value: 'daily',   label: 'Daily',         desc: 'Today only' },
  { value: 'weekly',  label: 'Weekly',         desc: 'Last 7 days' },
  { value: 'monthly', label: 'Monthly',        desc: 'This month' },
  { value: 'yearly',  label: 'Yearly',         desc: 'This year' },
  { value: 'all',     label: 'All Time',       desc: 'All records' },
  { value: 'custom',  label: 'Custom Range',   desc: 'Pick dates' },
];

export function getPeriodStart(period) {
  if (period && typeof period === 'object' && period.period === 'custom') {
    return period.from ? new Date(period.from) : null;
  }
  const now = new Date();
  if (period === 'daily')   { const d = new Date(now); d.setHours(0,0,0,0); return d; }
  if (period === 'weekly')  { const d = new Date(now); d.setDate(d.getDate() - 6); d.setHours(0,0,0,0); return d; }
  if (period === 'monthly') { return new Date(now.getFullYear(), now.getMonth(), 1); }
  if (period === 'yearly')  { return new Date(now.getFullYear(), 0, 1); }
  return null;
}

export function getPeriodEnd(period) {
  if (period && typeof period === 'object' && period.period === 'custom') {
    if (period.to) { const d = new Date(period.to); d.setHours(23, 59, 59, 999); return d; }
  }
  return null;
}

export function getPeriodLabel(period) {
  if (!period) return 'all-time';
  if (typeof period === 'object' && period.period === 'custom') return 'custom';
  if (period === 'all') return 'all-time';
  return period;
}

export default function ExportDropdown({ onExport, label = 'Export CSV' }) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) { setShowCustom(false); setFromDate(''); setToDate(''); return; }
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (value) => {
    if (value === 'custom') { setShowCustom(true); return; }
    onExport(value);
    setOpen(false);
  };

  const handleCustomApply = () => {
    if (!fromDate || !toDate) return;
    onExport({ period: 'custom', from: new Date(fromDate), to: new Date(toDate) });
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-amber-300"
      >
        <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        {label}
        <svg className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <p className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
            Choose period
          </p>

          {!showCustom ? (
            PERIODS.map(({ value, label: pLabel, desc }) => (
              <button
                key={value}
                onClick={() => handleSelect(value)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm transition hover:bg-amber-50 group"
              >
                <span className="font-semibold text-slate-700 group-hover:text-amber-700">{pLabel}</span>
                <span className="text-xs text-slate-400 group-hover:text-amber-500">{desc}</span>
              </button>
            ))
          ) : (
            <div className="p-4 space-y-3">
              <button
                onClick={() => setShowCustom(false)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
                Back
              </button>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">To</label>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate}
                  onChange={e => setToDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </div>
              <button
                onClick={handleCustomApply}
                disabled={!fromDate || !toDate}
                className="w-full rounded-xl bg-amber-500 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Download CSV
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
