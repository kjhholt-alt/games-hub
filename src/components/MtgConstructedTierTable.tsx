import { ExternalLink } from "lucide-react";
import { MtgTierPlate } from "@/components/MtgTierPlate";
import {
  formatLabel,
  formatWinRate,
  groupByConstructedFormat,
  isFadedConfidence,
  TIER_ORDER,
  type ConstructedTierRow,
  type Tier,
} from "@/lib/mtg";

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
 */
export function MtgConstructedTierTable({ rows }: { rows: ConstructedTierRow[] }) {
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
        <FormatBoard key={g.format} format={g.format} rows={g.rows} />
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

function FormatBoard({ format, rows }: { format: string; rows: ConstructedTierRow[] }) {
  const sorted = sortRows(rows);
  const top = sorted.slice(0, TOP_N);

  return (
    <div>
      <h3 className="font-mono text-[11px] uppercase tracking-widest text-text-secondary mb-3">
        {formatLabel(format)}
      </h3>
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left">
              <Th className="w-10 text-right">#</Th>
              <Th className="w-12">Tier</Th>
              <Th wide>Archetype / Deck</Th>
              <Th className="text-right">Win rate</Th>
              <Th className="text-right">W-L-D</Th>
              <Th className="text-right">Events</Th>
              <Th className="text-right hidden lg:table-cell">Best finish</Th>
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
        Top {top.length} of {rows.length} archetypes/decks by win rate ·
        faded rows = small samples
      </p>
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
