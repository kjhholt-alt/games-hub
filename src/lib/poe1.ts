// ─── PoE1 "Return of the Ancestors" meta tier-list engine ─────────────────────
//
// PATH OF EXILE 1 ONLY — never mixes in PoE2 data, never surfaces minion DPS.
//
// Mirrors the data-driven shape of lib/deadlock.ts, but the upstream isn't a live
// win-rate API: PoE event-league ladder data is too sparse this early and
// poe.ninja's build-overview REST endpoints now 404. So the source is our own
// curated, sourced dataset in data/poe1-meta.ts (ported from the poe1-startforge
// planner). These transforms are PURE — safe at build time and unit-testable.

import {
  POE1_META,
  POE1_SOURCES,
  type Poe1Meta,
  type Poe1MetaEntry,
  type Poe1Source,
  type MetaCategory,
  type TierLetter,
} from "../data/poe1-meta";

export type { TierLetter, MetaCategory, Poe1MetaEntry, Poe1Source };

export const TIER_ORDER: TierLetter[] = ["S", "A", "B", "C", "D"];

/** Sort weight so tiers order S→D regardless of array order. */
const TIER_WEIGHT: Record<TierLetter, number> = {
  S: 0,
  A: 1,
  B: 2,
  C: 3,
  D: 4,
};

export const TIER_BLURB: Record<TierLetter, string> = {
  S: "Top of the meta — the strongest event picks right now",
  A: "Excellent — reliably strong all-rounders",
  B: "Solid — dependable with the right pilot or gear",
  C: "Situational — comfy but a lower ceiling",
  D: "Off-meta — unproven or gimmick picks",
};

/** The three lenses the page can rank by. */
export const CATEGORIES: { id: MetaCategory; label: string; blurb: string }[] = [
  {
    id: "build",
    label: "Builds",
    blurb: "Ranked league-start build picks for the event.",
  },
  {
    id: "ascendancy",
    label: "Ascendancies",
    blurb: "The 19 Phrecian alternate ascendancies, ranked by event strength.",
  },
  {
    id: "skill",
    label: "Skills",
    blurb: "The main skills carrying the event's consensus starters.",
  },
];

export const CATEGORY_LABEL: Record<MetaCategory, string> = {
  build: "Build",
  ascendancy: "Ascendancy",
  skill: "Skill",
};

/** All entries for one category, ordered S→D (then by name for stability). */
export function entriesByCategory(
  category: MetaCategory,
  meta: Poe1Meta = POE1_META
): Poe1MetaEntry[] {
  return meta.entries
    .filter((e) => e.category === category)
    .slice()
    .sort(
      (a, b) =>
        TIER_WEIGHT[a.tier] - TIER_WEIGHT[b.tier] ||
        a.name.localeCompare(b.name)
    );
}

/** Group one category's entries by tier, in S→D order, dropping empty tiers. */
export function groupByTier(
  category: MetaCategory,
  meta: Poe1Meta = POE1_META
): { letter: TierLetter; entries: Poe1MetaEntry[] }[] {
  const inCat = entriesByCategory(category, meta);
  return TIER_ORDER.map((letter) => ({
    letter,
    entries: inCat.filter((e) => e.tier === letter),
  })).filter((g) => g.entries.length > 0);
}

/** Resolve an entry's source ids to full source records (skips unknown ids). */
export function resolveSources(
  entry: Poe1MetaEntry,
  registry: Record<string, Poe1Source> = POE1_SOURCES
): Poe1Source[] {
  return entry.sources
    .map((id) => registry[id])
    .filter((s): s is Poe1Source => Boolean(s));
}

/** Every distinct source cited anywhere in the meta, official first. */
export function allCitedSources(meta: Poe1Meta = POE1_META): Poe1Source[] {
  const ids = new Set<string>();
  for (const e of meta.entries) for (const id of e.sources) ids.add(id);
  const kindWeight = { official: 0, community: 1, tool: 2 } as const;
  return [...ids]
    .map((id) => POE1_SOURCES[id])
    .filter((s): s is Poe1Source => Boolean(s))
    .sort(
      (a, b) =>
        kindWeight[a.kind] - kindWeight[b.kind] || a.title.localeCompare(b.title)
    );
}

/** Days remaining in the event (>= 0), relative to `now`. */
export function daysRemaining(meta: Poe1Meta = POE1_META, now = new Date()): number {
  const end = new Date(meta.endsAt).getTime();
  const ms = end - now.getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/** Re-export the dataset so pages import a single module. */
export { POE1_META };
export type { Poe1Meta };
