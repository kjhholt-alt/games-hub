"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ListOrdered, Rows3, Search } from "lucide-react";
import { MtgDraftTable } from "@/components/MtgDraftTable";
import { MtgDraftCheatSheet } from "@/components/MtgDraftCheatSheet";
import { MtgDraftSetHeader } from "@/components/MtgDraftSetHeader";
import { MtgDraftMethodologyAccordion } from "@/components/MtgDraftMethodologyAccordion";
import {
  COLOR_PAIRS,
  MONO_COLORS,
  RARITY_FILTERS,
  draftScoreRanks,
  getPairRows,
  matchesColorFilter,
  matchesRarityFilter,
  matchesSearch,
  sortDraftRows,
  type DraftSetBlock,
  type DraftSortKey,
  type RarityFilter,
} from "@/lib/mtgDraftView";

type ViewMode = "ranker" | "cheatsheet";

/**
 * The interactive half of /mtg/draft — set switcher, view toggle (ranker
 * table vs cheat sheet), search/rarity/color filters, the color-pair picker,
 * and column sorting. All computed client-side over the payload the server
 * component already read; nothing here fetches anything.
 */
export function MtgDraftRanker({ sets }: { sets: DraftSetBlock[] }) {
  const defaultIndex = Math.max(
    0,
    sets.findIndex((s) => s.status === "published")
  );
  const [activeIndex, setActiveIndex] = useState(defaultIndex === -1 ? 0 : defaultIndex);
  const [view, setView] = useState<ViewMode>("ranker");
  const [pairKey, setPairKey] = useState<string>("overall");
  const [search, setSearch] = useState("");
  const [rarity, setRarity] = useState<RarityFilter>("all");
  const [colors, setColors] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<DraftSortKey>("draft_score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const activeSet = sets[activeIndex];

  const baseRows = useMemo(() => {
    if (pairKey === "overall") return activeSet.overall_rows;
    return getPairRows(activeSet, pairKey);
  }, [activeSet, pairKey]);

  const pairPending =
    pairKey !== "overall" && activeSet.overall_rows.length > 0 && baseRows.length === 0;

  const ranks = useMemo(() => draftScoreRanks(baseRows), [baseRows]);

  const filteredRows = useMemo(
    () =>
      baseRows
        .filter((r) => matchesSearch(r, search))
        .filter((r) => matchesRarityFilter(r, rarity))
        .filter((r) => matchesColorFilter(r, colors)),
    [baseRows, search, rarity, colors]
  );

  const sortedRows = useMemo(
    () => sortDraftRows(filteredRows, sortKey, sortDir),
    [filteredRows, sortKey, sortDir]
  );

  function toggleColor(c: string) {
    setColors((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  function handleSort(key: DraftSortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "card" || key === "color" || key === "rarity" ? "asc" : "desc");
    }
  }

  function selectSet(i: number) {
    setActiveIndex(i);
    setPairKey("overall");
  }

  return (
    <div>
      {/* Set switcher */}
      <div className="flex flex-wrap gap-2 mb-6 print:hidden">
        {sets.map((s, i) => {
          const active = i === activeIndex;
          const unavailable = s.status !== "published";
          return (
            <button
              key={s.set_code}
              type="button"
              onClick={() => selectSet(i)}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                active
                  ? "border-brass/50 bg-brass-dim text-brass"
                  : unavailable
                    ? "border-border text-text-secondary opacity-60 hover:opacity-90"
                    : "border-border text-text-secondary hover:border-brass/30 hover:text-foreground"
              }`}
            >
              <span className="font-medium">{s.set_name}</span>
              <span className="font-mono text-xs opacity-80">{s.set_code}</span>
              {unavailable && (
                <span className="text-[10px] font-mono uppercase tracking-wide rounded px-1 py-0.5 border border-border">
                  no data
                </span>
              )}
            </button>
          );
        })}
      </div>

      <MtgDraftSetHeader
        setName={activeSet.set_name}
        setCode={activeSet.set_code}
        status={activeSet.status}
        computedAt={activeSet.computed_at}
        totalGames={activeSet.total_games}
        attribution={activeSet.attribution}
      />

      {activeSet.status !== "published" ? (
        <>
          <UnavailableSetPanel methodology={activeSet.methodology} />
          <div className="mt-6">
            <MtgDraftMethodologyAccordion methodology={activeSet.methodology} />
          </div>
        </>
      ) : (
        <>
          {activeSet.early_data && <EarlyDataBanner />}

          {/* View toggle */}
          <div className="inline-flex rounded-md border border-border bg-surface p-0.5 mb-4 print:hidden">
            <ViewTab
              active={view === "ranker"}
              onClick={() => setView("ranker")}
              icon={<ListOrdered size={14} />}
              label="Ranker"
            />
            <ViewTab
              active={view === "cheatsheet"}
              onClick={() => setView("cheatsheet")}
              icon={<Rows3 size={14} />}
              label="Cheat sheet"
            />
          </div>

          {view === "ranker" ? (
            <>
              {/* Filters */}
              <div className="flex flex-col gap-3 mb-4 print:hidden">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search
                      size={13}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary"
                    />
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search cards..."
                      className="bg-surface border border-border rounded-md pl-7 pr-3 py-1.5 text-sm w-48 focus:outline-none focus:border-brass/50"
                    />
                  </div>

                  <select
                    value={pairKey}
                    onChange={(e) => setPairKey(e.target.value)}
                    className="bg-surface border border-border rounded-md px-2.5 py-1.5 text-sm text-text-secondary focus:outline-none focus:border-brass/50"
                  >
                    <option value="overall">Overall (all colors)</option>
                    {COLOR_PAIRS.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.key} — {p.guild}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-2">
                  {RARITY_FILTERS.map((r) => (
                    <FacetChip
                      key={r}
                      active={rarity === r}
                      onClick={() => setRarity(r)}
                      label={r === "all" ? "All rarities" : r}
                    />
                  ))}
                  <span className="w-px bg-border mx-1" aria-hidden />
                  {MONO_COLORS.map((c) => (
                    <FacetChip key={c} active={colors.includes(c)} onClick={() => toggleColor(c)} label={c} />
                  ))}
                  <FacetChip
                    active={colors.includes("C")}
                    onClick={() => toggleColor("C")}
                    label="Colorless"
                  />
                </div>
              </div>

              {pairPending ? (
                <PairPendingPanel pairKey={pairKey} onReset={() => setPairKey("overall")} />
              ) : (
                <>
                  <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary mb-2">
                    {sortedRows.length.toLocaleString("en-US")} of{" "}
                    {baseRows.length.toLocaleString("en-US")} cards shown
                    {pairKey !== "overall" ? ` — ${pairKey} pair` : ""}
                  </p>
                  <MtgDraftTable
                    rows={sortedRows}
                    ranks={ranks}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                </>
              )}
            </>
          ) : (
            <MtgDraftCheatSheet rows={activeSet.overall_rows} />
          )}

          <div className="mt-8">
            <MtgDraftMethodologyAccordion methodology={activeSet.methodology} />
          </div>
        </>
      )}
    </div>
  );
}

function ViewTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-brass text-background" : "text-text-secondary hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function FacetChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-brass/50 bg-brass-dim text-brass"
          : "border-border bg-surface text-text-secondary hover:border-brass/30 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

/** Honest empty state for a set 17lands hasn't published enough volume for
 * this run — never an empty table with no explanation. */
function UnavailableSetPanel({ methodology }: { methodology: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-6 text-center">
      <p className="font-mono text-[11px] uppercase tracking-wider text-text-secondary mb-2">
        No graded draft data for this set yet
      </p>
      <p className="text-xs text-text-secondary leading-relaxed max-w-2xl mx-auto">
        {methodology.split(". ").slice(-1)[0]}
      </p>
    </div>
  );
}

/** Honest empty state for a color pair with no distinct per-pair signal from
 * 17lands yet — never a duplicated copy of the overall data passed off as
 * pair-specific. */
function PairPendingPanel({ pairKey, onReset }: { pairKey: string; onReset: () => void }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-6 text-center">
      <p className="font-mono text-[11px] uppercase tracking-wider text-text-secondary mb-2">
        Per-pair data pending upstream support
      </p>
      <p className="text-xs text-text-secondary leading-relaxed max-w-2xl mx-auto mb-4">
        17lands&rsquo; public endpoint hasn&rsquo;t returned a {pairKey} response distinct from
        the set&rsquo;s overall ratings yet, so we don&rsquo;t publish a duplicate as fake
        per-pair signal. This will populate automatically once upstream supports it.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="text-xs text-brass hover:text-brass-bright transition-colors print:hidden"
      >
        Back to overall ratings
      </button>
    </div>
  );
}

function EarlyDataBanner() {
  return (
    <div className="flex items-start gap-3 rounded-md border border-amber/40 bg-amber-dim px-4 py-3 mb-6">
      <AlertTriangle size={15} className="text-amber mt-0.5 shrink-0" />
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-amber mb-1">
          Early data
        </p>
        <p className="text-text-secondary text-xs leading-relaxed">
          Grades will keep upgrading as sample sizes grow through the set&rsquo;s draft window —
          treat close grades as more volatile than usual right now.
        </p>
      </div>
    </div>
  );
}
