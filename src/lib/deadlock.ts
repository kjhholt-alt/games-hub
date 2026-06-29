// ─── Deadlock hero tier-list engine ──────────────────────────────────────────
//
// Generalizes the pc-bottleneck-analyzer tier-list pattern (src/lib/tier-list.ts)
// from hardware-benchmark data to live GAME-META data. We pull real hero win/pick
// stats from the open, free, MIT-licensed deadlock-api.com, join them to hero
// names + icons, and rank every hero into S/A/B/C/D tiers by win rate.
//
// The transform functions here are PURE (no fs, no network) so they can be unit
// tested and run at build time. `fetchHeroStats` is the only impure part.

import { HERO_BY_ID, type HeroMeta } from "../data/heroes";

export type TierLetter = "S" | "A" | "B" | "C" | "D";

/** Raw row shape returned by GET /v1/analytics/hero-stats. */
export interface RawHeroStat {
  hero_id: number;
  wins: number;
  losses: number;
  matches: number;
  total_kills: number;
  total_deaths: number;
  total_assists: number;
  total_player_damage?: number;
}

/** A hero after joining stats + metadata and computing derived fields. */
export interface RankedHero {
  id: number;
  name: string;
  icon: string | null;
  matches: number;
  /** Win percentage, 1 decimal (e.g. 56.6). */
  winRate: number;
  /** Pick rate as % of all ranked matches, 1 decimal. */
  pickRate: number;
  /** (kills + assists) / deaths, 2 decimals. */
  kda: number;
  tier: TierLetter;
  /** 1-based position, highest win rate first. */
  rank: number;
}

export interface DeadlockTierList {
  /** ISO timestamp (UTC) the data was generated. */
  generatedAt: string;
  /** Total ranked matches across all included heroes (the sample size). */
  totalMatches: number;
  /** Minimum match count a hero needed to be included. */
  minMatches: number;
  heroes: RankedHero[];
}

export const HERO_STATS_URL =
  "https://api.deadlock-api.com/v1/analytics/hero-stats";

/** Heroes below this match count are dropped as too-small a sample. */
export const MIN_MATCHES = 5000;

// Win-rate tier cuts (proven 2026-06-28 against the live meta).
const TIER_CUTS: { letter: TierLetter; min: number }[] = [
  { letter: "S", min: 53 },
  { letter: "A", min: 51 },
  { letter: "B", min: 49.5 },
  { letter: "C", min: 48 },
];

/** Map a win-rate percentage onto an S/A/B/C/D tier. */
export function tierFor(winRate: number): TierLetter {
  for (const cut of TIER_CUTS) {
    if (winRate >= cut.min) return cut.letter;
  }
  return "D";
}

export const TIER_ORDER: TierLetter[] = ["S", "A", "B", "C", "D"];

export const TIER_BLURB: Record<TierLetter, string> = {
  S: "Strongest picks this patch — dominant win rates",
  A: "Excellent — reliably above the curve",
  B: "Balanced — solid, roughly even win rates",
  C: "Situational — slightly underperforming",
  D: "Struggling — lowest win rates this patch",
};

/**
 * Join raw hero stats to hero metadata, filter low-sample heroes, compute
 * win/pick rate + KDA, assign tiers, and sort by win rate descending.
 * Pure — safe to call at build time or in tests.
 */
export function buildTierList(
  rawStats: RawHeroStat[],
  meta: Record<number, HeroMeta> = HERO_BY_ID,
  opts: { minMatches?: number; generatedAt?: string } = {}
): DeadlockTierList {
  const minMatches = opts.minMatches ?? MIN_MATCHES;
  const eligible = rawStats.filter((s) => s.matches >= minMatches);
  const totalMatches = eligible.reduce((sum, s) => sum + s.matches, 0) || 1;

  const heroes: RankedHero[] = eligible
    .map((s) => {
      const info = meta[s.hero_id];
      const winRate = round1((100 * s.wins) / s.matches);
      return {
        id: s.hero_id,
        name: info?.name ?? `Hero ${s.hero_id}`,
        icon: info?.icon ?? null,
        matches: s.matches,
        winRate,
        pickRate: round1((100 * s.matches) / totalMatches),
        kda: round2(
          (s.total_kills + s.total_assists) / Math.max(1, s.total_deaths)
        ),
        tier: tierFor(winRate),
        rank: 0,
      };
    })
    .sort((a, b) => b.winRate - a.winRate || b.matches - a.matches)
    .map((h, i) => ({ ...h, rank: i + 1 }));

  return {
    generatedAt: opts.generatedAt ?? new Date().toISOString(),
    totalMatches,
    minMatches,
    heroes,
  };
}

/** Group ranked heroes by their tier, in S→D order. */
export function groupByTier(
  heroes: RankedHero[]
): { letter: TierLetter; heroes: RankedHero[] }[] {
  return TIER_ORDER.map((letter) => ({
    letter,
    heroes: heroes.filter((h) => h.tier === letter),
  })).filter((g) => g.heroes.length > 0);
}

/**
 * Fetch live hero stats from deadlock-api.com. Impure (network). Throws on a
 * non-200 response so the build fails loudly rather than shipping stale/empty
 * data silently.
 */
export async function fetchHeroStats(): Promise<RawHeroStat[]> {
  const res = await fetch(HERO_STATS_URL, {
    headers: {
      "User-Agent": "games-hub/0.1 (+https://play.buildkit.store)",
      Accept: "application/json",
    },
    // Revalidate at most once an hour when used inside Next data fetching.
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(
      `deadlock-api hero-stats returned ${res.status} ${res.statusText}`
    );
  }
  const data = (await res.json()) as RawHeroStat[];
  if (!Array.isArray(data)) {
    throw new Error("deadlock-api hero-stats: expected an array");
  }
  return data;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
