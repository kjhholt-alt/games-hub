import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { MtgTierPlate } from "@/components/MtgTierPlate";
import { MtgDraftRarityChip } from "@/components/MtgDraftRarityChip";
import { ManaDots } from "@/components/MtgManaPips";
import { MtgCardHover } from "@/components/MtgCardHover";
import { MtgConfidenceChip } from "@/components/MtgConfidenceChip";
import {
  formatWinRate,
  isFadedConfidence,
  priorSourceBasisColor,
  type CubeCardRow,
  type CubeSortKey,
} from "@/lib/mtgDraftView";

const COLUMNS: { key: CubeSortKey | null; label: string; align?: "right"; className?: string; wide?: boolean }[] = [
  { key: null, label: "#", align: "right", className: "w-10" },
  { key: "grade", label: "Tier", className: "w-12" },
  { key: "card", label: "Card", wide: true },
  { key: null, label: "Pool" },
  { key: "category", label: "Color" },
  { key: "rarity", label: "Rarity" },
  { key: "gih_wr", label: "Win rate", align: "right" },
  { key: "basis", label: "Basis" },
  { key: null, label: "Sample", align: "right" },
];

/**
 * Planar Cube Day-1 Priors table — cloned from MtgLimitedTierTable's dense
 * structure (MtgTierPlate, MtgCardHover, confidence fading, basis label
 * instead of a hidden "unrated" state). Kruz directive (2026-07-21): every
 * one of the 560-card pool's rows gets a real S–F grade here — nothing is
 * filtered out or teased behind a "top N" cut, since this page IS the full
 * list.
 *
 * `rows` arrive PRE-SORTED by the engine (real draft_score first, best to
 * worst, then heuristic_score) whenever `sortKey` is null — the filter bar's
 * "server order" default. Once a visitor picks a column (gl-0571), `rows` is
 * the explicitly client-sorted slice and `sortKey`/`sortDir` drive the active
 * header's indicator; `ranks` always reflects the untouched engine order
 * (cubeServerRanks over the full pool) so "#" never lies about a card's true
 * standing just because the table is filtered or re-sorted.
 */
export function MtgCubeTierTable({
  rows,
  ranks,
  sortKey,
  sortDir,
  onSort,
}: {
  rows: CubeCardRow[];
  ranks: Map<string, number>;
  sortKey: CubeSortKey | null;
  sortDir: "asc" | "desc";
  onSort: (key: CubeSortKey) => void;
}) {
  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface text-left">
            {COLUMNS.map((col) => (
              <Th key={col.label} className={col.className} wide={col.wide} align={col.align}>
                {col.key ? (
                  <button
                    type="button"
                    onClick={() => onSort(col.key as CubeSortKey)}
                    className={`inline-flex items-center gap-1 uppercase tracking-widest hover:text-foreground transition-colors ${
                      col.align === "right" ? "flex-row-reverse" : ""
                    } ${sortKey === col.key ? "text-brass" : ""}`}
                  >
                    {col.label}
                    <SortIcon active={sortKey === col.key} dir={sortDir} />
                  </button>
                ) : (
                  col.label
                )}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.card}
              className={`border-b border-border last:border-0 hover:bg-brass/5 transition-colors ${
                isFadedConfidence(row.confidence) ? "opacity-60" : ""
              }`}
            >
              <td className="px-3 py-2 text-right font-mono tabular-nums text-text-secondary">
                {ranks.get(row.card) ?? "—"}
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
              <td className={`px-3 py-2 text-xs ${priorSourceBasisColor(row.prior_source)}`}>
                {row.basis}
              </td>
              <td className="px-3 py-2 text-right">
                <MtgConfidenceChip confidence={row.confidence} sampleSize={row.sample_size} />
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length} className="px-4 py-8 text-center text-sm text-text-secondary">
                No cards match the current filters.
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
  align,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
  align?: "right";
}) {
  return (
    <th
      className={`${wide ? "px-4" : "px-3"} py-2.5 font-mono text-[10px] uppercase tracking-widest text-text-secondary font-medium ${align === "right" ? "text-right" : ""} ${className}`}
    >
      {children}
    </th>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown size={11} className="opacity-40" />;
  return dir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />;
}
