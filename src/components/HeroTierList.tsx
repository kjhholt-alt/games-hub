import Image from "next/image";
import {
  groupByTier,
  TIER_BLURB,
  type DeadlockTierList,
  type RankedHero,
} from "@/lib/deadlock";
import { TierBadge } from "@/components/TierBadge";

/**
 * Full Deadlock tier list: a tier-banded grid of hero cards (top), then a
 * detailed sortable-looking ranking table with win/pick rate + KDA (bottom).
 * Data is computed in lib/deadlock from the live API — nothing here is mocked.
 */
export function HeroTierList({ data }: { data: DeadlockTierList }) {
  const groups = groupByTier(data.heroes);

  return (
    <div className="space-y-10">
      {/* Tier bands */}
      <div className="space-y-3">
        {groups.map((group) => (
          <div
            key={group.letter}
            className="flex flex-col sm:flex-row gap-3 bg-surface border border-border rounded-2xl p-4"
          >
            <div className="flex sm:flex-col items-center sm:justify-center gap-3 sm:w-40 shrink-0">
              <TierBadge letter={group.letter} size="lg" />
              <p className="text-xs text-text-secondary sm:text-center leading-snug">
                {TIER_BLURB[group.letter]}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 flex-1">
              {group.heroes.map((hero) => (
                <HeroChip key={hero.id} hero={hero} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Full ranking table */}
      <div>
        <h2 className="text-xl font-bold mb-4">Full ranking by win rate</h2>
        <div className="overflow-x-auto border border-border rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-text-secondary text-left">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Hero</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium text-right">Win rate</th>
                <th className="px-4 py-3 font-medium text-right">Pick rate</th>
                <th className="px-4 py-3 font-medium text-right">KDA</th>
                <th className="px-4 py-3 font-medium text-right">Matches</th>
              </tr>
            </thead>
            <tbody>
              {data.heroes.map((hero) => (
                <tr
                  key={hero.id}
                  className="border-b border-border last:border-0 hover:bg-surface/60 transition-colors"
                >
                  <td className="px-4 py-2.5 text-text-secondary tabular-nums">
                    {hero.rank}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <HeroIcon hero={hero} size={28} />
                      <span className="font-medium">{hero.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <TierBadge letter={hero.tier} />
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold">
                    {hero.winRate.toFixed(1)}%
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
                    {hero.pickRate.toFixed(1)}%
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
                    {hero.kda.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
                    {hero.matches.toLocaleString("en-US")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-secondary mt-3">
          Win rate is wins / matches over the current sample. KDA is (kills +
          assists) / deaths. Heroes with fewer than{" "}
          {data.minMatches.toLocaleString("en-US")} matches are excluded.
        </p>
      </div>
    </div>
  );
}

function HeroChip({ hero }: { hero: RankedHero }) {
  return (
    <div className="flex items-center gap-2 bg-surface-raised border border-border rounded-xl pl-1.5 pr-3 py-1.5">
      <HeroIcon hero={hero} size={32} />
      <div className="leading-tight">
        <p className="text-sm font-medium">{hero.name}</p>
        <p className="text-[11px] text-text-secondary tabular-nums">
          {hero.winRate.toFixed(1)}% WR
        </p>
      </div>
    </div>
  );
}

function HeroIcon({ hero, size }: { hero: RankedHero; size: number }) {
  if (!hero.icon) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-md bg-border text-[10px] text-text-secondary shrink-0"
        style={{ width: size, height: size }}
      >
        {hero.name.slice(0, 2)}
      </span>
    );
  }
  return (
    <Image
      src={hero.icon}
      alt={hero.name}
      width={size}
      height={size}
      className="rounded-md shrink-0 object-cover"
      unoptimized
    />
  );
}
