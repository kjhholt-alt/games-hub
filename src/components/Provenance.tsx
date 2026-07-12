export type NetworkStatus = "live" | "cached" | "curated" | "aggregated" | "signal";

const DOT: Record<NetworkStatus, string> = {
  live: "bg-green",
  cached: "bg-amber",
  curated: "bg-text-secondary",
  aggregated: "bg-cyan",
  signal: "bg-purple",
};

const TEXT: Record<NetworkStatus, string> = {
  live: "text-green",
  cached: "text-amber",
  curated: "text-text-secondary",
  aggregated: "text-cyan",
  signal: "text-purple",
};

const LABEL: Record<NetworkStatus, string> = {
  live: "live",
  cached: "cached snapshot",
  curated: "hand-curated",
  aggregated: "aggregated",
  signal: "unverified signal",
};

/**
 * The network's honesty stamp — one dense mono line per page: a status dot,
 * what kind of data this is (live / cached / hand-curated / aggregated / an
 * unverified community signal), when it was last touched, and an optional
 * source note. Same structural job as the MTG hub's MtgProvenance ("where
 * did this come from"), but a distinct file with its own status vocabulary
 * and no brass — this lane never imports across the ownership line.
 *
 * `freshness` must be either a real relative/absolute stamp (lib/format.ts)
 * or an honest fixed label like "reviewed Jun 29" — never an invented
 * "updated Xh ago" for hand-curated data.
 */
export function Provenance({
  status,
  freshness,
  note,
  attribution,
  align = "left",
}: {
  status: NetworkStatus;
  freshness?: string;
  /** Extra ledger fact, e.g. "612 matches" or "4 sources". */
  note?: string;
  attribution?: string;
  align?: "left" | "right";
}) {
  const alignCls = align === "right" ? "sm:items-end sm:text-right" : "";
  return (
    <div className={`flex flex-col gap-1 ${alignCls}`}>
      <span className="inline-flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${DOT[status]}`}
            aria-hidden
          />
          <span className={TEXT[status]}>{LABEL[status]}</span>
        </span>
        {freshness && (
          <>
            <span aria-hidden>&middot;</span>
            <span className="normal-case tracking-normal">{freshness}</span>
          </>
        )}
        {note && (
          <>
            <span aria-hidden>&middot;</span>
            <span className="normal-case tracking-normal tabular-nums">
              {note}
            </span>
          </>
        )}
      </span>
      {attribution && (
        <span className="font-mono text-[10px] text-text-secondary/80 leading-relaxed">
          {attribution}
        </span>
      )}
    </div>
  );
}
