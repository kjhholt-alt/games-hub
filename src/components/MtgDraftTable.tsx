import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from "lucide-react";
import { MtgDraftGradeBadge } from "@/components/MtgDraftGradeBadge";
import { ManaDots } from "@/components/MtgManaPips";
import { MtgDraftRarityChip } from "@/components/MtgDraftRarityChip";
import { MtgCardHover } from "@/components/MtgCardHover";
import {
  formatDecimal,
  formatWinRate,
  isFadedConfidence,
  scryfallSearchUrl,
  type DraftCardRow,
  type DraftSortKey,
} from "@/lib/mtgDraftView";

const COLUMNS: { key: DraftSortKey; label: string; align?: "right" }[] = [
  { key: "rank", label: "#" },
  { key: "card", label: "Card" },
  { key: "color", label: "Color" },
  { key: "rarity", label: "Rarity" },
  { key: "grade", label: "Grade" },
  { key: "gih_wr", label: "GIH WR", align: "right" },
  { key: "alsa", label: "ALSA", align: "right" },
  { key: "sample_size", label: "Sample", align: "right" },
];

/** Games column tint — the confidence signal without a chip per row. */
const CONFIDENCE_TEXT: Record<string, string> = {
  high: "text-green",
  medium: "text-cyan",
  low: "text-amber",
  sample: "text-purple",
};

/**
 * The ranker table itself: sortable columns, rank pinned to the set's overall
 * Draft Score standing (not the current sort/filter), Scryfall link per card,
 * confidence fade for low/sample rows — the same honesty-rail visual the
 * Limited Tier List table uses (MtgLimitedTierTable), extended with sortable
 * headers since this table is meant to be re-sliced by the drafter live.
 */
export function MtgDraftTable({
  rows,
  ranks,
  sortKey,
  sortDir,
  onSort,
}: {
  rows: DraftCardRow[];
  ranks: Map<string, number>;
  sortKey: DraftSortKey;
  sortDir: "asc" | "desc";
  onSort: (key: DraftSortKey) => void;
}) {
  return (
    <div className="overflow-x-auto border border-border rounded-2xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface text-text-secondary text-left">
            {COLUMNS.map((col) => (
              <th key={col.key} className={`px-4 py-3 font-medium ${col.align === "right" ? "text-right" : ""}`}>
                <button
                  type="button"
                  onClick={() => onSort(col.key)}
                  className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${
                    col.align === "right" ? "flex-row-reverse" : ""
                  } ${sortKey === col.key ? "text-cyan" : ""}`}
                >
                  {col.label}
                  <SortIcon active={sortKey === col.key} dir={sortDir} />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.card}-${row.color}-${row.rarity}`}
              className={`border-b border-border last:border-0 align-top hover:bg-surface/60 transition-colors ${
                isFadedConfidence(row.confidence) ? "opacity-60" : ""
              }`}
            >
              <td className="px-4 py-3 text-text-secondary tabular-nums">
                {ranks.get(row.card) ?? "—"}
              </td>
              <td className="px-4 py-3 font-medium">
                <MtgCardHover cardName={row.card} imageUrl={row.image_normal}>
                  <a
                    href={scryfallSearchUrl(row.card)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-cyan transition-colors"
                  >
                    {row.card}
                    <ExternalLink size={11} className="text-text-secondary shrink-0" />
                  </a>
                </MtgCardHover>
              </td>
              <td className="px-4 py-3">
                <ManaDots letters={row.color} />
              </td>
              <td className="px-4 py-3">
                <MtgDraftRarityChip rarity={row.rarity} />
              </td>
              <td className="px-4 py-3">
                <MtgDraftGradeBadge grade={row.grade} />
              </td>
              <td className="px-4 py-3 text-right tabular-nums font-semibold">
                {formatWinRate(row.gih_wr)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                {formatDecimal(row.alsa)}
              </td>
              <td
                className={`px-4 py-3 text-right tabular-nums font-mono ${CONFIDENCE_TEXT[row.confidence] ?? "text-text-secondary"}`}
                title={`${row.confidence} confidence`}
              >
                {row.sample_size.toLocaleString("en-US")}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-sm text-text-secondary">
                No cards match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown size={11} className="opacity-40" />;
  return dir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />;
}
