import { ExternalLink } from "lucide-react";
import { MtgTierPlate } from "@/components/MtgTierPlate";
import { MtgSortableTh } from "@/components/MtgSortableTh";
import type { ConstructedTierRow } from "@/lib/mtg";
import {
  formatLabel,
  formatWinRate,
  groupByConstructedFormat,
  isFadedConfidence,
  TIER_ORDER,
  type Tier,
} from "@/lib/mtgDisplay";
import { sortConstructedRows, type ConstructedSortKey } from "@/lib/mtgTierView";

/** Leaderboard depth per format — same "top of the board is the product"
 * rule as the commander/limited tables. */
const TOP_N = 20;

/** Rated tiers S->D first (best win rate first within a tier), then
 * "unrated" (zero recorded match games) at the bottom — identical ordering
 * rule to MtgLimitedTierTable's sortRows. */
function sortRows(rows: ConstructedTierRow[]): ConstructedTierRow[] {
  const rank = (t: ConstructedTierRow["tier"]): number =>
    t === "unrated" ? TIER_ORDER.length : TIER_ORDER.indexOf(t as Tier);
  return [...rows].sort((a, b) => {
    const r = rank(a.tier) - rank(b.tier);
    if (r !== 0) return r;
    return (b.win_rate ?? -1) - (a.win_rate ?? -1);
  });
}

/**
 * Real tournament-backed win-rate tiers for Standard/Pioneer/Modern (the
 * topdeck.gg axis) — one dense table per format, ranked by win rate.
 * archetype_or_deck carries whatever label topdeck.gg's organizers gave it
 * (never invented); low-sample rows fade per the hub's honesty rail; every
 * row links back to its source event on topdeck.gg.
 *
 * `sortKey`/`sortDir`/`onSort` are optional (gl-0593, MtgConstructedTierExplorer)
 * — when `sortKey` is null/omitted each format board keeps its original
 * tier-then-win-rate order (sortRows below) untouched; once a visitor clicks
 * a sortable header the board renders that explicit client sort instead.
 */
export function MtgConstructedTierTable({
  rows,
  sortKey = null,
  sortDir = "desc",
  onSort,
}: {
  rows: ConstructedTierRow[];
  sortKey?: ConstructedSortKey | null;
  sortDir?: "asc" | "desc";
  onSort?: (key: ConstructedSortKey) => void;
}) {
  const groups = groupByConstructedFormat(rows);

  if (groups.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        No tournament results recorded this run.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {groups.map((g) => (
        <FormatBoard
          key={g.format}
          format={g.format}
          rows={g.rows}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={onSort}
        />
      ))}
      <p className="text-xs text-text-secondary max-w-3xl">
        Tier = real match win rate across recorded tournament results (S&gt;=60%,
        A&gt;=55%, B&gt;=50%, C&gt;=45%, else D) — not a popularity measure. An
        archetype/deck with zero recorded games renders unrated, never a
        guessed tier.
      </p>
    </div>
  );
}

function FormatBoard({
  format,
  rows,
  sortKey,
  sortDir,
  onSort,
}: {
  format: string;
  rows: ConstructedTierRow[];
  sortKey: ConstructedSortKey | null;
  sortDir: "asc" | "desc";
  onSort?: (key: ConstructedSortKey) => void;
}) {
  const sorted = sortKey ? sortConstructedRows(rows, sortKey, sortDir) : sortRows(rows);
  const top = sorted.slice(0, TOP_N);
  const handleSort = onSort ? (key: string) => onSort(key as ConstructedSortKey) : undefined;

  return (
    <div>
      <h3 className="font-mono text-[11px] uppercase tracking-widest text-text-secondary mb-3">
        {formatLabel(format)}
      </h3>
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left">
              <MtgSortableTh
                label="#"
                sortKey={null}
                activeKey={sortKey}
                dir={sortDir}
                className="w-10 text-right"
              />
              <MtgSortableTh
                label="Tier"
                sortKey="tier"
                activeKey={sortKey}
                dir={sortDir}
                onSort={handleSort}
                className="w-12"
              />
              <MtgSortableTh
                label="Archetype / Deck"
                sortKey="archetype_or_deck"
                activeKey={sortKey}
                dir={sortDir}
                onSort={handleSort}
                wide
              />
              <MtgSortableTh
                label="Win rate"
                sortKey="win_rate"
                activeKey={sortKey}
                dir={sortDir}
                onSort={handleSort}
                align="right"
              />
              <MtgSortableTh
                label="W-L-D"
                sortKey={null}
                activeKey={sortKey}
                dir={sortDir}
                align="right"
              />
              <MtgSortableTh
                label="Events"
                sortKey="event_count"
                activeKey={sortKey}
                dir={sortDir}
                onSort={handleSort}
                align="right"
              />
              <MtgSortableTh
                label="Best finish"
                sortKey={null}
                activeKey={sortKey}
                dir={sortDir}
                align="right"
                className="hidden lg:table-cell"
              />
            </tr>
          </thead>
          <tbody>
            {top.map((row, i) => (
              <tr
                key={`${row.format}-${row.archetype_or_deck}`}
                className={`border-b border-border last:border-0 hover:bg-brass/5 transition-colors ${
                  isFadedConfidence(row.confidence) ? "opacity-60" : ""
                }`}
              >
                <td className="px-3 py-2 text-right font-mono tabular-nums text-text-secondary">
                  {i + 1}
                </td>
                <td className="px-3 py-2">
                  <MtgTierPlate letter={row.tier} />
                </td>
                <td className="px-4 py-2 font-medium">
                  {row.topdeck_url ? (
                    <a
                      href={row.topdeck_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 hover:text-brass transition-colors"
                    >
                      {row.archetype_or_deck}
                      <ExternalLink size={11} className="text-text-secondary shrink-0" />
                    </a>
                  ) : (
                    row.archetype_or_deck
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold">
                  {formatWinRate(row.win_rate)}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-text-secondary">
                  {row.wins}-{row.losses}-{row.draws}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {row.event_count}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-text-secondary hidden lg:table-cell">
                  {row.best_finish ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary mt-2">
        Top {top.length} of {rows.length} archetypes/decks{sortKey ? "" : " by win rate"} ·
        faded rows = small samples
      </p>
    </div>
  );
}
