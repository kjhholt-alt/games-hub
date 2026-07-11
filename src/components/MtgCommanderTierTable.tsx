import { ExternalLink } from "lucide-react";
import { TierBadge } from "@/components/TierBadge";
import { MtgConfidenceChip } from "@/components/MtgConfidenceChip";
import { MtgSourceLinks } from "@/components/MtgSourceLinks";
import {
  BUCKET_LABEL,
  colorIdentityPips,
  formatLabel,
  groupByBucket,
  groupByTier,
  isFadedConfidence,
  TIER_BLURB,
  type CommanderTierRow,
} from "@/lib/mtg";

/**
 * Commander/Brawl tier tables, split into the engine's two buckets — trending
 * (newest decks) and established (most-viewed decks), each with tier bands
 * of chips up top (scan-friendly) then a detailed table. The commander name
 * links straight to the representative Archidekt decklist (the real
 * attribution link, not an invented one). Low-sample rows fade — the
 * deck_count/sample_size stays visible either way.
 */
export function MtgCommanderTierTable({ rows }: { rows: CommanderTierRow[] }) {
  const buckets = groupByBucket(rows);

  return (
    <div className="space-y-10">
      {buckets.map((b) => (
        <div key={b.bucket} className="space-y-4">
          <h3 className="text-sm font-mono uppercase text-text-secondary">
            {BUCKET_LABEL[b.bucket]}
          </h3>
          <BucketTierBands rows={b.rows} />
          <BucketTable rows={b.rows} />
        </div>
      ))}
      <p className="text-xs text-text-secondary">
        Tier = the commander&rsquo;s deck-count rank-percentile within its
        bucket (not a win rate). Top inclusions = the non-land cards most
        often played alongside that commander across the scanned decks.
      </p>
    </div>
  );
}

function BucketTierBands({ rows }: { rows: CommanderTierRow[] }) {
  const groups = groupByTier(rows, (r) => r.tier);
  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div
          key={group.letter}
          className="flex flex-col sm:flex-row gap-3 bg-surface border border-border rounded-2xl p-4"
        >
          <div className="flex sm:flex-col items-center sm:justify-center gap-3 sm:w-36 shrink-0">
            <TierBadge letter={group.letter} size="lg" />
            <p className="text-xs text-text-secondary sm:text-center leading-snug">
              {TIER_BLURB[group.letter]}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 flex-1">
            {group.rows.map((row) => (
              <div
                key={`${row.commander}-${row.format}`}
                className={`bg-surface-raised border border-border rounded-xl px-3 py-2 max-w-[16rem] ${
                  isFadedConfidence(row.confidence) ? "opacity-60" : ""
                }`}
              >
                <p className="text-sm font-medium leading-tight">
                  {row.commander}
                </p>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  {colorIdentityPips(row.color_identity)} &middot;{" "}
                  {formatLabel(row.format)} &middot; {row.deck_count} decks
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BucketTable({ rows }: { rows: CommanderTierRow[] }) {
  return (
    <div className="overflow-x-auto border border-border rounded-2xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface text-text-secondary text-left">
            <th className="px-4 py-3 font-medium">Tier</th>
            <th className="px-4 py-3 font-medium">Commander</th>
            <th className="px-4 py-3 font-medium">Colors</th>
            <th className="px-4 py-3 font-medium">Format</th>
            <th className="px-4 py-3 font-medium hidden md:table-cell">
              Top inclusions
            </th>
            <th className="px-4 py-3 font-medium">
              Confidence &amp; sources
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.commander}-${row.format}`}
              className={`border-b border-border last:border-0 align-top hover:bg-surface/60 transition-colors ${
                isFadedConfidence(row.confidence) ? "opacity-60" : ""
              }`}
            >
              <td className="px-4 py-3">
                <TierBadge letter={row.tier} />
              </td>
              <td className="px-4 py-3 font-medium">
                <a
                  href={row.deck_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-cyan transition-colors"
                >
                  {row.commander}
                  <ExternalLink size={11} className="text-text-secondary" />
                </a>
              </td>
              <td className="px-4 py-3 text-text-secondary font-mono">
                {colorIdentityPips(row.color_identity)}
              </td>
              <td className="px-4 py-3 text-text-secondary">
                {formatLabel(row.format)}
              </td>
              <td className="px-4 py-3 text-text-secondary hidden md:table-cell max-w-sm">
                {row.top_inclusions.length > 0
                  ? row.top_inclusions.slice(0, 4).join(", ") +
                    (row.top_inclusions.length > 4
                      ? ` +${row.top_inclusions.length - 4} more`
                      : "")
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1.5 items-start">
                  <MtgConfidenceChip
                    confidence={row.confidence}
                    sampleSize={row.deck_count}
                  />
                  <MtgSourceLinks sources={row.sources} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
