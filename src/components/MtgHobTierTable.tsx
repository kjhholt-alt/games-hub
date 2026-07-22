import { MtgTierPlate } from "@/components/MtgTierPlate";
import { MtgDraftRarityChip } from "@/components/MtgDraftRarityChip";
import { ManaDots } from "@/components/MtgManaPips";
import { MtgCardHover } from "@/components/MtgCardHover";
import { MtgConfidenceChip } from "@/components/MtgConfidenceChip";
import {
  formatWinRate,
  isFadedConfidence,
  priorSourceBasisColor,
  type DraftCardRow,
} from "@/lib/mtgDraftView";

/**
 * HOB Day-0 Intel Pack table — cloned from MtgCubeTierTable's dense
 * structure/basis-column pattern, adapted to the STANDARD DraftCardRow
 * shape (HOB rows come from compute_draft_set_overall_rows, the SAME
 * function a real premier set's gap-fill uses, seeded with zero live
 * 17lands data — see metahub/tiers.py's compute_hob_rows). Every row
 * carries a real S–F grade and a basis label unconditionally (SPOILER
 * SEASON priors only, never a guessed win rate) — nothing filtered out,
 * this page IS the full revealed list. Rows arrive PRE-SORTED by the
 * engine (real draft_score first, then heuristic_score) — never re-sorted
 * client-side.
 */
export function MtgHobTierTable({ rows }: { rows: DraftCardRow[] }) {
  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface text-left">
            <Th className="w-10 text-right">#</Th>
            <Th className="w-12">Tier</Th>
            <Th wide>Card</Th>
            <Th>Color</Th>
            <Th>Rarity</Th>
            <Th className="text-right">Win rate</Th>
            <Th>Basis</Th>
            <Th className="text-right">Sample</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.card}
              className={`border-b border-border last:border-0 hover:bg-brass/5 transition-colors ${
                isFadedConfidence(row.confidence) ? "opacity-60" : ""
              }`}
            >
              <td className="px-3 py-2 text-right font-mono tabular-nums text-text-secondary">
                {i + 1}
              </td>
              <td className="px-3 py-2">
                <MtgTierPlate letter={row.grade} />
              </td>
              <td className="px-4 py-2 font-medium">
                <MtgCardHover cardName={row.card} imageUrl={row.image_normal}>
                  {row.card}
                </MtgCardHover>
              </td>
              <td className="px-3 py-2">
                <ManaDots letters={row.color} />
              </td>
              <td className="px-3 py-2">
                <MtgDraftRarityChip rarity={row.rarity} />
              </td>
              <td className="px-3 py-2 text-right tabular-nums font-semibold">
                {row.gih_wr !== null ? (
                  formatWinRate(row.gih_wr)
                ) : (
                  <span className="font-normal text-text-secondary" title="No win-rate data — heuristic score only">
                    heuristic
                  </span>
                )}
              </td>
              <td className={`px-3 py-2 text-xs ${row.prior_source ? priorSourceBasisColor(row.prior_source) : "text-text-secondary"}`}>
                {row.basis ?? "—"}
              </td>
              <td className="px-3 py-2 text-right">
                <MtgConfidenceChip confidence={row.confidence} sampleSize={row.sample_size} />
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-sm text-text-secondary">
                No cards revealed yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
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
