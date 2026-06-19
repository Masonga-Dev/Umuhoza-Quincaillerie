import { useState, useCallback, useEffect } from 'react';

const EVENT = 'umuhoza-data-changed';

export function emitDataChanged() {
  window.dispatchEvent(new CustomEvent(EVENT));
  try { localStorage.setItem('umuhoza_data_ts', String(Date.now())); } catch {}
}

export function useDataRefresh() {
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = useCallback(() => setRefreshKey(k => k + 1), []);

  const bindRefresh = useCallback(() => {
    window.addEventListener(EVENT, bump);
    const onStorage = e => { if (e.key === 'umuhoza_data_ts') bump(); };
    window.addEventListener('storage', onStorage);
    const onVisible = () => { if (!document.hidden) bump(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener(EVENT, bump);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [bump]);

  return { refreshKey, bindRefresh };
}
