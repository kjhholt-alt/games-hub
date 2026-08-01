"use client";

import { Search } from "lucide-react";
import { ManaDots } from "@/components/MtgManaPips";

export interface MtgTierFacetOption {
  value: string;
  label: string;
  /** WUBRG letter to render as a mana pip beside the label (color facets
   * only — omitted for tier/rating chips). */
  dot?: string;
}

export interface MtgTierFacetGroup {
  key: string;
  ariaLabel: string;
  options: MtgTierFacetOption[];
  active: string;
  onChange: (value: string) => void;
}

/**
 * Reusable search + facet-chip filter bar (gl-0593), generalizing
 * MtgCubeExplorer's inline filter bar (gl-0571) for reuse across the
 * Commander/Brawl and Constructed tier explorers. Chips render as a fixed
 * set (same count/size regardless of active state) so toggling a facet
 * never reflows the page — same rule as the cube page's bar.
 */
export function MtgTierFilterBar({
  query,
  onQueryChange,
  searchPlaceholder,
  facetGroups,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  searchPlaceholder: string;
  facetGroups: MtgTierFacetGroup[];
}) {
  return (
    <div className="flex flex-col gap-3 mb-4 print:hidden">
      <div className="relative w-fit">
        <Search
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="bg-surface border border-border rounded-md pl-7 pr-3 py-1.5 text-sm w-48 focus:outline-none focus:border-brass/50"
        />
      </div>
      {facetGroups.map((group) => (
        <div key={group.key} className="flex flex-wrap gap-2" aria-label={group.ariaLabel}>
          {group.options.map((o) => (
            <FacetChip
              key={o.value}
              active={group.active === o.value}
              onClick={() => group.onChange(o.value)}
              label={o.label}
              dot={o.dot}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function FacetChip({
  active,
  onClick,
  label,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-brass/50 bg-brass-dim text-brass"
          : "border-border bg-surface text-text-secondary hover:border-brass/30 hover:text-foreground"
      }`}
    >
      {dot && <ManaDots letters={dot} />}
      {label}
    </button>
  );
}
