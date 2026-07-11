import { MtgProvenance } from "@/components/MtgProvenance";
import type { DraftSetStatus } from "@/lib/mtgDraftView";

/**
 * Per-set header for the Draft Ranker — the same header-plate + provenance-
 * ledger language as MtgModuleHeader, typed for DraftSetStatus (which adds
 * "unavailable": a set 17lands hasn't published enough volume for yet).
 */
export function MtgDraftSetHeader({
  setName,
  setCode,
  status,
  computedAt,
  totalGames,
  attribution,
}: {
  setName: string;
  setCode: string;
  status: DraftSetStatus;
  computedAt: string;
  totalGames: number;
  attribution: string[];
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-border pb-3 mb-5">
      <h2 className="mtg-display text-2xl leading-tight">
        {setName}{" "}
        <span className="font-mono text-sm text-text-secondary tracking-wider align-middle">
          {setCode}
        </span>
      </h2>
      <MtgProvenance
        status={status}
        computedAt={computedAt}
        note={
          totalGames > 0
            ? `${totalGames.toLocaleString("en-US")} games`
            : undefined
        }
        attribution={attribution}
        align="right"
      />
    </div>
  );
}
