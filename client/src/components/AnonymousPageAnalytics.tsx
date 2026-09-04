import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const PROJECT_NAME = 'inference';
const VISITOR_ID_KEY = 'pm_anonymous_visitor_id_v1';

/**
 * Where page views are posted.
 *
 * Defaults to the same-origin API. The static demo has no API behind it, so it
 * sets VITE_ANALYTICS_ENDPOINT to the absolute URL of a deployed instance.
 *
 * This is a public URL and ends up in the client bundle — that is fine. The
 * Postgres connection string must NEVER be a VITE_ variable; it lives only in
 * the server's ANALYTICS_DATABASE_URL.
 */
const ENDPOINT = import.meta.env.VITE_ANALYTICS_ENDPOINT || '/api/_analytics/page-view';

function getVisitorId() {
  const existing = localStorage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
          (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16),
        );

  localStorage.setItem(VISITOR_ID_KEY, generated);
  return generated;
}

function getReferrer() {
  if (!document.referrer) return null;

  try {
    const url = new URL(document.referrer);
    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
}

export function AnonymousPageAnalytics() {
  const location = useLocation();
  const sentPaths = useRef<Set<string>>(new Set());

  useEffect(() => {
    const pagePath = location.pathname || '/';
    if (sentPaths.current.has(pagePath)) return;
    sentPaths.current.add(pagePath);

    const send = () => {
      try {
        const payload = JSON.stringify({
          project_name: PROJECT_NAME,
          page_path: pagePath,
          referrer: getReferrer(),
          anonymous_visitor_id: getVisitorId(),
        });
        // text/plain is a CORS-simple content type, so a cross-origin beacon
        // from the demo skips the preflight it would otherwise need. The route
        // reads the raw body, so the declared type does not matter to it.
        const blob = new Blob([payload], { type: 'text/plain' });
        const ok = navigator.sendBeacon?.(ENDPOINT, blob) ?? false;

        if (!ok) {
          fetch(ENDPOINT, {
            method: 'POST',
            keepalive: true,
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: payload,
          }).catch(() => {});
        }
      } catch {}
    };

    const schedule = () => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(send, { timeout: 4000 });
        return;
      }

      setTimeout(send, 2500);
    };

    if (document.readyState === 'complete') {
      schedule();
      return;
    }

    window.addEventListener('load', schedule, { once: true });
    return () => window.removeEventListener('load', schedule);
  }, [location.pathname]);

  return null;
}
