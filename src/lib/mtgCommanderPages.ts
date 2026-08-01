// ─── Commander detail-page slug + lookup helpers ────────────────────────────
//
// One SEO page per unique commander name, aggregating every format/bucket row
// commander_tiers carries for it (a commander can appear in Commander AND
// Competitive Brawl, trending AND established, etc — see mtg.ts's
// CommanderTierRow doc comment). Slugs are deterministic kebab-case derived
// straight from the engine's `commander` string; nothing here invents a name
// or an id the pipeline didn't emit.

import { getMtgMeta, type CommanderTierRow } from "@/lib/mtg";
import { slugifyCommander } from "@/lib/mtgDisplay";

// Re-exported for backward compat — every existing importer of
// slugifyCommander from "@/lib/mtgCommanderPages" keeps working unchanged.
// The real definition now lives in lib/mtgDisplay.ts (gl-0593) so client
// components can use it without pulling this file's fs-based getMtgMeta
// into the browser bundle.
export { slugifyCommander };

export interface CommanderPageEntry {
  slug: string;
  /** Display name — the exact `commander` string from the first row
   * encountered for this slug (payload order). Rows for the same commander
   * always carry the same literal name in practice; if two DIFFERENT
   * literal names ever collided on the same slug (e.g. a punctuation-only
   * difference), this deterministically keeps whichever came first in the
   * payload rather than silently overwriting it or crashing. */
  name: string;
  rows: CommanderTierRow[];
}

/** Group commander_tiers rows into one entry per unique slug — the dedupe
 * rule this page's generateStaticParams and lookup both share. Pure
 * function over rows (no fs access) so it's reusable and easy to reason
 * about independent of the payload reader. */
export function groupCommanderRows(rows: CommanderTierRow[]): CommanderPageEntry[] {
  const bySlug = new Map<string, CommanderPageEntry>();
  for (const row of rows) {
    const slug = slugifyCommander(row.commander);
    const existing = bySlug.get(slug);
    if (existing) {
      existing.rows.push(row);
    } else {
      bySlug.set(slug, { slug, name: row.commander, rows: [row] });
    }
  }
  return [...bySlug.values()];
}

/** Every commander slug the current payload carries — an empty array (never
 * a crash) whenever the payload is missing or commander_tiers has zero
 * rows, e.g. the mid-repair corpus this page ships against today. Feeds
 * generateStaticParams directly. */
export function getAllCommanderSlugs(): string[] {
  const payload = getMtgMeta();
  if (!payload) return [];
  return groupCommanderRows(payload.modules.commander_tiers.rows).map((e) => e.slug);
}

/** One commander's aggregated entry, or null when the payload is missing,
 * commander_tiers is empty, or the slug doesn't match any commander in the
 * current corpus — an honest 404 via notFound(), never invented content. */
export function getCommanderPageEntry(slug: string): CommanderPageEntry | null {
  const payload = getMtgMeta();
  if (!payload) return null;
  const entries = groupCommanderRows(payload.modules.commander_tiers.rows);
  return entries.find((e) => e.slug === slug) ?? null;
}

/** Freshness threshold for the honest per-row provenance status below — a
 * week, matching the "republishes a few times a day but can go quiet"
 * cadence documented on /mtg's `revalidate` comment. */
const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/** Per-row provenance status for MtgProvenance, derived (never invented)
 * from the row's own freshness + confidence — CommanderTierRow doesn't carry
 * a module-style status field the way MtgModule does, so this is the honest
 * stand-in: "sample" confidence always reads sample, anything older than a
 * week reads stale, everything else reads published. */
export function commanderRowStatus(
  row: CommanderTierRow
): "published" | "sample" | "stale" {
  if (row.confidence === "sample") return "sample";
  const computedMs = new Date(row.computed_at).getTime();
  if (!Number.isNaN(computedMs) && Date.now() - computedMs > STALE_AFTER_MS) {
    return "stale";
  }
  return "published";
}
