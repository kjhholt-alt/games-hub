"use client";

import { useEffect, useMemo, useState } from "react";
import { MtgTierFilterBar, type MtgTierFacetGroup } from "@/components/MtgTierFilterBar";
import { MtgConstructedTierTable } from "@/components/MtgConstructedTierTable";
import { asOneOf, readNamespacedParam, writeNamespacedParams } from "@/lib/mtgUrlState";
import {
  CONSTRUCTED_SORT_KEYS,
  CONSTRUCTED_TIER_FILTERS,
  constructedSortDefaultDir,
  matchesConstructedSearch,
  matchesConstructedTier,
  sortConstructedRows,
  type ConstructedSortKey,
  type ConstructedTierFilter,
} from "@/lib/mtgTierView";
import type { ConstructedTierRow } from "@/lib/mtg";

interface ConstructedExplorerState {
  q: string;
  tier: ConstructedTierFilter;
  sort: ConstructedSortKey | null;
  dir: "asc" | "desc";
}

const DEFAULT_STATE: ConstructedExplorerState = {
  q: "",
  tier: "all",
  sort: null,
  dir: "desc",
};

function readState(prefix: string): ConstructedExplorerState {
  const sortParam = readNamespacedParam(prefix, "sort");
  const sort =
    sortParam && (CONSTRUCTED_SORT_KEYS as readonly string[]).includes(sortParam)
      ? (sortParam as ConstructedSortKey)
      : null;
  const dirParam = readNamespacedParam(prefix, "dir");
  return {
    q: readNamespacedParam(prefix, "q") ?? DEFAULT_STATE.q,
    tier: asOneOf(readNamespacedParam(prefix, "tier"), CONSTRUCTED_TIER_FILTERS, DEFAULT_STATE.tier),
    sort,
    dir: dirParam === "asc" || dirParam === "desc" ? dirParam : DEFAULT_STATE.dir,
  };
}

/**
 * Filter-bar wrapper around MtgConstructedTierTable (gl-0593), extending the
 * cube filter bar pattern (gl-0571, MtgCubeExplorer) to the Standard/
 * Pioneer/Modern axis on /mtg. Search + tier facets only — no color/rarity/
 * type/basis, since ConstructedTierRow carries neither (METAHUB-SPEC.md:
 * never fabricate a filter the payload can't back) — plus explicit client
 * sort, entirely client-side over the server-rendered rows already passed
 * in as props.
 *
 * `idPrefix` namespaces this instance's URL query params (see
 * lib/mtgUrlState.ts) — /mtg mounts several of these simultaneously (the
 * all-formats board plus one per Standard/Pioneer/Modern "world" MtgMetaLens
 * toggles between), so each needs its own key namespace to stay
 * independently shareable/bookmarkable without colliding.
 */
export function MtgConstructedTierExplorer({
  rows,
  idPrefix,
}: {
  rows: ConstructedTierRow[];
  idPrefix: string;
}) {
  const [state, setState] = useState<ConstructedExplorerState>(DEFAULT_STATE);
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
      tier: state.tier !== DEFAULT_STATE.tier ? state.tier : null,
      sort: state.sort,
      dir: state.sort ? state.dir : null,
    });
  }, [state, hydrated, idPrefix]);

  const filteredRows = useMemo(
    () =>
      rows
        .filter((r) => matchesConstructedSearch(r, state.q))
        .filter((r) => matchesConstructedTier(r, state.tier)),
    [rows, state.q, state.tier]
  );

  const displayRows = useMemo(
    () => (state.sort ? sortConstructedRows(filteredRows, state.sort, state.dir) : filteredRows),
    [filteredRows, state.sort, state.dir]
  );

  function handleSort(key: ConstructedSortKey) {
    setState((prev) => {
      if (prev.sort !== key) {
        return { ...prev, sort: key, dir: constructedSortDefaultDir(key) };
      }
      const def = constructedSortDefaultDir(key);
      if (prev.dir === def) {
        return { ...prev, dir: def === "asc" ? "desc" : "asc" };
      }
      return { ...prev, sort: null };
    });
  }

  const facetGroups: MtgTierFacetGroup[] = [
    {
      key: "tier",
      ariaLabel: "Tier filter",
      active: state.tier,
      onChange: (v) => setState((prev) => ({ ...prev, tier: v as ConstructedTierFilter })),
      options: CONSTRUCTED_TIER_FILTERS.map((t) => ({
        value: t,
        label: t === "all" ? "All tiers" : t === "unrated" ? "Unrated" : `Tier ${t}`,
      })),
    },
  ];

  return (
    <div>
      <MtgTierFilterBar
        query={state.q}
        onQueryChange={(q) => setState((prev) => ({ ...prev, q }))}
        searchPlaceholder="Search archetypes/decks..."
        facetGroups={facetGroups}
      />

      <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary mb-2">
        {filteredRows.length.toLocaleString("en-US")} of {rows.length.toLocaleString("en-US")}{" "}
        archetypes/decks shown{state.sort ? " — client-sorted" : " — server order"}
      </p>

      <MtgConstructedTierTable
        rows={displayRows}
        sortKey={state.sort}
        sortDir={state.dir}
        onSort={handleSort}
      />
    </div>
  );
}
