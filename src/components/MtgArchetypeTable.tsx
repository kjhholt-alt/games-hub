import { ManaDots } from "@/components/MtgManaPips";
import {
  formatArchetypeName,
  formatWinRate,
  groupArchetypeRows,
  isFadedConfidence,
  type ArchetypeStatus,
  type DraftArchetypeRow,
} from "@/lib/mtgDraftView";

/** Games column tint — the confidence signal without a chip per row, same
 * palette as MtgDraftTable/MtgLimitedTierTable's "Games" columns. */
const CONFIDENCE_TEXT: Record<string, string> = {
  high: "text-green",
  medium: "text-brass",
  low: "text-amber",
  sample: "text-purple",
};

/**
 * 17lands' color-performance leaderboard for one set's `archetypes`
 * addendum (METAHUB-SPEC.md 2026-07-11) — DECK-level win rates by final
 * deck colors, never a per-card rating (see the footnote below the
 * groups). Two-color pairs read first (the archetype drafters actually
 * chase), then mono colors, then any real 3+ color combination 17lands
 * reported this run — each group ranked only against its own color_count,
 * per the engine's compute_archetypes; never compare rank across groups.
 * Low/sample-confidence rows fade, identical rule to every other draft
 * table. The caller decides whether to render this at all (the whole
 * `archetypes` block is additive + optional on a set); a present-but-empty
 * block still renders an honest one-liner here rather than nothing, so a
 * real "no distinct sample this run" fact isn't silently dropped once the
 * caller has already chosen to show the section.
 */
export function MtgArchetypeTable({
  status,
  rows,
  attribution,
}: {
  status: ArchetypeStatus;
  rows: DraftArchetypeRow[];
  attribution: string[];
}) {
  if (status !== "published" || rows.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        17lands hasn&rsquo;t returned a color-performance sample distinct
        enough to publish for this set yet — this fills in automatically
        once it does.
      </p>
    );
  }

  const { pairs, mono, multi } = groupArchetypeRows(rows);

  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-3">
        {pairs.length > 0 && (
          <ArchetypeGroup title="Two-color pairs" columnLabel="Pair" rows={pairs} />
        )}
        {mono.length > 0 && (
          <ArchetypeGroup title="Mono color" columnLabel="Color" rows={mono} />
        )}
      </div>
      {multi.length > 0 && (
        <div className="mt-3">
          <ArchetypeGroup title="Three-plus color" columnLabel="Colors" rows={multi} compact />
        </div>
      )}
      {attribution.length > 0 && (
        <p className="font-mono text-[10px] text-text-secondary/80 leading-relaxed mt-3">
          {attribution.join(" · ")}
        </p>
      )}
      <p className="text-[11px] text-text-secondary leading-relaxed mt-1">
        Deck win rate by final deck colors — not a card rating.
      </p>
    </div>
  );
}

function ArchetypeGroup({
  title,
  columnLabel,
  rows,
  compact = false,
}: {
  title: string;
  columnLabel: string;
  rows: DraftArchetypeRow[];
  compact?: boolean;
}) {
  return (
    <div className={`bg-surface border border-border rounded-lg overflow-hidden ${compact ? "max-w-sm" : ""}`}>
      <p className="font-mono text-[10px] uppercase tracking-widest text-text-secondary px-3 pt-2.5 pb-1.5">
        {title}
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <Th className="w-8 text-right">#</Th>
            <Th wide>{columnLabel}</Th>
            <Th className="text-right">Win rate</Th>
            <Th className="text-right">Games</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.colors}
              className={`border-b border-border last:border-0 hover:bg-brass/5 transition-colors ${
                isFadedConfidence(row.confidence) ? "opacity-60" : ""
              }`}
            >
              <td className="px-3 py-2 text-right font-mono tabular-nums text-text-secondary">
                {row.rank ?? "—"}
              </td>
              <td className="px-3 py-2 font-medium">
                <span className="inline-flex items-center gap-2 min-w-0">
                  <ManaDots letters={row.colors} />
                  <span className="truncate">{formatArchetypeName(row.color_name)}</span>
                </span>
              </td>
              <td className="px-3 py-2 text-right tabular-nums font-semibold">
                {formatWinRate(row.win_rate)}
              </td>
              <td
                className={`px-3 py-2 text-right font-mono tabular-nums ${CONFIDENCE_TEXT[row.confidence] ?? "text-text-secondary"}`}
                title={`${row.confidence} confidence — n=${row.sample_size.toLocaleString("en-US")}`}
              >
                {row.sample_size.toLocaleString("en-US")}
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
      className={`${wide ? "px-4" : "px-3"} py-2 font-mono text-[10px] uppercase tracking-widest text-text-secondary font-medium ${className}`}
    >
      {children}
    </th>
  );
}
