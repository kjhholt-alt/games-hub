// ─── HOI4 strategy-meta engine ───────────────────────────────────────────────
//
// Mirrors the Deadlock tier-list pattern (lib/deadlock.ts) but for a CURATED
// dataset rather than a live API: HOI4 has no open win-rate endpoint, so the
// source is the hand-verified hoi4-playbook data (see data/hoi4-nations.ts for
// provenance). The transforms here are PURE (no fs, no network) so they run at
// build time and can be unit tested.
//
// The "tier" is an editorial single-player strength rating (S/A/B/C), not a
// win-rate cut — the page is explicit about that.

import {
  HOI4_NATIONS,
  type Hoi4Nation,
  type Hoi4Tier,
  type Hoi4Path,
} from "../data/hoi4-nations";

export type { Hoi4Nation, Hoi4Tier, Hoi4Path };

/** Tier display order, strongest first. */
export const TIER_ORDER: Hoi4Tier[] = ["S", "A", "B", "C"];

/** One-line meaning of each strength tier. */
export const TIER_BLURB: Record<Hoi4Tier, string> = {
  S: "Strongest & most forgiving — snowball to a win with room for error",
  A: "Excellent — a clear plan and strong tools, with a real weakness to manage",
  B: "Demanding — playable and rewarding, but punishes early mistakes",
  C: "Hard mode — survival-first, every focus and division has to count",
};

/** Faction / win-condition labels + the accent color token each maps to. */
export const PATH_META: Record<
  Hoi4Path,
  { label: string; color: string }
> = {
  axis: { label: "Axis", color: "red" },
  allies: { label: "Allies", color: "cyan" },
  comintern: { label: "Comintern", color: "amber" },
  resistance: { label: "Resistance", color: "purple" },
};

export interface Hoi4MetaData {
  /** ISO date the dataset was last reviewed against the live meta. */
  reviewedAt: string;
  /** The game patch the guidance reflects. */
  patch: string;
  nations: Hoi4Nation[];
}

/**
 * Group the majors by tier in S→C order, dropping any empty tier. Pure — safe at
 * build time or in tests.
 */
export function groupByTier(
  nations: Hoi4Nation[] = HOI4_NATIONS
): { letter: Hoi4Tier; nations: Hoi4Nation[] }[] {
  return TIER_ORDER.map((letter) => ({
    letter,
    nations: nations.filter((n) => n.tier === letter),
  })).filter((g) => g.nations.length > 0);
}

/** Count of nations per faction path (for the summary strip). */
export function countByPath(
  nations: Hoi4Nation[] = HOI4_NATIONS
): { path: Hoi4Path; label: string; count: number }[] {
  return (Object.keys(PATH_META) as Hoi4Path[])
    .map((path) => ({
      path,
      label: PATH_META[path].label,
      count: nations.filter((n) => n.path === path).length,
    }))
    .filter((p) => p.count > 0);
}
