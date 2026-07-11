// ─── BuildKit MTG Meta Hub reader ────────────────────────────────────────────
//
// The mtg-workstation metahub engine writes one payload to public/mtg-meta.json
// (schema "buildkit-mtg-meta@1"). Every module inside it (commander tiers,
// limited tiers, banlist, calendar, formats) carries its own freshness stamp,
// methodology, and attribution; every row inside a module carries the honesty
// fields that are this product's actual moat: sources[], sample_size,
// computed_at, confidence. See mtg-workstation/METAHUB-SPEC.md — it is law.
//
// The gate: the page always renders whatever is in the file, but shows a
// visible SAMPLE DATA banner whenever `status !== "published"" — see
// isSamplePayload() below. Nothing here silently upgrades sample data into
// something that looks real.

import fs from "fs";
import path from "path";

// ─── Shared row/module shape ────────────────────────────────────────────────

export type Confidence = "high" | "medium" | "low" | "sample";
export type ModuleStatus = "sample" | "published" | "stale" | "pending_key";
export type Tier = "S" | "A" | "B" | "C" | "D";

export interface MtgSource {
  name: string;
  url: string;
}

/** Fields every row carries — the honesty rail, applied everywhere. */
interface MtgRowBase {
  sources: MtgSource[];
  /** Statistical backing for this row; null when the row is a deterministic
   * fact (a legality, a release date) rather than a computed statistic. */
  sample_size: number | null;
  computed_at: string;
  confidence: Confidence;
}

export interface CommanderTierRow extends MtgRowBase {
  tier: Tier;
  name: string;
  /** WUBRG-order color identity, e.g. "UB", "WUBRG", "" for colorless. */
  color_identity: string;
  format: "commander" | "brawl" | "both";
  marvel_set: boolean;
  archetype: string;
  /** Week-over-week popularity delta in the Archidekt corpus, percentage points. */
  momentum_pct: number;
  key_cards: string[];
}

export interface LimitedTierRow extends MtgRowBase {
  tier: Tier;
  card_name: string;
  color: string;
  win_rate_pct: number;
  games_seen: number;
}

export interface BanlistRow extends MtgRowBase {
  format: string;
  card_name: string;
  action: "banned" | "suspended" | "unbanned";
  effective_date: string;
  reason: string | null;
  announcement_url: string | null;
}

export interface CalendarRow extends MtgRowBase {
  kind: "set_release" | "rotation";
  label: string;
  set_code: string | null;
  date: string;
  detail: string;
}

export interface FormatRow extends MtgRowBase {
  format: string;
  legal_sets_note: string;
  last_br_change: string | null;
  coverage_state: string;
  external_links: MtgSource[];
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
    commander_tiers: MtgModule<CommanderTierRow> & { set_context: string };
    limited_tiers: MtgModule<LimitedTierRow> & {
      set_name: string;
      set_code: string;
    };
    banlist: MtgModule<BanlistRow>;
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

/** Rows with weak statistical backing render faded with the count visible —
 * "the one trick the sharpest competitor does for ONE format; we do it
 * everywhere" (METAHUB-SPEC.md). */
export function isFadedConfidence(confidence: Confidence): boolean {
  return confidence === "low" || confidence === "sample";
}

/** Group rows into tier bands in S→D order, dropping empty tiers. */
export function groupByTier<T extends { tier: Tier }>(
  rows: T[]
): { letter: Tier; rows: T[] }[] {
  return TIER_ORDER.map((letter) => ({
    letter,
    rows: rows.filter((r) => r.tier === letter),
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
