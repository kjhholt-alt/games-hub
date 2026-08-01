// ─── Client-safe MTG display/formatting helpers (gl-0593) ───────────────────
//
// Pure, fs-free helpers split out of lib/mtg.ts so components that must run
// in the browser (the Commander/Constructed tier explorers' client-side
// re-render on filter/sort — MtgCommanderTierExplorer/
// MtgConstructedTierExplorer) can use them without pulling lib/mtg.ts's
// `import fs from "fs"` reader boundary into the client bundle. lib/mtg.ts
// re-exports everything here, so none of its existing (server-only)
// importers need to change — this is a pure split, not a behavior change.

export type Tier = "S" | "A" | "B" | "C" | "D";
export type CommanderBucket = "trending" | "established";

export const TIER_ORDER: Tier[] = ["S", "A", "B", "C", "D"];

/** Known format ids -> display names, for rows (like commander_tiers) that
 * only carry the id. Falls back to the raw id for anything unrecognized
 * rather than hiding it. */
export const FORMAT_LABEL: Record<string, string> = {
  standard: "Standard",
  competitivebrawl: "Competitive Brawl",
  standardbrawl: "Brawl",
  commander: "Commander",
  pioneer: "Pioneer",
  modern: "Modern",
  historic: "Historic",
  timeless: "Timeless",
};

export function formatLabel(id: string): string {
  return FORMAT_LABEL[id] ?? id;
}

const COLOR_PIP: Record<string, string> = {
  White: "W",
  Blue: "U",
  Black: "B",
  Red: "R",
  Green: "G",
};
const WUBRG_ORDER = ["White", "Blue", "Black", "Red", "Green"];

/** Full color names -> WUBRG-order pip string, "C" for colorless. */
export function colorIdentityPips(colors: string[]): string {
  if (colors.length === 0) return "C";
  return WUBRG_ORDER.filter((c) => colors.includes(c))
    .map((c) => COLOR_PIP[c] ?? "")
    .join("");
}

/** Rows with weak statistical backing render faded with the count visible —
 * "the one trick the sharpest competitor does for ONE format; we do it
 * everywhere" (METAHUB-SPEC.md). */
export function isFadedConfidence(confidence: "high" | "medium" | "low" | "sample"): boolean {
  return confidence === "low" || confidence === "sample";
}

export const BUCKET_LABEL: Record<CommanderBucket, string> = {
  trending: "Trending (newest decks)",
  established: "Established (most-viewed decks)",
};

/** Split commander_tiers rows into trending / established sections, dropping
 * an empty bucket. */
export function groupByBucket<T extends { bucket: CommanderBucket }>(
  rows: T[]
): { bucket: CommanderBucket; rows: T[] }[] {
  const buckets: CommanderBucket[] = ["trending", "established"];
  return buckets
    .map((bucket) => ({ bucket, rows: rows.filter((r) => r.bucket === bucket) }))
    .filter((g) => g.rows.length > 0);
}

/** Group constructed_tiers rows by format, Standard/Pioneer/Modern first
 * (the spec's named formats) then anything else alphabetically — never
 * silently dropping a format the engine adds later. */
const CONSTRUCTED_FORMAT_ORDER = ["standard", "pioneer", "modern"];

export function groupByConstructedFormat<T extends { format: string }>(
  rows: T[]
): { format: string; rows: T[] }[] {
  const present = [...new Set(rows.map((r) => r.format))];
  const ordered = [
    ...CONSTRUCTED_FORMAT_ORDER.filter((f) => present.includes(f)),
    ...present.filter((f) => !CONSTRUCTED_FORMAT_ORDER.includes(f)).sort(),
  ];
  return ordered.map((format) => ({
    format,
    rows: rows.filter((r) => r.format === format),
  }));
}

/** 0-1 fraction -> "NN.N%", or an explicit "unrated" when there's no
 * recorded win rate for the row — never a guessed number. */
export function formatWinRate(winRate: number | null): string {
  if (winRate === null) return "unrated";
  return `${(winRate * 100).toFixed(1)}%`;
}

/** Kebab-case a commander name for use as a URL slug. Strips diacritics
 * defensively (Scryfall names are occasionally accented) via Unicode
 * normalization + a `\p{M}` (combining mark) strip, lowercases, and
 * collapses everything that isn't a-z0-9 into single hyphens — handles
 * punctuation-heavy real names (e.g. "K'rrik, Son of Yawgmoth") and
 * double-faced " // " commanders the same way. Never returns an empty
 * string for a non-empty input; a name that's entirely punctuation (never
 * seen in practice) falls back to "commander" rather than an empty slug.
 * Lives here (not lib/mtgCommanderPages.ts, which also imports the fs-based
 * getMtgMeta) so client components can use it without pulling fs into the
 * browser bundle — see this file's header comment. */
export function slugifyCommander(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "commander";
}
