import { ChevronDown } from "lucide-react";

/**
 * Collapsed by default (the formula text runs 1,500+ characters — too long
 * to sit inline under every set's header) but renders the payload's own
 * methodology string VERBATIM, never a paraphrase. Native <details> so it
 * works without JS and prints expanded if the user opened it before
 * printing.
 */
export function MtgDraftMethodologyAccordion({ methodology }: { methodology: string }) {
  return (
    <details className="bg-surface border border-border rounded-lg mb-8 group print:hidden">
      <summary className="flex items-center justify-between gap-2 cursor-pointer select-none px-5 py-3.5 font-mono text-[11px] uppercase tracking-wider text-text-secondary hover:text-foreground transition-colors">
        BuildKit Draft Score — full methodology
        <ChevronDown size={15} className="transition-transform group-open:rotate-180" />
      </summary>
      <p className="text-sm text-text-secondary leading-relaxed px-5 pb-5 whitespace-pre-line">
        {methodology}
      </p>
    </details>
  );
}
