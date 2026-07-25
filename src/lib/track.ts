/**
 * Client-side tracking. Uses sendBeacon so a page view is recorded even when
 * the user navigates away immediately -- a plain fetch is cancelled on unload,
 * which silently loses exactly the bounce visits you most want to count.
 */
let lastTrackedPage = "";
let lastTrackedAt = 0;

export function trackPageView(page: string): void {
  const now = Date.now();
  // Next's App Router can fire the effect twice for one navigation; debounce
  // so a single visit is not counted as two.
  if (page === lastTrackedPage && now - lastTrackedAt < 5000) return;
  lastTrackedPage = page;
  lastTrackedAt = now;

  const payload = JSON.stringify({
    page,
    type: "pageview",
    referrer: document.referrer || undefined,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/t", new Blob([payload], { type: "application/json" }));
  } else {
    fetch("/api/t", { method: "POST", body: payload, keepalive: true }).catch(() => {});
  }
}
