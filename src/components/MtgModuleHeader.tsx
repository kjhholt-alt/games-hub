import type { ModuleStatus } from "@/lib/mtg";
import { MtgProvenance } from "@/components/MtgProvenance";

/**
 * Every module's header plate: inscriptional title on the left, the
 * provenance ledger (status · freshness · attribution) on the right, ruled
 * off from the module body. The "how this is computed" accordion sits under
 * the rule — the per-module half of the honesty rail, promoted from chip
 * clutter to the hub's actual visual identity.
 */
export function MtgModuleHeader({
  title,
  status,
  computedAt,
  methodology,
  attribution,
  note,
  extra,
}: {
  title: string;
  status: ModuleStatus;
  computedAt: string;
  methodology: string;
  attribution: string[];
  /** Extra ledger fact, e.g. "612 decks scanned". */
  note?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-border pb-3 mb-3">
        <h2 className="mtg-display text-2xl sm:text-[1.7rem] leading-tight">
          {title}
        </h2>
        <MtgProvenance
          status={status}
          computedAt={computedAt}
          note={note}
          attribution={attribution}
          align="right"
        />
      </div>
      <details className="max-w-3xl group">
        <summary className="cursor-pointer list-none inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-text-secondary hover:text-brass transition-colors select-none">
          <span className="inline-block group-open:rotate-90 transition-transform">
            &#9656;
          </span>
          How this is computed
        </summary>
        <p className="text-sm text-text-secondary leading-relaxed mt-2 pl-4 border-l border-border">
          {methodology}
        </p>
      </details>
      {extra}
    </div>
  );
}
