import { CalendarClock } from "lucide-react";
import { MtgSourceLinks } from "@/components/MtgSourceLinks";
import { formatDate, formatDaysUntil, type CalendarRow } from "@/lib/mtg";

/** Recent + upcoming set releases, chronological. Days-until/since is
 * computed here from released_at at render time — the engine doesn't ship a
 * pre-baked countdown. */
export function MtgCalendarTable({ rows }: { rows: CalendarRow[] }) {
  const sorted = [...rows].sort((a, b) =>
    a.released_at.localeCompare(b.released_at)
  );
  const now = new Date();

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {sorted.map((row) => {
        return (
          <div
            key={row.set_code}
            className="bg-surface border border-border rounded-lg p-4"
          >
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wide text-text-secondary mb-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={row.icon_svg_uri}
                alt=""
                className="w-3.5 h-3.5 opacity-70"
                style={{ filter: "invert(1)" }}
              />
              <span className="border border-border rounded px-1.5 py-0.5">
                {row.set_code}
              </span>
              <span>{row.set_type}</span>
              {row.standard_legal && (
                <span className="text-brass border border-brass/30 rounded px-1.5 py-0.5">
                  Standard-legal
                </span>
              )}
            </div>
            <p className="mtg-display text-lg">{row.set_name}</p>
            <p className="text-sm font-medium tabular-nums mt-0.5 flex items-center gap-1.5">
              <CalendarClock size={12} className="text-brass" />
              {formatDate(row.released_at)}
              <span className="text-brass font-mono text-xs">
                {formatDaysUntil(row.released_at, now)}
              </span>
            </p>
            <div className="mt-2">
              <MtgSourceLinks sources={row.sources} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
