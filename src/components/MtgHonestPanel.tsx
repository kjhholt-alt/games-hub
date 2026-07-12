import { Info } from "lucide-react";

/**
 * The shared "we don't have this data (yet)" panel — same visual treatment
 * as the hub's original inline pending_key/no-results block, lifted here so
 * every honest-empty state (Sealed roadmap, Historic coverage, a zero-row
 * Brawl window, an absent Constructed Tiers module inside a Standard/
 * Pioneer/Modern lens) reads identically. Never renders a guessed number —
 * only ever prose explaining what's missing and why.
 */
export function MtgHonestPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-surface px-5 py-4">
      <Info size={15} className="text-brass mt-0.5 shrink-0" />
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-brass mb-1">
          {title}
        </p>
        <div className="text-text-secondary text-xs leading-relaxed max-w-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
