import { TierBadge } from "@/components/TierBadge";
import { MtgConfidenceChip } from "@/components/MtgConfidenceChip";
import { MtgSourceLinks } from "@/components/MtgSourceLinks";
import {
  groupByTier,
  isFadedConfidence,
  TIER_BLURB,
  type CommanderTierRow,
} from "@/lib/mtg";

const FORMAT_LABEL: Record<CommanderTierRow["format"], string> = {
  commander: "Commander",
  brawl: "Brawl",
  both: "Both",
};

/**
 * Commander/Brawl tier table: tier bands of chips up top (scan-friendly),
 * then a detailed table with color identity, format, momentum, and the
 * honesty pair (confidence chip + source links) per row. Low-sample rows
 * fade — the sample_size count stays visible either way.
 */
export function MtgCommanderTierTable({ rows }: { rows: CommanderTierRow[] }) {
  const groups = groupByTier(rows);

  return (
    <div className="space-y-6">
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
                  key={row.name}
                  className={`bg-surface-raised border border-border rounded-xl px-3 py-2 max-w-[16rem] ${
                    isFadedConfidence(row.confidence) ? "opacity-60" : ""
                  }`}
                >
                  <p className="text-sm font-medium leading-tight">
                    {row.name}
                    {row.marvel_set && (
                      <span className="ml-1.5 text-[9px] font-mono uppercase text-purple bg-purple-dim border border-purple/30 rounded px-1 py-0.5 align-middle">
                        Marvel
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    {row.color_identity || "C"} &middot;{" "}
                    {FORMAT_LABEL[row.format]} &middot; {row.archetype}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto border border-border rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-text-secondary text-left">
              <th className="px-4 py-3 font-medium">Tier</th>
              <th className="px-4 py-3 font-medium">Commander</th>
              <th className="px-4 py-3 font-medium">Colors</th>
              <th className="px-4 py-3 font-medium">Format</th>
              <th className="px-4 py-3 font-medium text-right">Momentum</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">
                Confidence &amp; sources
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.name}
                className={`border-b border-border last:border-0 align-top hover:bg-surface/60 transition-colors ${
                  isFadedConfidence(row.confidence) ? "opacity-60" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <TierBadge letter={row.tier} />
                </td>
                <td className="px-4 py-3 font-medium">
                  {row.name}
                  {row.marvel_set && (
                    <span className="ml-1.5 text-[9px] font-mono uppercase text-purple bg-purple-dim border border-purple/30 rounded px-1 py-0.5 align-middle">
                      Marvel
                    </span>
                  )}
                  <p className="text-xs text-text-secondary font-normal mt-0.5">
                    {row.archetype}
                  </p>
                </td>
                <td className="px-4 py-3 text-text-secondary font-mono">
                  {row.color_identity || "C"}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {FORMAT_LABEL[row.format]}
                </td>
                <td
                  className={`px-4 py-3 text-right tabular-nums ${
                    row.momentum_pct >= 0 ? "text-green" : "text-red"
                  }`}
                >
                  {row.momentum_pct >= 0 ? "+" : ""}
                  {row.momentum_pct.toFixed(1)}%
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex flex-col gap-1.5 items-start">
                    <MtgConfidenceChip
                      confidence={row.confidence}
                      sampleSize={row.sample_size}
                    />
                    <MtgSourceLinks sources={row.sources} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-text-secondary">
        Momentum = week-over-week share of the Archidekt decklist corpus for
        this commander, not a win rate. Marvel-tagged rows are commanders from
        the Marvel Universes Beyond wave.
      </p>
    </div>
  );
}
