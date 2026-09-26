import { useEffect, useState } from 'react';

// Router minimal berbasis History API (cukup untuk /, /guru, dan /q/:token).
const EVENT = 'rejasa:navigate';

export function navigate(to: string, replace = false) {
  if (to === window.location.pathname) return;
  if (replace) window.history.replaceState(null, '', to);
  else window.history.pushState(null, '', to);
  window.dispatchEvent(new Event(EVENT));
}

export function usePath(): string {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const on = () => setPath(window.location.pathname);
    window.addEventListener('popstate', on);
    window.addEventListener(EVENT, on);
    return () => {
      window.removeEventListener('popstate', on);
      window.removeEventListener(EVENT, on);
    };
  }, []);
  return path;
}
