import { TierBadge } from "@/components/TierBadge";
import { MtgConfidenceChip } from "@/components/MtgConfidenceChip";
import { MtgSourceLinks } from "@/components/MtgSourceLinks";
import {
  formatWinRate,
  isFadedConfidence,
  TIER_ORDER,
  type LimitedTierRow,
  type Tier,
} from "@/lib/mtg";

const RARITY_STYLE: Record<string, string> = {
  common: "text-text-secondary bg-surface border-border",
  uncommon: "text-cyan bg-cyan-dim border-cyan/30",
  rare: "text-amber bg-amber-dim border-amber/30",
  mythic: "text-red bg-red-dim border-red/30",
};

function RarityChip({ rarity }: { rarity: string }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono uppercase border ${
        RARITY_STYLE[rarity] ?? "text-text-secondary bg-surface border-border"
      }`}
    >
      {rarity}
    </span>
  );
}

/** Sort order: rated tiers S→D first (best win rate first within a tier),
 * then unrated (17lands has no recorded games) at the bottom. */
function sortRows(rows: LimitedTierRow[]): LimitedTierRow[] {
  const rank = (t: LimitedTierRow["tier"]): number =>
    t === "unrated" ? TIER_ORDER.length : TIER_ORDER.indexOf(t as Tier);
  return [...rows].sort((a, b) => {
    const r = rank(a.tier) - rank(b.tier);
    if (r !== 0) return r;
    return (b.win_rate ?? -1) - (a.win_rate ?? -1);
  });
}

/**
 * Limited card ratings table — the one module backed by a REAL performance
 * dataset (17lands game data), so win rates render as real numbers rather
 * than a popularity proxy. Cards 17lands hasn't recorded games for render
 * "unrated", never a guessed tier. Still faded when confidence is low/sample.
 */
export function MtgLimitedTierTable({ rows }: { rows: LimitedTierRow[] }) {
  const sorted = sortRows(rows);

  return (
    <div className="overflow-x-auto border border-border rounded-2xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface text-text-secondary text-left">
            <th className="px-4 py-3 font-medium">Tier</th>
            <th className="px-4 py-3 font-medium">Card</th>
            <th className="px-4 py-3 font-medium">Rarity</th>
            <th className="px-4 py-3 font-medium">Color</th>
            <th className="px-4 py-3 font-medium text-right">Win rate</th>
            <th className="px-4 py-3 font-medium hidden md:table-cell">
              Confidence &amp; sources
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={`${row.card}-${row.set}`}
              className={`border-b border-border last:border-0 align-top hover:bg-surface/60 transition-colors ${
                isFadedConfidence(row.confidence) ? "opacity-60" : ""
              }`}
            >
              <td className="px-4 py-3">
                {row.tier === "unrated" ? (
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-text-secondary text-[10px] font-mono uppercase">
                    N/A
                  </span>
                ) : (
                  <TierBadge letter={row.tier} />
                )}
              </td>
              <td className="px-4 py-3 font-medium">{row.card}</td>
              <td className="px-4 py-3">
                <RarityChip rarity={row.rarity} />
              </td>
              <td className="px-4 py-3 text-text-secondary font-mono">
                {row.color || "C"}
              </td>
              <td className="px-4 py-3 text-right tabular-nums font-semibold">
                {formatWinRate(row.win_rate)}
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
