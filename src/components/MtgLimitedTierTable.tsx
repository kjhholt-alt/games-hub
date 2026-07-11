import { TierBadge } from "@/components/TierBadge";
import { MtgConfidenceChip } from "@/components/MtgConfidenceChip";
import { MtgSourceLinks } from "@/components/MtgSourceLinks";
import { isFadedConfidence, type LimitedTierRow } from "@/lib/mtg";

/**
 * Limited card ratings table — the one module backed by a REAL performance
 * dataset (17lands game data), so win rates render as real numbers rather
 * than a popularity proxy. Still faded when confidence is low/sample.
 */
export function MtgLimitedTierTable({ rows }: { rows: LimitedTierRow[] }) {
  return (
    <div className="overflow-x-auto border border-border rounded-2xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface text-text-secondary text-left">
            <th className="px-4 py-3 font-medium">Tier</th>
            <th className="px-4 py-3 font-medium">Card</th>
            <th className="px-4 py-3 font-medium">Color</th>
            <th className="px-4 py-3 font-medium text-right">Win rate</th>
            <th className="px-4 py-3 font-medium text-right">Games seen</th>
            <th className="px-4 py-3 font-medium hidden md:table-cell">
              Confidence &amp; sources
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.card_name}
              className={`border-b border-border last:border-0 align-top hover:bg-surface/60 transition-colors ${
                isFadedConfidence(row.confidence) ? "opacity-60" : ""
              }`}
            >
              <td className="px-4 py-3">
                <TierBadge letter={row.tier} />
              </td>
              <td className="px-4 py-3 font-medium">{row.card_name}</td>
              <td className="px-4 py-3 text-text-secondary font-mono">
                {row.color}
              </td>
              <td className="px-4 py-3 text-right tabular-nums font-semibold">
                {row.win_rate_pct.toFixed(1)}%
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                {row.games_seen.toLocaleString("en-US")}
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
  );
}
