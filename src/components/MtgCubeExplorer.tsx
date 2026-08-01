"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { MtgCubeTierTable } from "@/components/MtgCubeTierTable";
import { ManaDots } from "@/components/MtgManaPips";
import {
  CUBE_BASIS_FILTERS,
  CUBE_BASIS_LABELS,
  CUBE_CATEGORY_FILTERS,
  CUBE_SORT_KEYS,
  CUBE_TIER_FILTERS,
  CUBE_TYPE_FILTERS,
  RARITY_FILTERS,
  computeCubeGuildStandings,
  cubeServerRanks,
  cubeSortDefaultDir,
  matchesCubeBasis,
  matchesCubeCategory,
  matchesCubeRarity,
  matchesCubeSearch,
  matchesCubeTier,
  matchesCubeType,
  sortCubeRows,
  type CubeBasisFilter,
  type CubeCardRow,
  type CubeCategoryFilter,
  type CubeSortKey,
  type CubeTierFilter,
  type CubeTypeFilter,
  type RarityFilter,
} from "@/lib/mtgDraftView";

const CATEGORY_LETTER: Partial<Record<CubeCategoryFilter, string>> = {
  white: "W",
  blue: "U",
  black: "B",
  red: "R",
  green: "G",
};

const CATEGORY_LABEL: Record<CubeCategoryFilter, string> = {
  all: "All colors",
  white: "White",
  blue: "Blue",
  black: "Black",
  red: "Red",
  green: "Green",
  multicolor: "Multicolor",
  colorless: "Colorless",
  land: "Land",
};

const TYPE_LABEL: Record<CubeTypeFilter, string> = {
  all: "All types",
  creature: "Creature",
  instant: "Instant",
  sorcery: "Sorcery",
  artifact: "Artifact",
  enchantment: "Enchantment",
  planeswalker: "Planeswalker",
  land: "Land",
};

interface CubeUrlState {
  q: string;
  color: CubeCategoryFilter;
  rarity: RarityFilter;
  type: CubeTypeFilter;
  tier: CubeTierFilter;
  basis: CubeBasisFilter;
  sort: CubeSortKey | null;
  dir: "asc" | "desc";
}

const DEFAULT_STATE: CubeUrlState = {
  q: "",
  color: "all",
  rarity: "all",
  type: "all",
  tier: "all",
  basis: "all",
  sort: null,
  dir: "desc",
};

/** Reads the filter-bar/sort state out of the current URL's query string —
 * only on mount (see the write side's comment for why this deliberately
 * skips useSearchParams). Unknown/invalid values fall back to the default
 * rather than throwing, so a hand-edited or stale URL never breaks the page. */
function readCubeStateFromUrl(): CubeUrlState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  const p = new URLSearchParams(window.location.search);
  const q = p.get("q") ?? DEFAULT_STATE.q;
  const color = asOneOf(p.get("color"), CUBE_CATEGORY_FILTERS, DEFAULT_STATE.color);
  const rarity = asOneOf(p.get("rarity"), RARITY_FILTERS, DEFAULT_STATE.rarity);
  const type = asOneOf(p.get("type"), CUBE_TYPE_FILTERS, DEFAULT_STATE.type);
  const tier = asOneOf(p.get("tier"), CUBE_TIER_FILTERS, DEFAULT_STATE.tier);
  const basis = asOneOf(p.get("basis"), CUBE_BASIS_FILTERS, DEFAULT_STATE.basis);
  const sortParam = p.get("sort");
  const sort = sortParam && (CUBE_SORT_KEYS as readonly string[]).includes(sortParam)
    ? (sortParam as CubeSortKey)
    : null;
  const dirParam = p.get("dir");
  const dir = dirParam === "asc" || dirParam === "desc" ? dirParam : DEFAULT_STATE.dir;
  return { q, color, rarity, type, tier, basis, sort, dir };
}

function asOneOf<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** Writes the current filter/sort state back into the URL's query string via
 * history.replaceState — no navigation, no new history entry, no scroll
 * jump. Deliberately NOT useSearchParams/useRouter: this page is statically
 * rendered (ISR, revalidate=3600) and the payload is already fully present
 * as props, so reacting to the URL through Next's router would force this
 * route dynamic for zero benefit. Same pattern MtgMetaLens uses for its hash
 * state, applied to real query params since sort/filter state here is meant
 * to be a shareable/bookmarkable link, not just a same-session toggle.
 * Default values are omitted entirely so an unfiltered visit keeps a bare
 * `/mtg/cube` URL. */
function writeCubeStateToUrl(state: CubeUrlState) {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams();
  if (state.q.trim()) p.set("q", state.q.trim());
  if (state.color !== DEFAULT_STATE.color) p.set("color", state.color);
  if (state.rarity !== DEFAULT_STATE.rarity) p.set("rarity", state.rarity);
  if (state.type !== DEFAULT_STATE.type) p.set("type", state.type);
  if (state.tier !== DEFAULT_STATE.tier) p.set("tier", state.tier);
  if (state.basis !== DEFAULT_STATE.basis) p.set("basis", state.basis);
  if (state.sort) {
    p.set("sort", state.sort);
    p.set("dir", state.dir);
  }
  const qs = p.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
  window.history.replaceState(null, "", url);
}

/**
 * The interactive half of /mtg/cube (gl-0571, MTG parity Day 1): a dense
 * search/color/rarity/type/tier/basis filter bar with the active selection
 * synced to the URL's query string, plus the 10-guild ranked strip computed
 * live from this week's pool. Filters/sort are entirely client-side over the
 * server-rendered rows already passed in as props — nothing here fetches.
 *
 * Sorting is explicit-opt-in only: with no `sort` param the table renders
 * the engine's own pre-sorted order untouched (see MtgCubeTierTable's header
 * comment); clicking a column header applies a client sort, a second click
 * flips direction, and a third click clears back to server order.
 */
export function MtgCubeExplorer({ rows }: { rows: CubeCardRow[] }) {
  const [state, setState] = useState<CubeUrlState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readCubeStateFromUrl());
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeCubeStateToUrl(state);
  }, [state, hydrated]);

  const serverRanks = useMemo(() => cubeServerRanks(rows), [rows]);
  const guildStandings = useMemo(() => computeCubeGuildStandings(rows), [rows]);

  const filteredRows = useMemo(
    () =>
      rows
        .filter((r) => matchesCubeSearch(r, state.q))
        .filter((r) => matchesCubeCategory(r, state.color))
        .filter((r) => matchesCubeRarity(r, state.rarity))
        .filter((r) => matchesCubeType(r, state.type))
        .filter((r) => matchesCubeTier(r, state.tier))
        .filter((r) => matchesCubeBasis(r, state.basis)),
    [rows, state.q, state.color, state.rarity, state.type, state.tier, state.basis]
  );

  const displayRows = useMemo(
    () => (state.sort ? sortCubeRows(filteredRows, state.sort, state.dir) : filteredRows),
    [filteredRows, state.sort, state.dir]
  );

  function handleSort(key: CubeSortKey) {
    setState((prev) => {
      if (prev.sort !== key) {
        return { ...prev, sort: key, dir: cubeSortDefaultDir(key) };
      }
      const def = cubeSortDefaultDir(key);
      if (prev.dir === def) {
        return { ...prev, dir: def === "asc" ? "desc" : "asc" };
      }
      return { ...prev, sort: null };
    });
  }

  return (
    <div>
      <GuildStrip standings={guildStandings} />

      {/* Filter bar — fixed set of chips (same count/size regardless of
          active state) so toggling a facet never reflows the page. */}
      <div className="flex flex-col gap-3 mb-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="search"
              value={state.q}
              onChange={(e) => setState((prev) => ({ ...prev, q: e.target.value }))}
              placeholder="Search cards..."
              className="bg-surface border border-border rounded-md pl-7 pr-3 py-1.5 text-sm w-48 focus:outline-none focus:border-brass/50"
            />
          </div>

          <select
            value={state.tier}
            onChange={(e) => setState((prev) => ({ ...prev, tier: e.target.value as CubeTierFilter }))}
            className="bg-surface border border-border rounded-md px-2.5 py-1.5 text-sm text-text-secondary focus:outline-none focus:border-brass/50"
            aria-label="Tier filter"
          >
            {CUBE_TIER_FILTERS.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All tiers" : `Tier ${t}`}
              </option>
            ))}
          </select>

          <select
            value={state.basis}
            onChange={(e) => setState((prev) => ({ ...prev, basis: e.target.value as CubeBasisFilter }))}
            className="bg-surface border border-border rounded-md px-2.5 py-1.5 text-sm text-text-secondary focus:outline-none focus:border-brass/50"
            aria-label="Basis filter"
          >
            <option value="all">All bases</option>
            {CUBE_BASIS_FILTERS.filter((b) => b !== "all").map((b) => (
              <option key={b} value={b}>
                {CUBE_BASIS_LABELS[b]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {CUBE_CATEGORY_FILTERS.map((c) => (
            <FacetChip
              key={c}
              active={state.color === c}
              onClick={() => setState((prev) => ({ ...prev, color: c }))}
              label={CATEGORY_LABEL[c]}
              dot={CATEGORY_LETTER[c]}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {RARITY_FILTERS.map((r) => (
            <FacetChip
              key={r}
              active={state.rarity === r}
              onClick={() => setState((prev) => ({ ...prev, rarity: r }))}
              label={r === "all" ? "All rarities" : r}
            />
          ))}
          <span className="w-px bg-border mx-1" aria-hidden />
          {CUBE_TYPE_FILTERS.map((t) => (
            <FacetChip
              key={t}
              active={state.type === t}
              onClick={() => setState((prev) => ({ ...prev, type: t }))}
              label={TYPE_LABEL[t]}
            />
          ))}
        </div>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary mb-2">
        {displayRows.length.toLocaleString("en-US")} of {rows.length.toLocaleString("en-US")} cards
        shown
        {state.sort ? " — client-sorted" : " — server order"}
      </p>

      <MtgCubeTierTable
        rows={displayRows}
        ranks={serverRanks}
        sortKey={state.sort}
        sortDir={state.dir}
        onSort={handleSort}
      />
    </div>
  );
}

function GuildStrip({ standings }: { standings: ReturnType<typeof computeCubeGuildStandings> }) {
  return (
    <div className="mb-5 print:hidden">
      <p className="font-mono text-[10px] uppercase tracking-widest text-text-secondary mb-2">
        Guild strip — ranked by this week&rsquo;s average card power, coverage disclosed
      </p>
      <div className="flex flex-nowrap items-stretch gap-2 overflow-x-auto pb-2">
        {standings.map((s) => (
          <div
            key={s.key}
            className="shrink-0 flex flex-col gap-1 rounded-md border border-border bg-surface px-2.5 py-2 min-w-[132px]"
            title={
              s.count === 0
                ? `No pool cards fit ${s.guild}'s color identity this week`
                : `${s.count} cards fit ${s.guild} · ${s.coveragePct}% backed by cube-native signal (live Planar Cube data or a Powered Cube sample), rest heuristic/cross-set`
            }
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="font-mono text-[10px] text-text-secondary tabular-nums">
                {s.rank ? `#${s.rank}` : "—"}
              </span>
              <ManaDots letters={s.key} />
            </div>
            <span className="text-xs font-medium truncate">{s.guild}</span>
            {s.avgPower !== null ? (
              <span className="font-mono text-[10px] text-text-secondary tabular-nums">
                {s.avgPower.toFixed(1)}/5 avg · {s.coveragePct}% real · {s.count} cards
              </span>
            ) : (
              <span className="font-mono text-[10px] text-text-secondary">no cards yet</span>
            )}
          </div>
        ))}
      </div>
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
