// ─── Slay the Spire 2 tier-list engine ───────────────────────────────────────
//
// Mirrors the data-driven Deadlock tier-list pattern (src/lib/deadlock.ts), but
// the meta source is our OWN self-play / card-rating pipeline rather than a public
// match API. The buildkit-mods StS2 toolkit maintains a card-db that aggregates the
// best public tier lists into a single 0-100 score + S–D tier per card and relic,
// kept patch-current (see buildkit-mods/slay-the-spire-2/card-db/README.md). That
// aggregate is the same data its in-game 0-100 rater uses to grade shop/reward picks.
//
// `scripts/generate-sts2-tierlist.mjs` joins that card-db (ratings + catalog + meta)
// into the vendored `src/data/sts2-snapshot.json` this module reads. The games-hub
// build can't reach the buildkit-mods repo, so — exactly like the Deadlock snapshot —
// the committed JSON is the source the page renders, refreshed by `npm run gen:sts2`.
//
// Everything here is PURE (no fs, no network): load → filter → group → sort, all at
// build time, so the page is fully static.

import snapshot from "@/data/sts2-snapshot.json";

export type TierLetter = "S" | "A" | "B" | "C" | "D";
export type ItemKind = "card" | "relic";

/** One rated card or relic after the card-db join (shape of sts2-snapshot.json items). */
export interface RatedItem {
  id: string;
  name: string;
  kind: ItemKind;
  tier: TierLetter;
  /** Aggregate 0–100 score (weighted mean of the source tier lists). */
  score: number;
  /** Character class for cards (Ironclad/Silent/Defect/Necrobinder/Regent/Colorless), "Relic" for relics. */
  character: string;
  /** Card type: Attack | Skill | Power. null for relics. */
  type: string | null;
  rarity: string | null;
  /** Energy cost for cards. null for relics / variable-cost cards. */
  cost: number | null;
  /** How many source lists rated this id (more = firmer consensus). */
  nSources: number;
  /** Tier spread across sources (0 = unanimous; higher = the lists disagree). */
  spread: number;
  confidence: string;
  /** 1-based overall position (S first, then score desc). */
  rank: number;
}

export interface Sts2Snapshot {
  /** ISO timestamp the snapshot was generated. */
  generatedAt: string;
  /** Game patch the ratings reflect (e.g. "v0.106.1"). */
  gamePatch: string | null;
  /** Date the underlying source tier lists were last refreshed. */
  sourcesUpdated: string | null;
  /** Human-readable names of the aggregated tier lists. */
  sources: string[];
  counts: { total: number; cards: number; relics: number };
  items: RatedItem[];
}

export const TIER_ORDER: TierLetter[] = ["S", "A", "B", "C", "D"];

export const TIER_BLURB: Record<TierLetter, string> = {
  S: "Run-defining — snap-pick almost every time",
  A: "Excellent — a high-priority pick into most decks",
  B: "Solid — a dependable role-player",
  C: "Situational — wants the right deck or fight",
  D: "Filler — only when nothing better is offered",
};

/** The character / pool facets shown as filter chips, in display order. */
export const CHARACTERS = [
  "Ironclad",
  "Silent",
  "Defect",
  "Necrobinder",
  "Regent",
  "Colorless",
  "Neutral",
] as const;

/** The whole vendored snapshot, typed. */
export function getSnapshot(): Sts2Snapshot {
  return snapshot as Sts2Snapshot;
}

export interface ItemFilter {
  kind?: ItemKind;
  /** Restrict to one character/pool (cards only). */
  character?: string;
}

/** Filter the items by kind and/or character. Pure. */
export function filterItems(
  items: RatedItem[],
  filter: ItemFilter = {}
): RatedItem[] {
  return items.filter((it) => {
    if (filter.kind && it.kind !== filter.kind) return false;
    if (filter.character && it.character !== filter.character) return false;
    return true;
  });
}

/** Group rated items by tier, in S→D order, dropping empty tiers. Pure. */
export function groupByTier(
  items: RatedItem[]
): { letter: TierLetter; items: RatedItem[] }[] {
  return TIER_ORDER.map((letter) => ({
    letter,
    items: items.filter((it) => it.tier === letter),
  })).filter((g) => g.items.length > 0);
}

/** Count items per tier (for the summary bar). Pure. */
export function tierCounts(items: RatedItem[]): Record<TierLetter, number> {
  const out: Record<TierLetter, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 };
  for (const it of items) out[it.tier] += 1;
  return out;
}

/** The characters that actually have cards in the snapshot, in display order. Pure. */
export function presentCharacters(items: RatedItem[]): string[] {
  const have = new Set(
    items.filter((i) => i.kind === "card").map((i) => i.character)
  );
  return CHARACTERS.filter((c) => have.has(c));
}
