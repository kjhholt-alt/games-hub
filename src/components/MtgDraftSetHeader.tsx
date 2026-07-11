import { RefreshCw } from "lucide-react";
import { formatFreshness, type DraftSetStatus } from "@/lib/mtgDraftView";

const STATUS_STYLE: Record<DraftSetStatus, string> = {
  published: "text-green bg-green-dim border-green/30",
  unavailable: "text-text-secondary bg-surface border-border",
  sample: "text-purple bg-purple-dim border-purple/30",
  stale: "text-amber bg-amber-dim border-amber/30",
};

const STATUS_LABEL: Record<DraftSetStatus, string> = {
  published: "graded",
  unavailable: "no graded data",
  sample: "sample",
  stale: "stale",
};

/**
 * Per-set header for the Draft Ranker — same visual language as
 * MtgModuleHeader (status chip + freshness + methodology + attribution), but
 * typed for DraftSetStatus, which adds "unavailable" (a set 17lands hasn't
 * published enough volume for yet) alongside the shared published/sample/
 * stale states.
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
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <h2 className="text-xl font-bold">
          {setName} <span className="text-text-secondary font-mono text-sm">{setCode}</span>
        </h2>
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase ${STATUS_STYLE[status]}`}
        >
          {STATUS_LABEL[status]}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
          <RefreshCw size={11} />
          updated {formatFreshness(computedAt)}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-text-secondary tabular-nums">
          {totalGames.toLocaleString("en-US")} ever-drawn games
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-text-secondary">
        {attribution.map((a) => (
          <span key={a}>{a}</span>
        ))}
      </div>
    </div>
  );
}
