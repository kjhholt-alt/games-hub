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

// ─── Shared row/module shape ────────────────────────────────────────────────

export type Confidence = "high" | "medium" | "low" | "sample";
export type ModuleStatus = "sample" | "published" | "stale" | "pending_key";
export type Tier = "S" | "A" | "B" | "C" | "D";
export type LimitedTier = Tier | "unrated";
export type CommanderBucket = "trending" | "established";

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

export const TIER_ORDER: Tier[] = ["S", "A", "B", "C", "D"];

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
export function isFadedConfidence(confidence: Confidence): boolean {
  return confidence === "low" || confidence === "sample";
}

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

/** Split commander_tiers rows into trending / established sections, dropping
 * an empty bucket. */
export function groupByBucket(
  rows: CommanderTierRow[]
): { bucket: CommanderBucket; rows: CommanderTierRow[] }[] {
  const buckets: CommanderBucket[] = ["trending", "established"];
  return buckets
    .map((bucket) => ({ bucket, rows: rows.filter((r) => r.bucket === bucket) }))
    .filter((g) => g.rows.length > 0);
}

export const BUCKET_LABEL: Record<CommanderBucket, string> = {
  trending: "Trending (newest decks)",
  established: "Established (most-viewed decks)",
};

/** 0-1 fraction -> "NN.N%", or an explicit "unrated" when 17lands has no
 * recorded games for the card — never a guessed number. */
export function formatWinRate(winRate: number | null): string {
  if (winRate === null) return "unrated";
  return `${(winRate * 100).toFixed(1)}%`;
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
