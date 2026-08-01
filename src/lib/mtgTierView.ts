// ─── Commander/Brawl + Constructed tier explorer view helpers (gl-0593) ─────
//
// Extends the cube filter bar pattern (gl-0571, lib/mtgDraftView.ts's
// "Cube filter bar" section) to the /mtg Commander & Brawl Tiers and
// Constructed Tiers sections. Facets are limited to fields these two payload
// shapes actually carry (CommanderTierRow, ConstructedTierRow) — no
// rarity/type/basis filter here since neither row carries those fields, and
// nothing here is ever fabricated to fill a facet out (METAHUB-SPEC.md).

import type { CommanderTierRow, ConstructedTierRow } from "@/lib/mtg";
import { TIER_ORDER, type Tier } from "@/lib/mtgDisplay";

// ── Commander & Brawl tier explorer ──────────────────────────────────────────

export function matchesCommanderSearch(row: CommanderTierRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return row.commander.toLowerCase().includes(q);
}

export const COMMANDER_COLOR_FILTERS = [
  "all",
  "white",
  "blue",
  "black",
  "red",
  "green",
  "multicolor",
  "colorless",
] as const;
export type CommanderColorFilter = (typeof COMMANDER_COLOR_FILTERS)[number];

const COLOR_NAME_TO_FILTER: Record<string, Exclude<CommanderColorFilter, "all" | "multicolor" | "colorless">> = {
  White: "white",
  Blue: "blue",
  Black: "black",
  Red: "red",
  Green: "green",
};

/** Buckets a commander row's real color_identity into the same
 * all/mono/multicolor/colorless vocabulary the cube filter bar's color
 * chips use (mtgDraftView.ts's CUBE_CATEGORY_FILTERS) — no "land" bucket
 * here since commander rows are decks, not cards. */
export function commanderColorCategory(
  row: CommanderTierRow
): Exclude<CommanderColorFilter, "all"> {
  const colors = row.color_identity;
  if (colors.length === 0) return "colorless";
  if (colors.length > 1) return "multicolor";
  return COLOR_NAME_TO_FILTER[colors[0]] ?? "multicolor";
}

export function matchesCommanderColor(
  row: CommanderTierRow,
  filter: CommanderColorFilter
): boolean {
  return filter === "all" || commanderColorCategory(row) === filter;
}

export const COMMANDER_TIER_FILTERS = ["all", ...TIER_ORDER] as const;
export type CommanderTierFilter = (typeof COMMANDER_TIER_FILTERS)[number];

export function matchesCommanderTier(
  row: CommanderTierRow,
  filter: CommanderTierFilter
): boolean {
  return filter === "all" || row.tier === filter;
}

export const COMMANDER_SORT_KEYS = ["tier", "commander", "deck_count"] as const;
export type CommanderSortKey = (typeof COMMANDER_SORT_KEYS)[number];

function commanderSortValue(row: CommanderTierRow, key: CommanderSortKey): number | string {
  switch (key) {
    case "tier":
      return TIER_ORDER.indexOf(row.tier);
    case "commander":
      return row.commander.toLowerCase();
    case "deck_count":
      return row.deck_count;
  }
}

/** Default sort direction the first time a column is activated — same
 * name-ish-reads-A-Z / everything-else-reads-best-first convention as
 * cubeSortDefaultDir. */
export function commanderSortDefaultDir(key: CommanderSortKey): "asc" | "desc" {
  return key === "commander" || key === "tier" ? "asc" : "desc";
}

/** Explicit client sort, only ever invoked once a visitor picks a column —
 * BucketBoard's true default (sortKey null) stays the deck_count-descending
 * order it has always used. */
export function sortCommanderRows(
  rows: CommanderTierRow[],
  key: CommanderSortKey,
  dir: "asc" | "desc"
): CommanderTierRow[] {
  const factor = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = commanderSortValue(a, key);
    const bv = commanderSortValue(b, key);
    if (typeof av === "string" && typeof bv === "string") {
      return av.localeCompare(bv) * factor;
    }
    return ((av as number) - (bv as number)) * factor;
  });
}

// ── Constructed tier explorer ────────────────────────────────────────────────

export function matchesConstructedSearch(row: ConstructedTierRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return row.archetype_or_deck.toLowerCase().includes(q);
}

export const CONSTRUCTED_TIER_FILTERS = ["all", ...TIER_ORDER, "unrated"] as const;
export type ConstructedTierFilter = (typeof CONSTRUCTED_TIER_FILTERS)[number];

export function matchesConstructedTier(
  row: ConstructedTierRow,
  filter: ConstructedTierFilter
): boolean {
  return filter === "all" || row.tier === filter;
}

export const CONSTRUCTED_SORT_KEYS = [
  "tier",
  "archetype_or_deck",
  "win_rate",
  "event_count",
] as const;
export type ConstructedSortKey = (typeof CONSTRUCTED_SORT_KEYS)[number];

/** Rated tiers S->D first, "unrated" (zero recorded match games) last —
 * identical ordering rule to MtgConstructedTierTable's own default sortRows. */
function constructedTierRank(t: ConstructedTierRow["tier"]): number {
  return t === "unrated" ? TIER_ORDER.length : TIER_ORDER.indexOf(t as Tier);
}

function constructedSortValue(
  row: ConstructedTierRow,
  key: ConstructedSortKey
): number | string | null {
  switch (key) {
    case "tier":
      return constructedTierRank(row.tier);
    case "archetype_or_deck":
      return row.archetype_or_deck.toLowerCase();
    case "win_rate":
      return row.win_rate;
    case "event_count":
      return row.event_count;
  }
}

export function constructedSortDefaultDir(key: ConstructedSortKey): "asc" | "desc" {
  return key === "archetype_or_deck" || key === "tier" ? "asc" : "desc";
}

/** Explicit client sort, only ever invoked once a visitor picks a column —
 * FormatBoard's true default (sortKey null) stays its own tier-then-win-rate
 * sortRows. Nulls (no recorded win rate) always trail regardless of
 * direction, same rule as sortCubeRows. */
export function sortConstructedRows(
  rows: ConstructedTierRow[],
  key: ConstructedSortKey,
  dir: "asc" | "desc"
): ConstructedTierRow[] {
  const factor = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = constructedSortValue(a, key);
    const bv = constructedSortValue(b, key);
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    if (typeof av === "string" && typeof bv === "string") {
      return av.localeCompare(bv) * factor;
    }
    return ((av as number) - (bv as number)) * factor;
  });
}
