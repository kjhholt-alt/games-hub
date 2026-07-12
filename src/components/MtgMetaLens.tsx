"use client";

import { useEffect, useState } from "react";

export interface MtgMetaLensOption {
  id: string;
  label: string;
  /** Receipt count shown on the chip when we have one real to show — e.g.
   * Commander row count, Premier Draft graded-card count. Omit (undefined)
   * rather than show a fake/zero count for lenses without data yet (Sealed,
   * Historic, a zero-row Brawl window). */
  count?: number;
}

export interface MtgMetaLensSection {
  id: string;
  label: string;
  /** Lens ids this section belongs to, or the literal "all" to render under
   * every lens unconditionally. Most sections list the specific lens id(s)
   * they belong to — including "all" itself as one of those ids for
   * content that's part of today's unfiltered page. */
  formats: string[] | "all";
  node: React.ReactNode;
}

const DEFAULT_LENS = "all";
const HASH_PREFIX = "#meta=";

function readLensFromHash(validIds: string[]): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (!hash.startsWith(HASH_PREFIX)) return null;
  const id = hash.slice(HASH_PREFIX.length);
  return validIds.includes(id) ? id : null;
}

/**
 * The meta lens — a chip rail that lets a visitor pick which format's world
 * they want (All, Standard, Premier Draft, Sealed, Historic, Brawl,
 * Competitive Brawl, Commander, Pioneer, Modern) and toggles PRE-RENDERED
 * server sections' visibility client-side. Every section stays in the
 * markup at all times (display:none via Tailwind's `hidden`, not removed
 * from the tree) so every lens's honest panels and tables stay crawlable —
 * this component never fetches, computes, or imports lib/mtg.ts; it only
 * shows/hides ReactNodes the server already rendered (see lib/mtg.ts's
 * header comment on why a client component can't cross that boundary).
 *
 * Default lens ("all") is read from no external state (no useSearchParams —
 * that would force this page dynamic), so the initial render always matches
 * today's page. Selecting a chip syncs the pick to location.hash
 * (`#meta=commander`) via history.replaceState (no scroll-jump, no history
 * spam); the hash is read back once on mount so shared/bookmarked links land
 * on the right lens.
 */
export function MtgMetaLens({
  lenses,
  leading,
  sections,
}: {
  lenses: MtgMetaLensOption[];
  /** Static content rendered between the rail and the gated sections — the
   * module index nav + sample banner today — unconditionally visible
   * regardless of the active lens. */
  leading?: React.ReactNode;
  sections: MtgMetaLensSection[];
}) {
  const [activeLens, setActiveLens] = useState(DEFAULT_LENS);

  // Hash -> state, read ONCE on mount. Deliberately not reactive to further
  // hash changes (e.g. back/forward) — the chips are the source of truth
  // for a normal visit; this just makes the initial landing honor a shared link.
  useEffect(() => {
    const fromHash = readLensFromHash(lenses.map((l) => l.id));
    if (fromHash) setActiveLens(fromHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectLens(id: string) {
    setActiveLens(id);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `${HASH_PREFIX}${id}`);
    }
  }

  return (
    <div>
      <div
        role="group"
        aria-label="Meta lens"
        className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 mb-4"
      >
        {lenses.map((lens) => {
          const active = lens.id === activeLens;
          return (
            <button
              key={lens.id}
              type="button"
              aria-pressed={active}
              onClick={() => selectLens(lens.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wide transition-colors ${
                active
                  ? "border-brass/50 bg-brass-dim text-brass"
                  : "border-border text-text-secondary hover:border-brass/30 hover:text-foreground"
              }`}
            >
              {lens.label}
              {lens.count !== undefined && (
                <span className="tabular-nums normal-case opacity-80">
                  {lens.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {leading}

      <div>
        {sections.map((s) => {
          const visible = s.formats === "all" || s.formats.includes(activeLens);
          return (
            <div key={s.id} className={visible ? undefined : "hidden"}>
              {s.node}
            </div>
          );
        })}
      </div>
    </div>
  );
}
