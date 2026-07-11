import { CalendarClock, RefreshCcw } from "lucide-react";
import { MtgSourceLinks } from "@/components/MtgSourceLinks";
import { formatDate, type CalendarRow } from "@/lib/mtg";

/** Set releases + rotation windows, chronological, cards not a table (few rows). */
export function MtgCalendarTable({ rows }: { rows: CalendarRow[] }) {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {sorted.map((row) => (
        <div
          key={`${row.kind}-${row.label}`}
          className="bg-surface border border-border rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 text-xs text-text-secondary mb-1">
            {row.kind === "set_release" ? (
              <CalendarClock size={12} className="text-cyan" />
            ) : (
              <RefreshCcw size={12} className="text-amber" />
            )}
            {row.kind === "set_release" ? "Set release" : "Rotation"}
            {row.set_code && (
              <span className="font-mono text-[10px] bg-surface-raised border border-border rounded px-1.5 py-0.5">
                {row.set_code}
              </span>
            )}
          </div>
          <p className="font-semibold">{row.label}</p>
          <p className="text-sm text-cyan font-medium tabular-nums mt-0.5">
            {formatDate(row.date)}
          </p>
          <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
            {row.detail}
          </p>
          <div className="mt-2">
            <MtgSourceLinks sources={row.sources} />
          </div>
        </div>
      ))}
    </div>
  );
}
