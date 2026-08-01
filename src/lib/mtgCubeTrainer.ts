// ─── P1P1 Pick Trainer — pure pack-dealing logic ─────────────────────────────
//
// Client-safe helpers for /mtg/cube/trainer. Zero backend, zero storage: the
// trainer deals random packs client-side from the SAME committed
// mtg-draft.json cube payload the /mtg/cube tier list already reads (see
// lib/mtgDraft.ts's fs reader + lib/mtgDraftView.ts's CubeCardRow) and never
// touches the payload file itself. Split out from mtgDraftView.ts because
// that file mirrors the pipeline's payload shape verbatim; this file is
// trainer-only feature logic layered on top of it.

import type { CubeCardRow } from "@/lib/mtgDraftView";

/** A standard booster-sized practice pack — not a claim about the real
 * Planar Cube Draft's actual Arena pack size (undocumented), just a
 * familiar, dense-enough count for the trainer flow. */
export const PACK_SIZE = 15;

/**
 * Approximate per-pick rarity weighting for a trainer pack. This is NOT a
 * claim about the cube's real print-sheet frequencies — the Planar Cube pool
 * itself skews rare/mythic-heavy (see cube.prior_summary: 253 rare + 88
 * mythic vs 74 common in the live payload). It only shapes how likely a
 * common/uncommon/rare/mythic card is to land in a given practice pack, so
 * packs still feel booster-like even though the underlying pool doesn't.
 */
const RARITY_WEIGHT: Record<string, number> = {
  common: 66,
  uncommon: 22,
  rare: 8,
  mythic: 1,
};

function rarityWeight(row: CubeCardRow): number {
  // Unknown/null rarity (shouldn't happen in a real payload) gets a
  // rare-ish scarcity weight — never zero, so a data gap never silently
  // vanishes a card from every possible pack.
  return RARITY_WEIGHT[row.rarity ?? ""] ?? 4;
}

/**
 * Cards eligible for a trainer pack. Every cube row already carries a real
 * S–F grade — the cube module never emits "unrated" (see CubeCardRow's
 * `grade` type, `Exclude<DraftGrade, "unrated">`) — but the trainer's
 * tier+basis reveal is worthless without a card image, and honest basis
 * language means Scryfall image links only, never a placeholder. The
 * handful of rows per payload the pipeline couldn't match to a Scryfall
 * image are excluded here (the no-bare-unrated rule's practical form for a
 * module that never actually ships "unrated") rather than shown broken.
 */
export function eligibleTrainerRows(rows: CubeCardRow[]): CubeCardRow[] {
  return rows.filter((r) => Boolean(r.image_normal));
}

/**
 * Efraimidis–Spirakis weighted sampling without replacement: each item gets
 * a key = u^(1/weight) for a fresh uniform random u, then the top `size`
 * keys win. Deterministic given `rng`; tolerant of `size >= items.length`
 * (returns every item, order shuffled by weight).
 */
export function weightedSampleWithoutReplacement<T>(
  items: T[],
  weight: (item: T) => number,
  size: number,
  rng: () => number = Math.random
): T[] {
  const keyed = items.map((item) => {
    const w = Math.max(weight(item), 1e-6);
    const u = Math.min(Math.max(rng(), 1e-9), 1 - 1e-9);
    return { item, key: Math.pow(u, 1 / w) };
  });
  keyed.sort((a, b) => b.key - a.key);
  return keyed.slice(0, size).map((k) => k.item);
}

export interface TrainerCard {
  row: CubeCardRow;
  /** This card's index in the ENGINE's own pre-sorted eligible-row order
   * (best score first) — the trainer never invents its own ranking, it
   * reuses the pipeline's real draft_score/heuristic_score ordering (see
   * MtgCubeTierTable's "rows arrive pre-sorted" note). Lower = stronger. */
  rank: number;
}

/** Deals one pack: `size` unique cards weighted by rarity, each tagged with
 * its rank in the engine's own pre-sorted order. */
export function dealPack(
  eligibleRows: CubeCardRow[],
  size: number = PACK_SIZE,
  rng: () => number = Math.random
): TrainerCard[] {
  const rankByCard = new Map(eligibleRows.map((r, i) => [r.card, i]));
  const picked = weightedSampleWithoutReplacement(eligibleRows, rarityWeight, size, rng);
  return picked.map((row) => ({
    row,
    rank: rankByCard.get(row.card) ?? Number.MAX_SAFE_INTEGER,
  }));
}

/** The strongest card in a dealt pack by the engine's own pre-sort order —
 * this IS the "correct" P1P1 per our tier list, never a client-invented
 * score. */
export function bestPick(pack: TrainerCard[]): TrainerCard {
  return pack.reduce((best, c) => (c.rank < best.rank ? c : best), pack[0]);
}
