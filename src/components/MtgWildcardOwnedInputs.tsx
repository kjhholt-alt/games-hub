"use client";

import { MtgDraftRarityChip } from "@/components/MtgDraftRarityChip";
import { RARITIES, type Rarity, type WildcardCounts } from "@/lib/mtgWildcards";

/**
 * The 4 owned-wildcard inputs (common/uncommon/rare/mythic) — persisted to
 * localStorage by the parent (MtgWildcardCalculator) on every change so a
 * returning player doesn't re-enter their collection count each visit.
 */
export function MtgWildcardOwnedInputs({
  owned,
  onChange,
}: {
  owned: WildcardCounts;
  onChange: (next: WildcardCounts) => void;
}) {
  function setRarity(rarity: Rarity, value: string) {
    const n = Math.max(0, Math.floor(Number(value) || 0));
    onChange({ ...owned, [rarity]: n });
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {RARITIES.map((r) => (
        <label key={r} className="flex flex-col gap-1.5">
          <MtgDraftRarityChip rarity={r} />
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={owned[r]}
            onChange={(e) => setRarity(r, e.target.value)}
            className="bg-surface border border-border rounded-md px-2.5 py-1.5 text-sm tabular-nums focus:outline-none focus:border-brass/50"
            aria-label={`Owned ${r} wildcards`}
          />
        </label>
      ))}
    </div>
  );
}
