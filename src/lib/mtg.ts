// ─── BuildKit MTG Meta Hub reader ────────────────────────────────────────────
//
// The mtg-workstation metahub engine writes one payload to public/mtg-meta.json
// (schema "buildkit-mtg-meta@1"). Every module inside it (commander tiers,
// limited tiers, banlist, calendar, formats) carries its own freshness stamp,
// methodology, and attribution; every row inside a module carries the honesty
// fields that are this product's actual moat: sources[], sample_size,
// computed_at, confidence. See mtg-workstation/METAHUB-SPEC.md — it is law.
//
// These types mirror the REAL pipeline output verbatim (mtg-workstation/
// data/mtg-meta.json) — per the honest-data doctrine the web adapts to what
// the pipeline genuinely produces, never the reverse. Do not add fields the
// engine doesn't emit.
//
// The gate: the page always renders whatever is in the file, but shows a
// visible SAMPLE DATA banner whenever `status !== "published"` — see
// isSamplePayload() below. Nothing here silently upgrades sample data into
// something that looks real.

import fs from "fs";
import path from "path";
import { TIER_ORDER, type CommanderBucket, type Tier } from "./mtgDisplay";

// Re-exports every pure display/formatting helper split out to
// lib/mtgDisplay.ts (gl-0593) — kept fs-free so client components (the tier
// explorers) can import them without pulling this file's fs reader into the
// browser bundle. Every existing importer of these names from "@/lib/mtg"
// keeps working unchanged.
export * from "./mtgDisplay";

// ─── Shared row/module shape ────────────────────────────────────────────────

export type Confidence = "high" | "medium" | "low" | "sample";
export type ModuleStatus =
  | "sample"
  | "published"
  | "stale"
  | "pending_key"
  | "pending_history"
  | "unavailable";
export type LimitedTier = Tier | "unrated";

/** Fields every row carries — the honesty rail, applied everywhere. Sources
 * are plain citation strings from the engine (e.g. "Decklists via Archidekt
 * (archidekt.com)") — not a {name,url} pair, so they render as text, not
 * links. Individual rows carry their own real links where the engine gives
 * one (deck_url, wizards_announcements_url). */
interface MtgRowBase {
  sources: string[];
  sample_size: number;
  computed_at: string;
  confidence: Confidence;
}

export interface CommanderTierRow extends MtgRowBase {
  commander: string;
  /** Format id, e.g. "commander" | "competitivebrawl". */
  format: string;
  bucket: CommanderBucket;
  deck_count: number;
  /** Full color names as Scryfall reports them, e.g. ["Black", "Green"]. */
  color_identity: string[];
  tier: Tier;
  top_inclusions: string[];
  deck_url: string;
  /** Optional — enriched from the cached Scryfall bulk data at payload-build
   * time (METAHUB-SPEC.md ADDENDUM 2). Absent when the pipeline couldn't
   * match the commander name to a card; never a guessed/placeholder URI. */
  art_crop?: string;
  image_normal?: string;
}

export interface LimitedTierRow extends MtgRowBase {
  card: string;
  set: string;
  color: string;
  rarity: string;
  /** 0-1 fraction, or null when 17lands has no recorded games for the card. */
  win_rate: number | null;
  tier: LimitedTier;
  /** Optional — see CommanderTierRow's art_crop/image_normal doc. */
  art_crop?: string;
  image_normal?: string;
}

export interface BanlistFormatRow extends MtgRowBase {
  format: string;
  format_name: string;
  banned: string[];
  restricted: string[];
  wizards_announcements_url: string;
}

export interface CalendarRow extends MtgRowBase {
  set_code: string;
  set_name: string;
  set_type: string;
  released_at: string;
  standard_legal: boolean;
  icon_svg_uri: string;
}

export interface FormatRow extends MtgRowBase {
  format: string;
  format_name: string;
  legal_sets: string[];
  banned_count: number;
  restricted_count: number;
  coverage_state: string;
  external_links: Record<string, string>;
}

/** Standard/Pioneer/Modern tournament-backed tiers (topdeck.gg) — see
 * mtg-workstation/metahub/tiers.py's compute_constructed_tiers. `tier` can be
 * "unrated" (zero recorded match games — never a guessed letter, same
 * pattern as LimitedTier). `win_rate`/`best_finish` are null when there's no
 * statistical basis for them yet, exactly like LimitedTierRow.win_rate. */
export type ConstructedTier = Tier | "unrated";

export interface ConstructedTierRow extends MtgRowBase {
  /** Format id, e.g. "standard" | "pioneer" | "modern". */
  format: string;
  /** The organizer's own archetype tag when topdeck.gg carries one, else
   * the raw deck/decklist name, else the honest "Unclassified Deck"
   * bucket — never inferred from an unparsed decklist link. */
  archetype_or_deck: string;
  tier: ConstructedTier;
  /** 0-1 fraction, or null when there are zero recorded match games. */
  win_rate: number | null;
  wins: number;
  losses: number;
  draws: number;
  /** Distinct tournaments this archetype/deck appeared in. */
  event_count: number;
  /** Best final standing across those events, or null if topdeck.gg never
   * reported one. */
  best_finish: number | null;
  /** Link back to the source event on topdeck.gg — the attribution
   * link-back METAHUB-SPEC.md requires. */
  topdeck_url: string;
}

/** One player's real result in a real cEDH event — see mtg-workstation/
 * metahub/sources/topdeck.py's normalize_edh_tournaments. `commanders` is
 * the standing's real commander name(s) ONLY when topdeck.gg's structured
 * decklist import (deckObj.Commanders, verified genuinely real for roughly
 * 43% of standings) is present for that standing; otherwise null — never
 * inferred from an unparsed decklist string. */
export interface EdhTournamentStanding {
  player: string;
  wins: number;
  losses: number;
  draws: number;
  commanders: string[] | null;
}

/** A real Commander/cEDH tournament from topdeck.gg's public tournament-
 * results API (see mtg-workstation/metahub/tiers.py's
 * compute_edh_tournaments). `top_standings` is OUR OWN sort by win
 * differential (wins - losses, ties broken by wins) — topdeck.gg's real API
 * carries no organizer-tagged "placement"/"standing" field, so this is not
 * the event's official final standings. `sample_size` = player_count (a
 * real recorded event, not a statistical estimate). */
export interface EdhTournamentRow extends MtgRowBase {
  name: string;
  tid: string;
  date: string;
  player_count: number;
  /** Real link back to the source event on topdeck.gg. */
  event_url: string;
  /** Up to 8 players per event. */
  top_standings: EdhTournamentStanding[];
  /** True when at least one standing in this event had a real commander
   * name extracted from topdeck.gg's structured decklist import. */
  commanders_extractable: boolean;
}

/** kind discriminants for meta_movers rows (Module 4 addendum) — see
 * mtg-workstation/metahub/tiers.py's compute_meta_movers. Every row is a
 * pure day-over-day diff between THIS hub's own two most recently published
 * runs — never an external source, never a guessed delta. */
export type MetaMoverKind =
  | "commander_riser"
  | "commander_faller"
  | "draft_grade_change"
  | "banlist_add"
  | "banlist_remove"
  | "new_set";

interface MetaMoverRowBase extends MtgRowBase {
  kind: MetaMoverKind;
  /** The two payload timestamps actually being diffed — distinct from this
   * row's own computed_at (this run's publish time). */
  previous_computed_at: string;
  current_computed_at: string;
}

/** commander_riser / commander_faller — the top 8 commanders (each
 * direction) by deck_count delta within the SAME format+bucket across the
 * two runs. delta_deck_count is signed: positive on risers, negative on
 * fallers. */
export interface CommanderMoverRow extends MetaMoverRowBase {
  kind: "commander_riser" | "commander_faller";
  commander: string;
  format: string;
  bucket: CommanderBucket;
  previous_deck_count: number;
  current_deck_count: number;
  delta_deck_count: number;
  previous_tier: Tier;
  current_tier: Tier;
}

/** Same literal set as lib/mtgDraftView.ts's DraftGrade — duplicated here
 * (not imported) to keep this file's fs-reader boundary intact, per this
 * file's header comment on the client/server split. */
type DraftGradeValue = "S" | "A" | "B" | "C" | "D" | "F" | "unrated";

/** A card whose BuildKit Draft Score grade moved between runs, for a set
 * tracked in BOTH payloads' overall_rows. */
export interface DraftGradeChangeRow extends MetaMoverRowBase {
  kind: "draft_grade_change";
  set_code: string;
  card: string;
  previous_grade: DraftGradeValue;
  current_grade: DraftGradeValue;
}

/** A card that entered/left a format's banned+restricted list. */
export interface BanlistChangeRow extends MetaMoverRowBase {
  kind: "banlist_add" | "banlist_remove";
  format: string;
  card: string;
}

/** A set_code appearing in this run's calendar that was absent from the
 * previous payload. */
export interface NewSetMoverRow extends MetaMoverRowBase {
  kind: "new_set";
  set_code: string;
  set_name: string;
}

/** meta_movers' row union — discriminated on `kind`. A first publish (no
 * previous payload to diff) or any --dry-run ships the module itself with
 * status "pending_history" and zero rows rather than guessing a diff (see
 * ModuleStatus). */
export type MetaMoverRow =
  | CommanderMoverRow
  | DraftGradeChangeRow
  | BanlistChangeRow
  | NewSetMoverRow;

interface MtgModule<TRow> {
  status: ModuleStatus;
  computed_at: string;
  methodology: string;
  attribution: string[];
  rows: TRow[];
}

export interface MtgMetaPayload {
  schema: string;
  status: "sample" | "published";
  computed_at: string;
  boilerplate: string;
  modules: {
    commander_tiers: MtgModule<CommanderTierRow>;
    limited_tiers: MtgModule<LimitedTierRow>;
    banlist: MtgModule<BanlistFormatRow>;
    calendar: MtgModule<CalendarRow>;
    formats: MtgModule<FormatRow>;
    /** Additive + optional — absent entirely from every payload published
     * before this module shipped. The page must render nothing at all when
     * this key is missing (see isConstructedTiersModule in mtg page.tsx),
     * never an error or an empty section. */
    constructed_tiers?: MtgModule<ConstructedTierRow>;
    /** Additive + optional — the cEDH tournament-results lane (Module 3
     * addendum). Absent/undefined is never expected once the engine ships
     * it, but stays optional per the same absence-safe rule as
     * constructed_tiers above. */
    edh_tournaments?: MtgModule<EdhTournamentRow>;
    /** Additive + optional — the day-over-day "what changed" diff (Module 4
     * addendum). Status "pending_history" + zero rows on a first publish or
     * any --dry-run; see MetaMoverRow. */
    meta_movers?: MtgModule<MetaMoverRow>;
  };
}

// ─── Reader ──────────────────────────────────────────────────────────────────

const MTG_META_FILE = path.join(process.cwd(), "public", "mtg-meta.json");

function readFile(): MtgMetaPayload | null {
  try {
    return JSON.parse(fs.readFileSync(MTG_META_FILE, "utf-8")) as MtgMetaPayload;
  } catch {
    return null;
  }
}

/** The full payload, or null if the file is missing/unparseable. Callers must
 * handle null — an absent payload is a build-time honesty state too. */
export function getMtgMeta(): MtgMetaPayload | null {
  return readFile();
}

/** True whenever the payload isn't a confirmed real-pipeline publish — drives
 * the page-wide SAMPLE DATA banner. */
export function isSamplePayload(payload: MtgMetaPayload): boolean {
  return payload.status !== "published";
}

// ─── Display helpers ─────────────────────────────────────────────────────────
// TIER_ORDER, FORMAT_LABEL/formatLabel, colorIdentityPips, isFadedConfidence,
// BUCKET_LABEL/groupByBucket, groupByConstructedFormat, and formatWinRate
// live in lib/mtgDisplay.ts now (gl-0593) and are re-exported via the
// `export * from "./mtgDisplay"` above — see that file's header comment.

export const TIER_BLURB: Record<Tier, string> = {
  S: "Top of the current meta",
  A: "Excellent, sees heavy play",
  B: "Solid, format-viable",
  C: "Situational or niche",
  D: "Off-meta / early data",
};

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low sample",
  sample: "Sample data",
};

/** Group rows into tier bands in S→D order, dropping empty tiers. Takes a
 * tier accessor so it works for both the strict Tier rows (commander) and
 * the Tier | "unrated" rows (limited) after the caller filters unrated out. */
export function groupByTier<T>(
  rows: T[],
  getTier: (row: T) => Tier
): { letter: Tier; rows: T[] }[] {
  return TIER_ORDER.map((letter) => ({
    letter,
    rows: rows.filter((r) => getTier(r) === letter),
  })).filter((g) => g.rows.length > 0);
}

/** Human freshness string relative to now, e.g. "2h ago", "3d ago". Falls back
 * to the raw date for anything older than a week so stale data reads honest
 * rather than vague. */
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

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Signed day count from now to an ISO date (positive = future). Computed at
 * render time from released_at rather than expecting the pipeline to ship a
 * pre-computed countdown. */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return 0;
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const ms = then.getTime() - startOfNow.getTime();
  return Math.round(ms / 86400000);
}

/** "in 46d" / "today" / "12d ago", derived from daysUntil(). */
export function formatDaysUntil(iso: string, now: Date = new Date()): string {
  const days = daysUntil(iso, now);
  if (days === 0) return "today";
  if (days > 0) return `in ${days}d`;
  return `${Math.abs(days)}d ago`;
}
