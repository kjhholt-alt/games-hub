import { ExternalLink } from "lucide-react";
import { MtgConfidenceChip } from "@/components/MtgConfidenceChip";
import { MtgSourceLinks } from "@/components/MtgSourceLinks";
import { formatLabel, type BanlistFormatRow } from "@/lib/mtg";

/**
 * Per-format banlist summary — the engine ships one row PER FORMAT (banned[]
 * + restricted[] card-name lists), not a per-card action log, so there's no
 * effective_date/reason to show (Scryfall's legalities don't carry ban
 * dates — see the module's own methodology text on the page). Each card
 * links out to the real Wizards B&R page rather than inventing a date.
 */
export function MtgBanlistTable({ rows }: { rows: BanlistFormatRow[] }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {rows.map((row) => (
        <div
          key={row.format}
          className="bg-surface border border-border rounded-lg p-4 flex flex-col"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="mtg-display text-lg">
              {row.format_name || formatLabel(row.format)}
            </p>
            <a
              href={row.wizards_announcements_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-brass hover:text-brass-bright transition-colors shrink-0"
            >
              Wizards B&amp;R page
              <ExternalLink size={10} />
            </a>
          </div>

          <CardList label="Banned" cards={row.banned} />
          {row.restricted.length > 0 && (
            <CardList label="Restricted" cards={row.restricted} />
          )}
          {row.banned.length === 0 && row.restricted.length === 0 && (
            <p className="text-xs text-text-secondary">
              No banned or restricted cards in this format right now.
            </p>
          )}

          <div className="mt-auto pt-3 flex flex-col gap-1.5 items-start">
            <MtgConfidenceChip
              confidence={row.confidence}
              sampleSize={row.sample_size}
            />
            <MtgSourceLinks sources={row.sources} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CardList({ label, cards }: { label: string; cards: string[] }) {
  if (cards.length === 0) return null;
  return (
    <div className="mb-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-text-secondary mb-1.5">
        {label} ({cards.length})
      </p>
      <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto pr-1">
        {cards.map((c) => (
          <span
            key={c}
            className="text-[11px] leading-none rounded px-1.5 py-1 bg-surface-raised border border-border text-text-secondary"
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}
