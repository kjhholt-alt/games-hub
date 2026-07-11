import { AlertTriangle } from "lucide-react";

/**
 * Page-wide honesty banner. Rendered whenever the payload's top-level
 * `status !== "published"` — the hand-written fixture ships with
 * status:"sample" so this ALWAYS shows until the real pipeline publishes.
 */
export function MtgSampleBanner() {
  return (
    <div className="flex items-start gap-3 rounded-md border border-amber/40 bg-amber-dim px-4 py-3 mb-8">
      <AlertTriangle size={15} className="text-amber mt-0.5 shrink-0" />
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-amber mb-1">
          Sample data
        </p>
        <p className="text-text-secondary text-xs leading-relaxed">
          Every row below is a hand-written fixture used to verify this page
          before the real metahub pipeline goes live — none of it is a real
          tier, win rate, or ban. It will be replaced by a live,
          source-stamped publish automatically; nothing here is invented once
          that happens either.
        </p>
      </div>
    </div>
  );
}
