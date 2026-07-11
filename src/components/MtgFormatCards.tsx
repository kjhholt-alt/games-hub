import { ExternalLink } from "lucide-react";
import { MtgSourceLinks } from "@/components/MtgSourceLinks";
import type { FormatRow } from "@/lib/mtg";

/** Known external-link keys -> a nicer display name than the raw object key. */
const LINK_LABEL: Record<string, string> = {
  untapped: "untapped.gg",
  mtggoldfish: "MTGGoldfish",
};

/**
 * One snapshot card per format. `coverage_state` is written in plain English
 * by the engine and is deliberately honest — several formats say "tiers
 * pending tournament key" rather than inventing a number we don't have (see
 * METAHUB-SPEC.md item 5). legal_sets is a real (sometimes 200+ entry) list
 * from Scryfall legalities — shown as a count plus a scrollable code list
 * rather than an unreadable wall of text.
 */
export function MtgFormatCards({ rows }: { rows: FormatRow[] }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {rows.map((row) => (
        <div
          key={row.format}
          className="bg-surface border border-border rounded-lg p-4 flex flex-col"
        >
          <p className="mtg-display text-lg mb-1.5">{row.format_name}</p>

          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wide text-text-secondary mb-2">
            <span className="border border-border rounded px-1.5 py-0.5">
              {row.legal_sets.length} legal sets
            </span>
            <span className="border border-red/30 text-red rounded px-1.5 py-0.5">
              {row.banned_count} banned
            </span>
            {row.restricted_count > 0 && (
              <span className="border border-amber/30 text-amber rounded px-1.5 py-0.5">
                {row.restricted_count} restricted
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto mb-2 pr-1">
            {row.legal_sets.map((s) => (
              <span
                key={s}
                className="text-[10px] font-mono leading-none rounded px-1.5 py-1 bg-surface-raised border border-border text-text-secondary"
              >
                {s}
              </span>
            ))}
          </div>

          <p className="text-xs leading-relaxed">{row.coverage_state}</p>

          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(row.external_links).map(([key, url]) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brass hover:text-brass-bright transition-colors"
              >
                {LINK_LABEL[key] ?? key}
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
