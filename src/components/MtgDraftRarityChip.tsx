/** Magic's rarity metallurgy, straight from the card frames: steel common,
 * silver uncommon, gold rare, copper mythic. The dot is the metal; the label
 * keeps it readable for colorblind users and screen readers. */
const RARITY_STYLE: Record<string, string> = {
  common: "text-rarity-common border-rarity-common/30",
  uncommon: "text-rarity-uncommon border-rarity-uncommon/30",
  rare: "text-rarity-rare border-rarity-rare/40",
  mythic: "text-rarity-mythic border-rarity-mythic/40",
};

/** Shared by the ranker table, the cheat sheet, and the Limited tier table —
 * one rarity definition across the hub. */
export function MtgDraftRarityChip({ rarity }: { rarity: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wide border shrink-0 ${
        RARITY_STYLE[rarity] ?? "text-text-secondary border-border"
      }`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full bg-current opacity-90"
        aria-hidden
      />
      {rarity}
    </span>
  );
}
