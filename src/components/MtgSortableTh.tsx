import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

/**
 * Shared sortable/plain table-header cell (gl-0593), extracted from
 * MtgCubeTierTable's inline Th+button+SortIcon markup so the new Commander
 * and Constructed tier explorers don't each hand-roll a copy. Pass
 * `sortKey={null}` for a plain, non-clickable header (e.g. "#", "Colors").
 */
export function MtgSortableTh({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  align,
  className = "",
  wide = false,
}: {
  label: string;
  sortKey: string | null;
  activeKey: string | null;
  dir: "asc" | "desc";
  onSort?: (key: string) => void;
  align?: "right";
  className?: string;
  wide?: boolean;
}) {
  return (
    <th
      className={`${wide ? "px-4" : "px-3"} py-2.5 font-mono text-[10px] uppercase tracking-widest text-text-secondary font-medium ${align === "right" ? "text-right" : ""} ${className}`}
    >
      {sortKey && onSort ? (
        <button
          type="button"
          onClick={() => onSort(sortKey)}
          className={`inline-flex items-center gap-1 uppercase tracking-widest hover:text-foreground transition-colors ${
            align === "right" ? "flex-row-reverse" : ""
          } ${activeKey === sortKey ? "text-brass" : ""}`}
        >
          {label}
          <SortIcon active={activeKey === sortKey} dir={dir} />
        </button>
      ) : (
        label
      )}
    </th>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown size={11} className="opacity-40" />;
  return dir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />;
}
