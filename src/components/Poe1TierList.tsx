"use client";

import { useState } from "react";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  TIER_BLURB,
  groupByTier,
  resolveSources,
  type MetaCategory,
  type Poe1Meta,
  type Poe1MetaEntry,
} from "@/lib/poe1";
import { TierBadge } from "@/components/TierBadge";

/**
 * PoE1 event meta tier list. A category switcher (Builds / Ascendancies /
 * Skills) drives a tier-banded grid of cards (top) plus a detailed ranking
 * table (bottom) — the same two-part layout as the Deadlock HeroTierList, but
 * fed by our curated, sourced startforge dataset instead of a live API.
 */
export function Poe1TierList({ meta }: { meta: Poe1Meta }) {
  const [category, setCategory] = useState<MetaCategory>("build");
  const groups = groupByTier(category, meta);
  const flat = groups.flatMap((g) => g.entries);
  const activeBlurb = CATEGORIES.find((c) => c.id === category)?.blurb ?? "";

  return (
    <div className="space-y-8">
      {/* Category switcher */}
      <div>
        <div className="inline-flex flex-wrap gap-1.5 bg-surface border border-border rounded-xl p-1">
          {CATEGORIES.map((c) => {
            const active = c.id === category;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                aria-pressed={active}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-cyan text-background"
                    : "text-text-secondary hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        <p className="text-sm text-text-secondary mt-3">{activeBlurb}</p>
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
              {group.entries.map((entry) => (
                <MetaChip key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Full ranking table */}
      <div>
        <h2 className="text-xl font-bold mb-4">
          Full {CATEGORY_LABEL[category].toLowerCase()} ranking
        </h2>
        <div className="overflow-x-auto border border-border rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-text-secondary text-left">
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">
                  {CATEGORY_LABEL[category]}
                </th>
                <th className="px-4 py-3 font-medium">Ascendancy</th>
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="px-4 py-3 font-medium">Style</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">
                  Why
                </th>
              </tr>
            </thead>
            <tbody>
              {flat.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border last:border-0 align-top hover:bg-surface/60 transition-colors"
                >
                  <td className="px-4 py-3">
                    <TierBadge letter={entry.tier} />
                  </td>
                  <td className="px-4 py-3 font-medium">{entry.name}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {entry.ascendancy}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {entry.baseClass}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-surface-raised border border-border px-2.5 py-0.5 text-xs text-text-secondary">
                      {entry.playstyle}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary hidden md:table-cell max-w-md">
                    {entry.oneLiner}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-secondary mt-3">
          Tiers reflect current community consensus for a brand-new 3-week event,
          cross-checked across reputable sources — not a live win-rate ladder.
          Each pick links its sources below.
        </p>
      </div>
    </div>
  );
}

function MetaChip({ entry }: { entry: Poe1MetaEntry }) {
  const sources = resolveSources(entry);
  return (
    <div className="bg-surface-raised border border-border rounded-xl px-3 py-2 max-w-[15rem]">
      <p className="text-sm font-medium leading-tight">{entry.name}</p>
      <p className="text-[11px] text-text-secondary mt-0.5">
        {entry.ascendancy} &middot; {entry.playstyle}
      </p>
      {sources.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {sources.slice(0, 3).map((s) => (
            <a
              key={s.id}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              title={s.title}
              className={`text-[10px] leading-none rounded px-1.5 py-0.5 border transition-colors hover:border-cyan/50 ${
                s.kind === "official"
                  ? "text-cyan border-cyan/30 bg-cyan-dim"
                  : "text-text-secondary border-border"
              }`}
            >
              {sourceLabel(s.id)}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/** Short, readable label for a source chip (domain-ish). */
function sourceLabel(id: string): string {
  const map: Record<string, string> = {
    "ggg-announce": "GGG",
    "poewiki-phrecia": "Wiki",
    "poevault-phrecia": "PoE Vault",
    "odealo-phrecia": "Odealo",
    "aoeah-tier": "AoEAH",
    "poecurrency-starters": "PoeCurrency",
    "maxroll-phrecia-starters": "Maxroll",
    "ezg-tota": "EZG",
    "pob-community": "PoB",
  };
  return map[id] ?? id;
}
