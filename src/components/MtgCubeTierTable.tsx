import { MtgTierPlate } from "@/components/MtgTierPlate";
import { MtgDraftRarityChip } from "@/components/MtgDraftRarityChip";
import { ManaDots } from "@/components/MtgManaPips";
import { MtgCardHover } from "@/components/MtgCardHover";
import { MtgConfidenceChip } from "@/components/MtgConfidenceChip";
import {
  formatWinRate,
  isFadedConfidence,
  type CubeCardRow,
  type CubePriorSource,
} from "@/lib/mtgDraftView";

/** Basis label color — reuses the SAME confidence/status color vocabulary as
 * the rest of the hub (green=real live data, brass/amber=a borrowed prior,
 * purple=the lowest-confidence heuristic) — zero new colors. */
function basisColor(priorSource: CubePriorSource): string {
  if (priorSource === "live_planar_cube") return "text-green";
  if (priorSource === "powered_cube_prior") return "text-brass";
  if (priorSource === "heuristic") return "text-purple";
  return "text-amber"; // cross_set_prior:<CODE>
}

/**
 * Planar Cube Day-1 Priors table — cloned from MtgLimitedTierTable's dense
 * structure (MtgTierPlate, MtgCardHover, confidence fading, basis label
 * instead of a hidden "unrated" state). Kruz directive (2026-07-21): every
 * one of the 560-card pool's rows gets a real S–F grade here — nothing is
 * filtered out or teased behind a "top N" cut, since this page IS the full
 * list. Rows arrive PRE-SORTED by the engine (real draft_score first, best
 * to worst, then heuristic_score) — never re-sorted client-side.
 */
export function MtgCubeTierTable({ rows }: { rows: CubeCardRow[] }) {
  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface text-left">
            <Th className="w-10 text-right">#</Th>
            <Th className="w-12">Tier</Th>
            <Th wide>Card</Th>
            <Th>Pool</Th>
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
                {row.copies > 1 && (
                  <span
                    className="ml-1.5 text-[10px] font-mono text-text-secondary align-middle"
                    title={`${row.copies} copies in this week's cube`}
                  >
                    ×{row.copies}
                  </span>
                )}
              </td>
              <td className="px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                {row.pools.join(" + ")}
              </td>
              <td className="px-3 py-2">
                <ManaDots letters={(row.color_identity ?? []).join("")} />
              </td>
              <td className="px-3 py-2">
                <MtgDraftRarityChip rarity={row.rarity ?? "common"} />
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
              <td className={`px-3 py-2 text-xs ${basisColor(row.prior_source)}`}>
                {row.basis}
              </td>
              <td className="px-3 py-2 text-right">
                <MtgConfidenceChip confidence={row.confidence} sampleSize={row.sample_size} />
              </td>
            </tr>
          ))}
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
