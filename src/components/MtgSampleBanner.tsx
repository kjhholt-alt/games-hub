import { AlertTriangle } from "lucide-react";

/**
 * Page-wide honesty banner. Rendered whenever the payload's top-level
 * `status !== "published"` — the hand-written fixture ships with
 * status:"sample" so this ALWAYS shows until the real pipeline publishes.
 */
export function MtgSampleBanner() {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-amber/40 bg-amber-dim px-4 py-3 mb-8">
      <AlertTriangle size={16} className="text-amber mt-0.5 shrink-0" />
      <div className="text-sm">
        <p className="font-semibold text-amber">SAMPLE DATA</p>
        <p className="text-text-secondary text-xs mt-0.5 leading-relaxed">
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
