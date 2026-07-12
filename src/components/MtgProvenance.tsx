// Client-safe import: this component renders inside the Draft Ranker (a
// client component), and lib/mtg.ts's fs-based reader can't cross that
// boundary — lib/mtgDraftView.ts is the zero-Node-deps side (see its header).
import { formatFreshness } from "@/lib/mtgDraftView";

type AnyStatus =
  | "published"
  | "sample"
  | "stale"
  | "pending_key"
  | "pending_history"
  | "unavailable";

const DOT: Record<AnyStatus, string> = {
  published: "bg-green",
  sample: "bg-purple",
  stale: "bg-amber",
  pending_key: "bg-text-secondary",
  pending_history: "bg-text-secondary",
  unavailable: "bg-text-secondary",
};

const LABEL: Record<AnyStatus, string> = {
  published: "live",
  sample: "sample",
  stale: "stale",
  pending_key: "pending key",
  pending_history: "pending history",
  unavailable: "no data",
};

/**
 * The provenance ledger — the honesty rail promoted to the hub's visual
 * identity. One mono stamp line per module: status dot, freshness, optional
 * sample note, with the attribution sources as a quieter second line. Every
 * module header and set header renders this instead of scattered chips, so
 * "where did this number come from" reads the same everywhere.
 */
export function MtgProvenance({
  status,
  computedAt,
  note,
  attribution = [],
  align = "left",
}: {
  status: AnyStatus;
  computedAt: string;
  /** Extra ledger fact, e.g. "n=612" or "12,304 games". */
  note?: string;
  attribution?: string[];
  align?: "left" | "right";
}) {
  const alignCls = align === "right" ? "sm:items-end sm:text-right" : "";
  return (
    <div className={`flex flex-col gap-1 ${alignCls}`}>
      <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${DOT[status]}`}
            aria-hidden
          />
          <span
            className={
              status === "published"
                ? "text-green"
                : status === "sample"
                  ? "text-purple"
                  : status === "stale"
                    ? "text-amber"
                    : ""
            }
          >
            {LABEL[status]}
          </span>
        </span>
        <span aria-hidden>·</span>
        <span className="normal-case tracking-normal">
          {formatFreshness(computedAt)}
        </span>
        {note && (
          <>
            <span aria-hidden>·</span>
            <span className="normal-case tracking-normal tabular-nums">
              {note}
            </span>
          </>
        )}
      </span>
      {attribution.length > 0 && (
        <span className="font-mono text-[10px] text-text-secondary/80 leading-relaxed">
          {attribution.join(" · ")}
        </span>
      )}
    </div>
  );
}
