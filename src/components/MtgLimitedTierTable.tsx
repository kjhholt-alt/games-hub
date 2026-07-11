import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MtgTierPlate } from "@/components/MtgTierPlate";
import { MtgDraftRarityChip } from "@/components/MtgDraftRarityChip";
import { ManaDots } from "@/components/MtgManaPips";
import { MtgCardHover } from "@/components/MtgCardHover";
import {
  formatWinRate,
  isFadedConfidence,
  TIER_ORDER,
  type Confidence,
  type LimitedTierRow,
  type Tier,
} from "@/lib/mtg";

const CONFIDENCE_TEXT: Record<Confidence, string> = {
  high: "text-green",
  medium: "text-brass",
  low: "text-amber",
  sample: "text-purple",
};

/** The hub page shows the top of the board; the full sortable ranker is the
 * real tool. Everything past TEASER_N is one click away, not lost. */
const TEASER_N = 15;

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
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left">
              <Th className="w-10 text-right">#</Th>
              <Th className="w-12">Tier</Th>
              <Th wide>Card</Th>
              <Th>Rarity</Th>
              <Th>Color</Th>
              <Th className="text-right">Win rate</Th>
              <Th className="text-right">Games</Th>
            </tr>
          </thead>
          <tbody>
            {top.map((row, i) => (
              <tr
                key={`${row.card}-${row.set}`}
                className={`border-b border-border last:border-0 hover:bg-brass/5 transition-colors ${
                  isFadedConfidence(row.confidence) ? "opacity-60" : ""
                }`}
              >
                <td className="px-3 py-2 text-right font-mono tabular-nums text-text-secondary">
                  {i + 1}
                </td>
                <td className="px-3 py-2">
                  <MtgTierPlate letter={row.tier as Tier} />
                </td>
                <td className="px-4 py-2 font-medium">
                  <MtgCardHover cardName={row.card} imageUrl={row.image_normal}>
                    {row.card}
                  </MtgCardHover>
                </td>
                <td className="px-3 py-2">
                  <MtgDraftRarityChip rarity={row.rarity} />
                </td>
                <td className="px-3 py-2">
                  <ManaDots letters={row.color} />
                </td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold">
                  {formatWinRate(row.win_rate)}
                </td>
                <td
                  className={`px-3 py-2 text-right font-mono tabular-nums ${CONFIDENCE_TEXT[row.confidence]}`}
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
        className="group inline-flex items-center gap-2 text-sm text-brass hover:text-brass-bright mt-3 transition-colors"
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

function Th({
  children,
  className = "",
  wide = false,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <th
      className={`${wide ? "px-4" : "px-3"} py-2.5 font-mono text-[10px] uppercase tracking-widest text-text-secondary font-medium ${className}`}
    >
      {children}
    </th>
  );
}
