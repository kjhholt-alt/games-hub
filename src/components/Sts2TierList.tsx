"use client";

import { useMemo, useState } from "react";
import { Layers, Gem } from "lucide-react";
import { TierBadge } from "@/components/TierBadge";
import {
  filterItems,
  groupByTier,
  tierCounts,
  presentCharacters,
  TIER_BLURB,
  TIER_ORDER,
  type ItemKind,
  type RatedItem,
  type Sts2Snapshot,
} from "@/lib/sts2";

/**
 * Interactive Slay the Spire 2 tier list: a Cards/Relics + per-character filter row,
 * a tier-banded grid of item chips (top), then a detailed ranking table with the
 * aggregate score, type, cost and source-consensus (bottom). All filtering is pure
 * client-side over the vendored snapshot — nothing is fetched or mocked.
 */
export function Sts2TierList({ data }: { data: Sts2Snapshot }) {
  const [kind, setKind] = useState<ItemKind>("card");
  const [character, setCharacter] = useState<string | null>(null);

  const characters = useMemo(
    () => presentCharacters(data.items),
    [data.items]
  );

  const filtered = useMemo(
    () =>
      filterItems(data.items, {
        kind,
        character: kind === "card" && character ? character : undefined,
      }),
    [data.items, kind, character]
  );

  const groups = useMemo(() => groupByTier(filtered), [filtered]);
  const counts = useMemo(() => tierCounts(filtered), [filtered]);

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="space-y-3">
        <div className="inline-flex rounded-xl border border-border bg-surface p-1">
          <KindTab
            active={kind === "card"}
            onClick={() => setKind("card")}
            icon={<Layers size={14} />}
            label={`Cards (${data.counts.cards})`}
          />
          <KindTab
            active={kind === "relic"}
            onClick={() => setKind("relic")}
            icon={<Gem size={14} />}
            label={`Relics (${data.counts.relics})`}
          />
        </div>

        {kind === "card" && (
          <div className="flex flex-wrap gap-2">
            <FacetChip
              active={character === null}
              onClick={() => setCharacter(null)}
              label="All characters"
            />
            {characters.map((c) => (
              <FacetChip
                key={c}
                active={character === c}
                onClick={() => setCharacter(c)}
                label={c}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tier-count summary */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {TIER_ORDER.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1.5 bg-surface border border-border rounded-full pl-1 pr-3 py-1"
          >
            <TierBadge letter={t} />
            <span className="tabular-nums text-text-secondary">
              {counts[t]}
            </span>
          </span>
        ))}
        <span className="text-text-secondary ml-1">
          {filtered.length} {kind === "card" ? "cards" : "relics"} shown
        </span>
      </div>

      {/* Tier bands */}
      <div className="space-y-3">
        {groups.map((group) => (
          <div
            key={group.letter}
            className="flex flex-col sm:flex-row gap-3 bg-surface border border-border rounded-2xl p-4"
          >
            <div className="flex sm:flex-col items-center sm:justify-center gap-3 sm:w-40 shrink-0">
              <TierBadge letter={group.letter} size="lg" />
              <p className="text-xs text-text-secondary sm:text-center leading-snug">
                {TIER_BLURB[group.letter]}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 flex-1">
              {group.items.map((it) => (
                <ItemChip key={it.id} item={it} />
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <p className="text-sm text-text-secondary py-8 text-center">
            No items match this filter.
          </p>
        )}
      </div>

      {/* Full ranking table */}
      <div>
        <h2 className="text-xl font-bold mb-4">
          Full ranking by aggregate score
        </h2>
        <div className="overflow-x-auto border border-border rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-text-secondary text-left">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">
                  {kind === "card" ? "Card" : "Relic"}
                </th>
                <th className="px-4 py-3 font-medium">Tier</th>
                {kind === "card" && (
                  <th className="px-4 py-3 font-medium">Character</th>
                )}
                {kind === "card" && (
                  <th className="px-4 py-3 font-medium">Type</th>
                )}
                {kind === "card" && (
                  <th className="px-4 py-3 font-medium text-right">Cost</th>
                )}
                <th className="px-4 py-3 font-medium text-right">Score</th>
                <th className="px-4 py-3 font-medium text-right">Consensus</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it, i) => (
                <tr
                  key={it.id}
                  className="border-b border-border last:border-0 hover:bg-surface/60 transition-colors"
                >
                  <td className="px-4 py-2.5 text-text-secondary tabular-nums">
                    {i + 1}
                  </td>
                  <td className="px-4 py-2.5 font-medium">{it.name}</td>
                  <td className="px-4 py-2.5">
                    <TierBadge letter={it.tier} />
                  </td>
                  {kind === "card" && (
                    <td className="px-4 py-2.5 text-text-secondary">
                      {it.character}
                    </td>
                  )}
                  {kind === "card" && (
                    <td className="px-4 py-2.5 text-text-secondary">
                      {it.type ?? "—"}
                    </td>
                  )}
                  {kind === "card" && (
                    <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
                      {it.cost ?? "—"}
                    </td>
                  )}
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold">
                    {Math.round(it.score)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <ConsensusDots item={it} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-secondary mt-3">
          Score is the 0–100 weighted aggregate across {data.sources.length}{" "}
          public tier lists. Consensus reflects how many lists rated the item and
          how tightly they agreed (filled = firm, hollow = thin or split).
        </p>
      </div>
    </div>
  );
}

function KindTab({
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
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-cyan text-background"
          : "text-text-secondary hover:text-foreground"
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
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-cyan/50 bg-cyan-dim text-cyan"
          : "border-border bg-surface text-text-secondary hover:border-cyan/30 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function ItemChip({ item }: { item: RatedItem }) {
  return (
    <div className="flex items-center gap-2 bg-surface-raised border border-border rounded-xl px-3 py-1.5">
      <div className="leading-tight">
        <p className="text-sm font-medium">{item.name}</p>
        <p className="text-[11px] text-text-secondary tabular-nums">
          {Math.round(item.score)}
          {item.kind === "card" && item.type ? ` · ${item.type}` : ""}
        </p>
      </div>
    </div>
  );
}

/**
 * Three dots encoding how trustworthy a rating is: filled count grows with the
 * number of sources, and a high spread (the lists disagreed) hollows the last dot.
 */
function ConsensusDots({ item }: { item: RatedItem }) {
  const filled = Math.max(
    1,
    Math.min(3, item.nSources - (item.spread >= 2 ? 1 : 0))
  );
  return (
    <span
      className="inline-flex gap-0.5"
      title={`${item.nSources} source${item.nSources === 1 ? "" : "s"}, spread ${item.spread} (${item.confidence} confidence)`}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            i < filled ? "bg-cyan" : "bg-border"
          }`}
        />
      ))}
    </span>
  );
}
