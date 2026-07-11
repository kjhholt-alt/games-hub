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
            className="bg-surface border border-border rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 text-xs text-text-secondary mb-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={row.icon_svg_uri}
                alt=""
                className="w-3.5 h-3.5 opacity-70"
                style={{ filter: "invert(1)" }}
              />
              <span className="font-mono text-[10px] bg-surface-raised border border-border rounded px-1.5 py-0.5">
                {row.set_code}
              </span>
              <span className="capitalize">{row.set_type}</span>
              {row.standard_legal && (
                <span className="text-cyan bg-cyan-dim border border-cyan/30 rounded px-1.5 py-0.5 text-[10px] font-mono uppercase">
                  Standard-legal
                </span>
              )}
            </div>
            <p className="font-semibold">{row.set_name}</p>
            <p className="text-sm text-cyan font-medium tabular-nums mt-0.5 flex items-center gap-1.5">
              <CalendarClock size={12} />
              {formatDate(row.released_at)}
              <span className="text-text-secondary font-normal">
                ({formatDaysUntil(row.released_at, now)})
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
