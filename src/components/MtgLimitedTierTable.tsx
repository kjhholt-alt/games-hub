import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TierBadge } from "@/components/TierBadge";
import { ManaDots } from "@/components/MtgManaPips";
import {
  formatWinRate,
  isFadedConfidence,
  TIER_ORDER,
  type Confidence,
  type LimitedTierRow,
  type Tier,
} from "@/lib/mtg";

const RARITY_STYLE: Record<string, string> = {
  common: "text-text-secondary bg-surface border-border",
  uncommon: "text-cyan bg-cyan-dim border-cyan/30",
  rare: "text-amber bg-amber-dim border-amber/30",
  mythic: "text-red bg-red-dim border-red/30",
};

const CONFIDENCE_TEXT: Record<Confidence, string> = {
  high: "text-green",
  medium: "text-cyan",
  low: "text-amber",
  sample: "text-purple",
};

/** The hub page shows the top of the board; the full sortable ranker is the
 * real tool. Everything past TEASER_N is one click away, not lost. */
const TEASER_N = 15;

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
 * Limited card ratings — the one module backed by a REAL performance dataset
 * (17lands game data), teased here as the top of the board. Games column is
 * tinted by confidence (hover for the label); low/sample rows fade. The full
 * 300+-card sortable/filterable ranker lives at /mtg/draft.
 */
export function MtgLimitedTierTable({ rows }: { rows: LimitedTierRow[] }) {
  const sorted = sortRows(rows).filter((r) => r.tier !== "unrated");
  const top = sorted.slice(0, TEASER_N);

  return (
    <div>
      <div className="overflow-x-auto border border-border rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-text-secondary text-left">
              <th className="px-3 py-3 font-medium w-10 text-right">#</th>
              <th className="px-3 py-3 font-medium w-12">Tier</th>
              <th className="px-4 py-3 font-medium">Card</th>
              <th className="px-3 py-3 font-medium">Rarity</th>
              <th className="px-3 py-3 font-medium">Color</th>
              <th className="px-3 py-3 font-medium text-right">Win rate</th>
              <th className="px-3 py-3 font-medium text-right">Games</th>
            </tr>
          </thead>
          <tbody>
            {top.map((row, i) => (
              <tr
                key={`${row.card}-${row.set}`}
                className={`border-b border-border last:border-0 hover:bg-surface/60 transition-colors ${
                  isFadedConfidence(row.confidence) ? "opacity-60" : ""
                }`}
              >
                <td className="px-3 py-2.5 text-right font-mono tabular-nums text-text-secondary">
                  {i + 1}
                </td>
                <td className="px-3 py-2.5">
                  <TierBadge letter={row.tier as Tier} />
                </td>
                <td className="px-4 py-2.5 font-medium">{row.card}</td>
                <td className="px-3 py-2.5">
                  <RarityChip rarity={row.rarity} />
                </td>
                <td className="px-3 py-2.5">
                  <ManaDots letters={row.color} />
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums font-semibold">
                  {formatWinRate(row.win_rate)}
                </td>
                <td
                  className={`px-3 py-2.5 text-right font-mono tabular-nums ${CONFIDENCE_TEXT[row.confidence]}`}
                  title={`${row.confidence} confidence — n=${row.sample_size.toLocaleString("en-US")}`}
                >
                  {row.sample_size.toLocaleString("en-US")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link
        href="/mtg/draft"
        className="group inline-flex items-center gap-2 text-sm text-cyan mt-3 hover:underline"
      >
        Top {top.length} of {rows.length} cards — open the full Draft Ranker
        to sort, filter, and search every card
        <ArrowRight
          size={14}
          className="group-hover:translate-x-0.5 transition-transform"
        />
      </Link>
    </div>
  );
}
