import { ManaDots } from "@/components/MtgManaPips";
import { MtgCardHover } from "@/components/MtgCardHover";
import { MtgDraftGradeBadge } from "@/components/MtgDraftGradeBadge";
import { MtgConfidenceChip } from "@/components/MtgConfidenceChip";
import {
  COLOR_PAIRS,
  formatWinRate,
  getPairArchetypeRow,
  isFadedConfidence,
  topCardsForPair,
  type DraftArchetypeRow,
  type DraftCardRow,
} from "@/lib/mtgDraftView";

/**
 * Color-pair synergy view — a 10-tile grid, one per WUBRG guild pair, built
 * entirely from rows the pipeline already publishes: the pair's own
 * two-color row inside the set's optional `archetypes` module (a real
 * 17lands deck win rate, see MtgArchetypeTable) for the headline number, and
 * the set's `overall_rows` (real per-card grades) for the "top picks" list
 * — no new payload field, no client-invented statistic. A pair 17lands
 * hasn't published a distinct sample for yet renders an honest unrated
 * tile rather than a guessed win rate; the no-unrated rule is global, this
 * view is not an exception. `cards` arrives already run through the same
 * search/rarity/tier/basis filters the ranker table uses (its caller's
 * job), so the top-picks lists stay in lockstep with the rest of the page's
 * filter bar; `colors` (also shared with the ranker) gates which tiles show
 * at all — a tile is visible if it shares any selected color, or every tile
 * shows when nothing is selected.
 */
export function MtgColorPairSynergy({
  archetypeRows,
  cards,
  colors,
}: {
  archetypeRows: DraftArchetypeRow[] | undefined;
  cards: DraftCardRow[];
  colors: string[];
}) {
  const visiblePairs = COLOR_PAIRS.filter(
    (p) => colors.length === 0 || colors.some((c) => c !== "C" && p.key.includes(c))
  );

  if (visiblePairs.length === 0) {
    return (
      <p className="text-sm text-text-secondary py-8 text-center">
        No color pair matches the current color filter.
      </p>
    );
  }

  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visiblePairs.map((pair) => (
          <SynergyTile
            key={pair.key}
            pairKey={pair.key}
            guild={pair.guild}
            archetypeRow={archetypeRows ? getPairArchetypeRow(archetypeRows, pair.key) : undefined}
            topCards={topCardsForPair(cards, pair.key, 5)}
          />
        ))}
      </div>
      <p className="text-[11px] text-text-secondary leading-relaxed mt-3">
        Win rate is the guild&rsquo;s real 17lands deck win rate (final deck colors, not a card
        rating); top picks are this set&rsquo;s real per-card grades for cards playable in the
        pair, best BuildKit Draft Score first.
      </p>
    </div>
  );
}

function SynergyTile({
  pairKey,
  guild,
  archetypeRow,
  topCards,
}: {
  pairKey: string;
  guild: string;
  archetypeRow: DraftArchetypeRow | undefined;
  topCards: DraftCardRow[];
}) {
  const unrated = !archetypeRow || archetypeRow.win_rate === null;

  return (
    <div
      className={`bg-surface border border-border rounded-lg p-4 ${
        archetypeRow && isFadedConfidence(archetypeRow.confidence) ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="inline-flex items-center gap-2 font-medium">
          <ManaDots letters={pairKey} size="md" />
          {guild}
        </span>
        {archetypeRow?.rank != null && (
          <span
            className="font-mono text-[10px] text-text-secondary tabular-nums"
            title="Rank among the 10 guild pairs, by real 17lands deck win rate"
          >
            #{archetypeRow.rank} of 10
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 mb-3">
        {unrated ? (
          <span
            className="text-sm text-text-secondary"
            title="17lands hasn't published a distinct sample for this pair yet"
          >
            unrated
          </span>
        ) : (
          <span className="text-lg font-semibold tabular-nums">
            {formatWinRate(archetypeRow.win_rate)}
          </span>
        )}
        {archetypeRow && (
          <MtgConfidenceChip confidence={archetypeRow.confidence} sampleSize={archetypeRow.sample_size} />
        )}
      </div>

      {topCards.length > 0 ? (
        <ol className="space-y-1.5 border-t border-border pt-3">
          {topCards.map((row, i) => (
            <li key={row.card} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-1.5 min-w-0">
                <span className="text-text-secondary font-mono tabular-nums text-xs w-3 shrink-0">
                  {i + 1}
                </span>
                <MtgCardHover cardName={row.card} imageUrl={row.image_normal} className="truncate">
                  {row.card}
                </MtgCardHover>
              </span>
              <span className="flex items-center gap-1.5 shrink-0">
                <ManaDots letters={row.color} />
                <MtgDraftGradeBadge grade={row.grade} size="sm" />
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs text-text-secondary border-t border-border pt-3">
          No cards match the current filters for this pair.
        </p>
      )}
    </div>
  );
}
