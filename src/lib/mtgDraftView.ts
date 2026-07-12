// ─── BuildKit Draft Ranker — client-safe view model ─────────────────────────
//
// Types + pure display/filter/sort helpers for /mtg/draft (schema
// "buildkit-mtg-draft@1", see METAHUB-SPEC.md's ADDENDUM). Deliberately
// split out of lib/mtgDraft.ts (the fs-based reader): the ranker table,
// cheat sheet, and set header are CLIENT components (search/sort/filter/set-
// switch are live interactions), and lib/mtgDraft.ts's `fs` import has no
// browser polyfill — any client component that transitively imports it fails
// the build. This file has zero Node dependencies and is safe to import from
// either side of the boundary; lib/mtgDraft.ts imports the payload TYPE from
// here for its reader's return type.
//
// These types mirror the REAL pipeline output verbatim (mtg-workstation/
// data/mtg-draft.json) — the web adapts to what the pipeline genuinely
// produces, never the reverse. Two real facts baked into today's payload
// that the UI must render honestly rather than hide:
//   - Only the active premier set (MSH) has status "published" with graded
//     rows; the two prior sets ship status "unavailable" (below 17lands'
//     publish floor for this run) with empty overall_rows.
//   - pair_rows is empty for every set today (17lands' public endpoint isn't
//     distinctly filtering every color pair yet) — the UI still offers the
//     pair picker, it just renders an honest pending state until upstream
//     data shows up.
//
// The Confidence TYPE is reused from lib/mtg.ts (same literal union values —
// one honesty vocabulary across the whole hub); it's a type-only import so
// it's erased at compile time and doesn't pull lib/mtg.ts's `fs` reader in.

import type { Confidence } from "@/lib/mtg";

// ─── Payload shape ───────────────────────────────────────────────────────────

export type DraftConfidence = Confidence;
export type DraftGrade = "S" | "A" | "B" | "C" | "D" | "F" | "unrated";
export type DraftSetStatus = "published" | "unavailable" | "sample" | "stale";

interface DraftRowBase {
  sources: string[];
  sample_size: number;
  computed_at: string;
  confidence: DraftConfidence;
}

export interface DraftCardRow extends DraftRowBase {
  card: string;
  /** WUBRG-order color substring, e.g. "U", "WB", "URG"; "" = colorless. */
  color: string;
  rarity: string;
  gih_wr: number | null;
  gih_games: number;
  oh_wr: number | null;
  oh_games: number;
  alsa: number | null;
  ata: number | null;
  iwd: number | null;
  gih_wr_shrunk: number | null;
  iwd_shrunk: number | null;
  draft_score: number | null;
  grade: DraftGrade;
  /** Optional — enriched from the cached Scryfall bulk data at payload-build
   * time (METAHUB-SPEC.md ADDENDUM 2). Absent when the pipeline couldn't
   * match the card name; never a guessed/placeholder URI. The Draft Ranker
   * only renders the hover preview (image_normal) — no thumbnails, to keep
   * the dense table dense — but art_crop is typed here since the pipeline
   * ships it on every card row. */
  art_crop?: string;
  image_normal?: string;
}

/** The engine only ever emits these two states for the archetypes module
 * (`status = "published" if rows else "unavailable"`, see
 * metahub/tiers.py's compute_archetypes) — deliberately narrower than
 * DraftSetStatus, which also carries "sample"/"stale" for the per-card
 * grading pipeline that archetypes doesn't share. */
export type ArchetypeStatus = "published" | "unavailable";

interface DraftArchetypeRowBase {
  sources: string[];
  sample_size: number;
  computed_at: string;
  confidence: DraftConfidence;
}

/** One 17lands color/color-pair archetype row (the Draft Ranker archetype
 * addendum, METAHUB-SPEC.md 2026-07-11) — a set-level DECK win rate, never a
 * per-card rating. `colors` is the WUBRG-order code the engine renamed from
 * 17lands' own `short_name` (e.g. "W", "UB", "WUR"); `color_name` is
 * 17lands' own label verbatim ("Mono-White", "Azorius (WU)"). `rank` is
 * 1-indexed WITHIN this row's own `color_count` group — mono colors ranked
 * only against other mono colors, two-color pairs only against other pairs,
 * any real 3+ color combination 17lands actually reported only against
 * combos of the same length — never compare `rank` across groups. A
 * zero-games row ships both `win_rate` and `rank` `null` rather than a
 * guessed number. */
export interface DraftArchetypeRow extends DraftArchetypeRowBase {
  color_name: string;
  colors: string;
  color_count: number;
  wins: number;
  games: number;
  win_rate: number | null;
  rank: number | null;
}

/** The optional per-set `archetypes` addendum — 17lands' `color_ratings`
 * leaderboard, additive to the per-card overall/pair/sealed rows above and
 * independent of the set's own `status` (archetypes can publish even when
 * overall PremierDraft grading is too sparse to grade, and vice versa).
 * Absent entirely (no `archetypes` key on the set block at all) when the
 * engine's fetch failed or was skipped for that set this run — fail-closed,
 * never an error placeholder; render nothing rather than guess. Even when
 * present, `status` can still be "unavailable" with empty `rows` (17lands
 * returned no combination distinct enough to publish this run). */
export interface DraftArchetypesModule {
  status: ArchetypeStatus;
  computed_at: string;
  methodology: string;
  attribution: string[];
  rows: DraftArchetypeRow[];
}

export interface DraftSetBlock {
  set_code: string;
  set_name: string;
  status: DraftSetStatus;
  computed_at: string;
  methodology: string;
  attribution: string[];
  early_data: boolean;
  total_games: number;
  overall_rows: DraftCardRow[];
  /** Keyed by two-color pair (e.g. "WU"); empty today for every set — see
   * module comment. Never invented client-side. */
  pair_rows: Record<string, DraftCardRow[]>;
  /** Additive + optional Sealed sibling to the PremierDraft fields above —
   * the IDENTICAL BuildKit Draft Score formula computed fresh over the
   * Sealed card pool (a card's Sealed grade is never mixed with its draft
   * grade), sourced from 17lands' `card_ratings` endpoint with
   * `format=Sealed`. Real fact as of this payload: 17lands serves Sealed as
   * a genuine event type (MSH logged ~11k ever-drawn games vs ~153k for
   * PremierDraft) but its public no-auth route currently returns NO
   * per-card win-rate stats for Sealed even when game totals are non-zero —
   * so `sealed_status` reads "unavailable" and `sealed_rows` ships empty
   * rather than a page of every card graded "unrated". This flips on
   * automatically the moment upstream enables real Sealed win rates. */
  sealed_status?: DraftSetStatus;
  sealed_methodology?: string;
  sealed_total_games?: number;
  sealed_rows?: DraftCardRow[];
  /** Additive + optional color-performance leaderboard — see
   * DraftArchetypesModule's doc comment above. Only MSH carries this as of
   * the 2026-07-12 payload; absence on another set is a real fact (the
   * engine's fetch failed or was skipped that run), never an error. */
  archetypes?: DraftArchetypesModule;
}

export interface MtgDraftPayload {
  schema: string;
  status: "sample" | "published";
  computed_at: string;
  boilerplate: string;
  sets: DraftSetBlock[];
}

/** True whenever the payload isn't a confirmed real-pipeline publish — drives
 * the page-wide SAMPLE DATA banner (reuses the same rule as lib/mtg.ts). */
export function isSampleDraftPayload(payload: MtgDraftPayload): boolean {
  return payload.status !== "published";
}

// ─── Client-safe formatting helpers (identical logic to lib/mtg.ts) ──────────

/** Rows with weak statistical backing render faded — identical rule to
 * lib/mtg.ts's isFadedConfidence. */
export function isFadedConfidence(confidence: DraftConfidence): boolean {
  return confidence === "low" || confidence === "sample";
}

/** 0-1 fraction -> "NN.N%", or an explicit "unrated" when 17lands has no
 * recorded games for the card — never a guessed number. */
export function formatWinRate(winRate: number | null): string {
  if (winRate === null) return "unrated";
  return `${(winRate * 100).toFixed(1)}%`;
}

/** Human freshness string relative to now, e.g. "2h ago", "3d ago". */
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
  return then.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Display constants ───────────────────────────────────────────────────────

export const GRADE_ORDER: DraftGrade[] = ["S", "A", "B", "C", "D", "F"];

export const GRADE_BLURB: Record<DraftGrade, string> = {
  S: "Elite — build around it",
  A: "Excellent, high first-pick priority",
  B: "Solid, playable in most decks",
  C: "Replacement level, fills a curve slot",
  D: "Below average, situational only",
  F: "Avoid outside a specific need",
  unrated: "No GIH data recorded yet",
};

const RARITY_ORDER = ["common", "uncommon", "rare", "mythic"];

export const RARITY_FILTERS = ["all", ...RARITY_ORDER] as const;
export type RarityFilter = (typeof RARITY_FILTERS)[number];

/** The five WUBRG colors, in Wizards' canonical wheel order. */
export const MONO_COLORS = ["W", "U", "B", "R", "G"] as const;

/** All 10 two-color guild pairs, in WUBRG order, with the (real, standard)
 * guild name as a friendlier label — no invented data, just Magic's own
 * naming. */
export const COLOR_PAIRS: { key: string; guild: string }[] = [
  { key: "WU", guild: "Azorius" },
  { key: "UB", guild: "Dimir" },
  { key: "BR", guild: "Rakdos" },
  { key: "RG", guild: "Gruul" },
  { key: "GW", guild: "Selesnya" },
  { key: "WB", guild: "Orzhov" },
  { key: "UR", guild: "Izzet" },
  { key: "BG", guild: "Golgari" },
  { key: "RW", guild: "Boros" },
  { key: "GU", guild: "Simic" },
];

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/** Per-pair rows, tolerant of either color order the engine might key by
 * ("WU" vs "UW") since pair_rows is empty in every payload observed so far
 * and the exact key convention hasn't been exercised yet. */
export function getPairRows(set: DraftSetBlock, pairKey: string): DraftCardRow[] {
  const reversed = pairKey.split("").reverse().join("");
  return set.pair_rows[pairKey] ?? set.pair_rows[reversed] ?? [];
}

export function matchesSearch(row: DraftCardRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return row.card.toLowerCase().includes(q);
}

export function matchesRarityFilter(row: DraftCardRow, rarity: RarityFilter): boolean {
  return rarity === "all" || row.rarity === rarity;
}

/** `colors` is a set of selected single-letter filters, "C" meaning
 * colorless. Empty selection = no filtering. A row matches if it contains
 * ANY selected color (OR, not AND) — the natural "show me cards I could play
 * in one of these colors" read for a draft filter. */
export function matchesColorFilter(row: DraftCardRow, colors: string[]): boolean {
  if (colors.length === 0) return true;
  if (colors.includes("C") && row.color === "") return true;
  return colors.some((c) => c !== "C" && row.color.includes(c));
}

export type DraftSortKey =
  | "rank"
  | "card"
  | "color"
  | "rarity"
  | "grade"
  | "draft_score"
  | "gih_wr"
  | "iwd"
  | "alsa"
  | "sample_size";

function sortValue(row: DraftCardRow, key: DraftSortKey): number | string | null {
  switch (key) {
    case "rank":
    case "draft_score":
      return row.draft_score;
    case "card":
      return row.card.toLowerCase();
    case "color":
      return row.color;
    case "rarity":
      return RARITY_ORDER.indexOf(row.rarity);
    case "grade":
      return GRADE_ORDER.indexOf(row.grade as (typeof GRADE_ORDER)[number]);
    case "gih_wr":
      return row.gih_wr;
    case "iwd":
      return row.iwd;
    case "alsa":
      return row.alsa;
    case "sample_size":
      return row.sample_size;
    default:
      return null;
  }
}

/** Sorts by an arbitrary column, nulls/unrated always trailing regardless of
 * direction (a missing stat is never "first" just because the user flipped
 * to ascending). */
export function sortDraftRows(
  rows: DraftCardRow[],
  key: DraftSortKey,
  dir: "asc" | "desc"
): DraftCardRow[] {
  const factor = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = sortValue(a, key);
    const bv = sortValue(b, key);
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    if (typeof av === "string" && typeof bv === "string") {
      return av.localeCompare(bv) * factor;
    }
    return ((av as number) - (bv as number)) * factor;
  });
}

/** Draft Score rank (1 = best) computed once over the FULL row set (before
 * search/rarity/color filtering), keyed by card name, so the "#" column
 * reflects a card's real standing even while the visible table is filtered
 * or sorted by something else. Unrated cards get no rank. */
export function draftScoreRanks(rows: DraftCardRow[]): Map<string, number> {
  const ranked = sortDraftRows(rows, "draft_score", "desc").filter(
    (r) => r.draft_score !== null
  );
  return new Map(ranked.map((r, i) => [r.card, i + 1]));
}

export function formatDraftScore(score: number | null): string {
  if (score === null) return "—";
  return `${score >= 0 ? "+" : ""}${score.toFixed(2)}`;
}

export function formatDecimal(value: number | null, digits = 2): string {
  return value === null ? "—" : value.toFixed(digits);
}

/** IWD (improvement when drawn) ships as a win-rate fraction delta —
 * render 17lands-style signed percentage points, e.g. 0.102 -> "+10.2pp". */
export function formatIwd(value: number | null): string {
  if (value === null) return "—";
  const pp = value * 100;
  return `${pp >= 0 ? "+" : ""}${pp.toFixed(1)}pp`;
}

/** "C" for colorless, otherwise the raw WUBRG substring — the payload
 * already carries colors in wheel order so no reordering is needed. */
export function colorPipLabel(color: string): string {
  return color === "" ? "C" : color;
}

export interface CheatSheetGroup {
  label: string;
  color: string;
  rows: DraftCardRow[];
}

function byScoreDesc(a: DraftCardRow, b: DraftCardRow): number {
  if (a.draft_score === null && b.draft_score === null) return 0;
  if (a.draft_score === null) return 1;
  if (b.draft_score === null) return -1;
  return b.draft_score - a.draft_score;
}

/** Groups a rarity's rows into the 5 mono-color lanes plus a trailing
 * "Multi / Colorless" lane — the layout drafters actually keep open on a
 * second screen. Empty lanes are dropped rather than shown blank. */
export function cheatSheetGroups(
  rows: DraftCardRow[],
  rarity: "common" | "uncommon",
  limit = 8
): CheatSheetGroup[] {
  const pool = rows.filter((r) => r.rarity === rarity);
  const monoGroups: CheatSheetGroup[] = MONO_COLORS.map((c) => ({
    label: c,
    color: c,
    rows: pool
      .filter((r) => r.color === c)
      .sort(byScoreDesc)
      .slice(0, limit),
  }));
  const rest = pool
    .filter((r) => r.color.length !== 1)
    .sort(byScoreDesc)
    .slice(0, limit);
  return [...monoGroups, { label: "Multi / Colorless", color: "", rows: rest }].filter(
    (g) => g.rows.length > 0
  );
}

/** Scryfall exact-name search link — works without a collector number
 * (which the payload doesn't carry) and never guesses at a card ID. */
export function scryfallSearchUrl(card: string): string {
  const q = `!"${card}"`;
  return `https://scryfall.com/search?q=${encodeURIComponent(q)}`;
}

// ─── Archetype (color performance) helpers ───────────────────────────────────

export interface ArchetypeGroups {
  pairs: DraftArchetypeRow[];
  mono: DraftArchetypeRow[];
  multi: DraftArchetypeRow[];
}

/** Regroups the engine's already-ranked rows (sorted color_count asc, then
 * rank asc within each group) into the drafter-friendly reading order —
 * two-color pairs first (the archetype drafters actually chase), then mono
 * colors, then any real 3+ color combination 17lands reported this run.
 * Each group keeps the engine's own within-group rank order untouched;
 * nothing is re-sorted here. */
export function groupArchetypeRows(rows: DraftArchetypeRow[]): ArchetypeGroups {
  return {
    pairs: rows.filter((r) => r.color_count === 2),
    mono: rows.filter((r) => r.color_count === 1),
    multi: rows.filter((r) => r.color_count >= 3),
  };
}

/** Strips 17lands' redundant "(CODE)" suffix from a guild/pair archetype
 * name for display next to ManaDots, which already renders the color code
 * as pips — e.g. "Azorius (WU)" -> "Azorius". Mono-color names ("Mono-
 * White") carry no such suffix and pass through unchanged. Cosmetic only;
 * the payload's own `color_name` and `colors` fields are never altered. */
export function formatArchetypeName(colorName: string): string {
  return colorName.replace(/\s*\([A-Za-z]{2,5}\)\s*$/, "");
}
