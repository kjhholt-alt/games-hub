import { MtgTierPlate } from "@/components/MtgTierPlate";
import { MtgCardHover } from "@/components/MtgCardHover";
import { MtgConfidenceChip } from "@/components/MtgConfidenceChip";
import { deckCheckBasisColor, type DeckCheckRow } from "@/lib/mtgDeckCheck";
import { isFadedConfidence } from "@/lib/mtgDraftView";

/**
 * Deck Checker Lite results — cloned from MtgCubeTierTable/MtgHobTierTable's
 * dense tier/basis structure (same MtgTierPlate, MtgCardHover, basis-column,
 * confidence-fading pieces), with a Source column added since a matched row
 * here can come from three different modules (Cube, a Draft set, HOB) and
 * that provenance is exactly the kind of thing the no-hidden-basis rule
 * says must stay visible. An uncovered row renders MtgTierPlate's own
 * "unrated" dashed-plate state with a deck-checker-specific tooltip — never
 * a guessed grade, never silently dropped from the list.
 */
export function MtgDeckCheckTable({ rows }: { rows: DeckCheckRow[] }) {
  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface text-left">
            <Th className="w-12">Tier</Th>
            <Th wide>Card</Th>
            <Th className="text-right">Qty</Th>
            <Th>Source</Th>
            <Th>Basis</Th>
            <Th className="text-right">Confidence</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.card}
              className={`border-b border-border last:border-0 hover:bg-brass/5 transition-colors ${
                !row.covered || (row.confidence && isFadedConfidence(row.confidence))
                  ? "opacity-60"
                  : ""
              }`}
            >
              <td className="px-3 py-2">
                <MtgTierPlate
                  letter={row.grade}
                  title={
                    row.covered
                      ? undefined
                      : "Not in the Cube pool or any published format tier data — never a guessed grade"
                  }
                />
              </td>
              <td className="px-4 py-2 font-medium">
                <MtgCardHover cardName={row.card} imageUrl={row.imageNormal}>
                  {row.card}
                </MtgCardHover>
              </td>
              <td className="px-3 py-2 text-right font-mono tabular-nums text-text-secondary">
                {row.count}
              </td>
              <td className="px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                {row.sourceLabel}
              </td>
              <td className={`px-3 py-2 text-xs ${deckCheckBasisColor(row.priorSource)}`}>
                {row.basis ?? "Honestly uncovered — no rating invented"}
              </td>
              <td className="px-3 py-2 text-right">
                {row.covered && row.confidence !== null && row.sampleSize !== null ? (
                  <MtgConfidenceChip confidence={row.confidence} sampleSize={row.sampleSize} />
                ) : (
                  <span className="text-text-secondary text-[10px] font-mono">—</span>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm text-text-secondary">
                Paste a decklist above and check it to see per-card tiers.
              </td>
            </tr>
          )}
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
      className={`${wide ? "px-4" : "px-3"} py-2.5 font-mono text-[10px] uppercase tracking-widest text-text-secondary font-medium ${className}`}
    >
      {children}
    </th>
  );
}
