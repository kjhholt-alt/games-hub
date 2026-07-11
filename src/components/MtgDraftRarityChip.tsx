const RARITY_STYLE: Record<string, string> = {
  common: "text-text-secondary bg-surface border-border",
  uncommon: "text-cyan bg-cyan-dim border-cyan/30",
  rare: "text-amber bg-amber-dim border-amber/30",
  mythic: "text-red bg-red-dim border-red/30",
};

/** Same rarity chip convention as MtgLimitedTierTable, factored out here so
 * the ranker table and the cheat sheet share one definition. */
export function MtgDraftRarityChip({ rarity }: { rarity: string }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono uppercase border shrink-0 ${
        RARITY_STYLE[rarity] ?? "text-text-secondary bg-surface border-border"
      }`}
    >
      {rarity}
    </span>
  );
}
