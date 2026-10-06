import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useLanguage } from '../i18n/LanguageContext';

const TYPE_META = {
  new_order:        { color: 'bg-blue-100 text-blue-700',     route: '/admin/orders' },
  pending_payment:  { color: 'bg-amber-100 text-amber-700',   route: '/admin/payments' },
  low_stock:        { color: 'bg-orange-100 text-orange-700', route: '/admin/stock' },
  out_of_stock:     { color: 'bg-red-100 text-red-700',       route: '/admin/stock' },
  new_purchase:     { color: 'bg-emerald-100 text-emerald-700', route: '/admin/purchases' },
  purchase_return:  { color: 'bg-purple-100 text-purple-700', route: '/admin/purchase-returns' },
  sale_return:      { color: 'bg-cyan-100 text-cyan-700',     route: '/admin/sales-returns' },
};

export default function NotificationBell() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const loadCount = useCallback(async () => {
    try {
      const { data } = await API.get('/notifications/unread-count');
      setUnread(Number(data.unread_count || 0));
    } catch { /* silent — poll never breaks the header */ }
  }, []);

  const loadList = useCallback(async () => {
    try {
      const { data } = await API.get('/notifications?limit=15');
      setItems(data.notifications || []);
      setUnread(Number(data.unread_count || 0));
    } catch { /* silent */ }
  }, []);

  // Poll unread count every 60s
  useEffect(() => {
    loadCount();
    const id = setInterval(loadCount, 60000);
    return () => clearInterval(id);
  }, [loadCount]);

  useEffect(() => {
    if (!open) return;
    loadList();
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open, loadList]);

  const handleClick = async (n) => {
    try {
      if (!n.is_read) await API.patch(`/notifications/${n.id}/read`);
    } catch { /* ignore */ }
    setOpen(false);
    const route = TYPE_META[n.type]?.route;
    if (route) navigate(route);
  };

  const markAll = async () => {
    try {
      await API.patch('/notifications/read-all');
      loadList();
    } catch { /* ignore */ }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-orange-400 hover:text-orange-500"
        aria-label={t('admin.notifications.title')}
      >
        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t('admin.notifications.title')}</p>
            {unread > 0 && (
              <button onClick={markAll} className="text-[11px] font-semibold text-orange-500 hover:underline">
                {t('admin.notifications.markAll')}
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!items.length ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">{t('admin.notifications.empty')}</p>
            ) : items.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-orange-50/50 ${n.is_read ? 'opacity-60' : ''}`}
              >
                <span className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${n.is_read ? 'bg-slate-300' : 'bg-orange-500'}`} />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-slate-800">{n.title}</span>
                  {n.body && <span className="mt-0.5 block truncate text-[11px] text-slate-500">{n.body}</span>}
                  <span className="mt-0.5 block text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
