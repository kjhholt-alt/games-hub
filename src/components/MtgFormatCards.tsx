import { ExternalLink } from "lucide-react";
import { MtgSourceLinks } from "@/components/MtgSourceLinks";
import type { FormatRow } from "@/lib/mtg";

/**
 * One snapshot card per format. `coverage_state` is written in plain English
 * and is deliberately honest — several formats say "tiers pending" rather
 * than inventing a number we don't have (see METAHUB-SPEC.md item 5).
 */
export function MtgFormatCards({ rows }: { rows: FormatRow[] }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {rows.map((row) => (
        <div
          key={row.format}
          className="bg-surface border border-border rounded-2xl p-4 flex flex-col"
        >
          <p className="font-semibold mb-1">{row.format}</p>
          <p className="text-xs text-text-secondary leading-relaxed">
            {row.legal_sets_note}
          </p>
          {row.last_br_change && (
            <p className="text-xs text-text-secondary mt-2">
              <span className="text-foreground font-medium">
                Last B&amp;R:
              </span>{" "}
              {row.last_br_change}
            </p>
          )}
          <p className="text-xs mt-2 leading-relaxed">{row.coverage_state}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {row.external_links.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-cyan hover:underline"
              >
                {l.name}
                <ExternalLink size={10} />
              </a>
            ))}
          </div>
          <div className="mt-auto pt-3">
            <MtgSourceLinks sources={row.sources} />
          </div>
        </div>
      ))}
    </div>
  );
}
