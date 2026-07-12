// ─── Shared network formatting helpers ───────────────────────────────────────
//
// Small, pure display helpers used across the network's data-backed pages
// (home, tier-lists, hoi4, poe1, sts2, news). Deliberately NOT importing the
// MTG hub's lib/mtgDraftView.ts formatter of the same shape — this lane keeps
// its own copy so the two surfaces never share an import across the file
// ownership boundary.

/**
 * Human freshness string relative to now, e.g. "2h ago", "3d ago". Past a
 * week, falls back to an absolute date rather than an ever-growing day count
 * that would start to misrepresent how current the data still is.
 */
export function formatFreshness(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "unknown";
  const ms = now.getTime() - then.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

/**
 * Absolute date, e.g. "Jun 29, 2026" — for hand-curated / reviewed stamps
 * where a relative "time ago" would imply a live-freshness guarantee the data
 * can't back up.
 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
