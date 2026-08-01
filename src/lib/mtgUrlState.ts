// ─── Namespaced filter-bar URL state (gl-0593) ──────────────────────────────
//
// Generalizes MtgCubeExplorer's read/write-URL pattern (gl-0571) for reuse
// across several filter-bar instances mounted on the SAME page at once —
// /mtg's Commander/Brawl and Constructed sections render one explorer per
// format "world" simultaneously (MtgMetaLens just toggles visibility via
// CSS, it doesn't unmount them), so each instance's state lives under its
// own `${prefix}_*` key namespace and never touches another instance's keys
// or anything else already in the query string.
//
// Deliberately NOT useSearchParams/useRouter: these routes are statically
// rendered (ISR) with the full payload already present as props, so reacting
// to the URL through Next's router would force them dynamic for zero
// benefit — same rationale as MtgCubeExplorer's writeCubeStateToUrl.

export function asOneOf<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T
): T {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** Reads one namespaced param (`${prefix}_${key}`) from the current URL's
 * query string. Returns null on the server and before first mount — callers
 * hydrate real state from this in a useEffect, same two-pass pattern
 * MtgCubeExplorer uses to avoid an SSR/client markup mismatch. */
export function readNamespacedParam(prefix: string, key: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(`${prefix}_${key}`);
}

/** Writes a namespaced set of params back into the URL via
 * history.replaceState — no navigation, no new history entry, no scroll
 * jump. Every existing param outside this prefix (another instance's
 * namespace, or anything else already in the URL) is left untouched; a
 * null/undefined entry in `values` omits that key entirely, so an
 * unfiltered instance never litters the URL. */
export function writeNamespacedParams(
  prefix: string,
  values: Record<string, string | null | undefined>
): void {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams(window.location.search);
  for (const key of [...p.keys()]) {
    if (key.startsWith(`${prefix}_`)) p.delete(key);
  }
  for (const [key, value] of Object.entries(values)) {
    if (value) p.set(`${prefix}_${key}`, value);
  }
  const qs = p.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
  window.history.replaceState(null, "", url);
}
