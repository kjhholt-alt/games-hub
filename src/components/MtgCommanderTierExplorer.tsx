"use client";

import { useEffect, useMemo, useState } from "react";
import { MtgTierFilterBar, type MtgTierFacetGroup } from "@/components/MtgTierFilterBar";
import { MtgCommanderTierTable } from "@/components/MtgCommanderTierTable";
import { asOneOf, readNamespacedParam, writeNamespacedParams } from "@/lib/mtgUrlState";
import {
  COMMANDER_COLOR_FILTERS,
  COMMANDER_SORT_KEYS,
  COMMANDER_TIER_FILTERS,
  commanderSortDefaultDir,
  matchesCommanderColor,
  matchesCommanderSearch,
  matchesCommanderTier,
  sortCommanderRows,
  type CommanderColorFilter,
  type CommanderSortKey,
  type CommanderTierFilter,
} from "@/lib/mtgTierView";
import type { CommanderTierRow } from "@/lib/mtg";

const COLOR_LABEL: Record<CommanderColorFilter, string> = {
  all: "All colors",
  white: "White",
  blue: "Blue",
  black: "Black",
  red: "Red",
  green: "Green",
  multicolor: "Multicolor",
  colorless: "Colorless",
};

const COLOR_LETTER: Partial<Record<CommanderColorFilter, string>> = {
  white: "W",
  blue: "U",
  black: "B",
  red: "R",
  green: "G",
};

interface CommanderExplorerState {
  q: string;
  color: CommanderColorFilter;
  tier: CommanderTierFilter;
  sort: CommanderSortKey | null;
  dir: "asc" | "desc";
}

const DEFAULT_STATE: CommanderExplorerState = {
  q: "",
  color: "all",
  tier: "all",
  sort: null,
  dir: "desc",
};

function readState(prefix: string): CommanderExplorerState {
  const sortParam = readNamespacedParam(prefix, "sort");
  const sort =
    sortParam && (COMMANDER_SORT_KEYS as readonly string[]).includes(sortParam)
      ? (sortParam as CommanderSortKey)
      : null;
  const dirParam = readNamespacedParam(prefix, "dir");
  return {
    q: readNamespacedParam(prefix, "q") ?? DEFAULT_STATE.q,
    color: asOneOf(readNamespacedParam(prefix, "color"), COMMANDER_COLOR_FILTERS, DEFAULT_STATE.color),
    tier: asOneOf(readNamespacedParam(prefix, "tier"), COMMANDER_TIER_FILTERS, DEFAULT_STATE.tier),
    sort,
    dir: dirParam === "asc" || dirParam === "desc" ? dirParam : DEFAULT_STATE.dir,
  };
}

/**
 * Filter-bar wrapper around MtgCommanderTierTable (gl-0593), extending the
 * cube filter bar pattern (gl-0571, MtgCubeExplorer) to the Commander/Brawl
 * axis on /mtg. Search/color/tier facets + explicit client sort, entirely
 * client-side over the server-rendered rows already passed in as props —
 * nothing here fetches, and no rarity/type/basis facet is offered since
 * CommanderTierRow doesn't carry those fields (METAHUB-SPEC.md: never
 * fabricate a filter the payload can't back).
 *
 * `idPrefix` namespaces this instance's URL query params (see
 * lib/mtgUrlState.ts) — /mtg mounts several of these simultaneously (the
 * all-formats board plus one per Commander/Competitive Brawl/Brawl "world"
 * MtgMetaLens toggles between), so each needs its own key namespace to stay
 * independently shareable/bookmarkable without colliding.
 */
export function MtgCommanderTierExplorer({
  rows,
  idPrefix,
}: {
  rows: CommanderTierRow[];
  idPrefix: string;
}) {
  const [state, setState] = useState<CommanderExplorerState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readState(idPrefix));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeNamespacedParams(idPrefix, {
      q: state.q.trim() || null,
      color: state.color !== DEFAULT_STATE.color ? state.color : null,
      tier: state.tier !== DEFAULT_STATE.tier ? state.tier : null,
      sort: state.sort,
      dir: state.sort ? state.dir : null,
    });
  }, [state, hydrated, idPrefix]);

  const filteredRows = useMemo(
    () =>
      rows
        .filter((r) => matchesCommanderSearch(r, state.q))
        .filter((r) => matchesCommanderColor(r, state.color))
        .filter((r) => matchesCommanderTier(r, state.tier)),
    [rows, state.q, state.color, state.tier]
  );

  const displayRows = useMemo(
    () => (state.sort ? sortCommanderRows(filteredRows, state.sort, state.dir) : filteredRows),
    [filteredRows, state.sort, state.dir]
  );

  function handleSort(key: CommanderSortKey) {
    setState((prev) => {
      if (prev.sort !== key) {
        return { ...prev, sort: key, dir: commanderSortDefaultDir(key) };
      }
      const def = commanderSortDefaultDir(key);
      if (prev.dir === def) {
        return { ...prev, dir: def === "asc" ? "desc" : "asc" };
      }
      return { ...prev, sort: null };
    });
  }

  const facetGroups: MtgTierFacetGroup[] = [
    {
      key: "color",
      ariaLabel: "Color filter",
      active: state.color,
      onChange: (v) => setState((prev) => ({ ...prev, color: v as CommanderColorFilter })),
      options: COMMANDER_COLOR_FILTERS.map((c) => ({
        value: c,
        label: COLOR_LABEL[c],
        dot: COLOR_LETTER[c],
      })),
    },
    {
      key: "tier",
      ariaLabel: "Tier filter",
      active: state.tier,
      onChange: (v) => setState((prev) => ({ ...prev, tier: v as CommanderTierFilter })),
      options: COMMANDER_TIER_FILTERS.map((t) => ({
        value: t,
        label: t === "all" ? "All tiers" : `Tier ${t}`,
      })),
    },
  ];

  return (
    <div>
      <MtgTierFilterBar
        query={state.q}
        onQueryChange={(q) => setState((prev) => ({ ...prev, q }))}
        searchPlaceholder="Search commanders..."
        facetGroups={facetGroups}
      />

      <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary mb-2">
        {filteredRows.length.toLocaleString("en-US")} of {rows.length.toLocaleString("en-US")}{" "}
        commanders shown{state.sort ? " — client-sorted" : " — server order"}
      </p>

      <MtgCommanderTierTable
        rows={displayRows}
        sortKey={state.sort}
        sortDir={state.dir}
        onSort={handleSort}
      />
    </div>
  );
}
