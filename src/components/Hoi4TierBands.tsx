import { groupByTier, TIER_BLURB, type Hoi4Nation } from "@/lib/hoi4";
import { Hoi4TierBadge } from "@/components/Hoi4TierBadge";
import { Hoi4NationCard } from "@/components/Hoi4NationCard";

/**
 * The full HOI4 nation meta: a compact tier-banded overview (S→C, each tier with
 * its nations as chips), then the detailed per-nation strategy cards grouped by
 * tier. Mirrors the Deadlock HeroTierList structure (bands on top, detail below)
 * so the two meta pages read as one product.
 */
export function Hoi4TierBands({ nations }: { nations: Hoi4Nation[] }) {
  const groups = groupByTier(nations);

  return (
    <div className="space-y-12">
      {/* Tier bands overview */}
      <div className="space-y-3">
        {groups.map((group) => (
          <div
            key={group.letter}
            className="flex flex-col sm:flex-row gap-3 bg-surface border border-border rounded-2xl p-4"
          >
            <div className="flex sm:flex-col items-center sm:justify-center gap-3 sm:w-44 shrink-0">
              <Hoi4TierBadge letter={group.letter} size="lg" />
              <p className="text-xs text-text-secondary sm:text-center leading-snug">
                {TIER_BLURB[group.letter]}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 flex-1 sm:items-center">
              {group.nations.map((nation) => (
                <span
                  key={nation.tag}
                  className="inline-flex items-center gap-2 bg-surface-raised border border-border rounded-xl px-3 py-1.5 text-sm font-medium"
                >
                  {nation.name}
                  <span className="text-[10px] font-mono text-text-secondary">
                    {nation.tag}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed strategy cards, grouped under a tier heading */}
      {groups.map((group) => (
        <div key={group.letter}>
          <div className="flex items-center gap-3 mb-4">
            <Hoi4TierBadge letter={group.letter} />
            <h2 className="text-xl font-bold">
              {group.letter}-Tier nations
            </h2>
            <span className="text-sm text-text-secondary">
              {TIER_BLURB[group.letter]}
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {group.nations.map((nation) => (
              <Hoi4NationCard key={nation.tag} nation={nation} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
