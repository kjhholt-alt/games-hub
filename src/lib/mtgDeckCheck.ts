// ─── Deck Checker Lite — client-safe matching (no `fs`) ─────────────────────
//
// /mtg/check pastes an Arena export, parses it with the SAME tolerant
// parser the Wildcard Calculator already ships (lib/mtgWildcards.ts's
// parseArenaDecklist/mergeByName — no reason to fork a second decklist
// grammar), then matches every unique card name against the ALREADY
// PUBLISHED /mtg-draft.json payload fetched client-side. No new payload
// fields, no Scryfall lookups for matching (image_normal is only ever used
// for the existing MtgCardHover preview, never fetched fresh) — this reads
// exactly what /mtg/cube, /mtg/draft, and /mtg/hob already render.
//
// Match order (METAHUB-SPEC.md's honesty chain, reused rather than
// reinvented): the live cube pool first (cube.rows, always a real S–F grade
// with basis), then "format tier data" — every published standard set's
// gap-filled overall_rows, then the HOB Day-0 pack — both of which also
// carry a real grade + basis whenever the engine's gap-fill ran. A row
// found with a bare `grade: "unrated"` (no gap-fill applied, e.g. an older
// payload) is treated exactly like a miss: the no-bare-unrated rule is
// global, so this module never surfaces an invented or half-honest tier —
// a card either carries a real graded basis or renders as honestly
// uncovered.

import type { MtgTierLetter } from "@/components/MtgTierPlate";
import {
  isCubeUnavailable,
  isHobUnavailable,
  priorSourceBasisColor,
  type CubeCardRow,
  type DraftCardRow,
  type DraftConfidence,
  type DraftSetBlock,
  type HobModule,
  type MtgDraftPayload,
  type PriorSource,
} from "@/lib/mtgDraftView";
import { isBasicLand, type CardEntry } from "@/lib/mtgWildcards";

export { parseArenaDecklist, mergeByName, isBasicLand, countBasicLands } from "@/lib/mtgWildcards";
export type { CardEntry, ParsedLine } from "@/lib/mtgWildcards";

export type DeckCheckSourceKind = "cube" | "draft_set" | "hob" | "uncovered";

export interface DeckCheckRow {
  card: string;
  count: number;
  covered: boolean;
  sourceKind: DeckCheckSourceKind;
  /** Human label for where the grade came from, e.g. "Planar Cube",
   * "MSH Draft", "The Hobbit (spoiler)", "Not covered". */
  sourceLabel: string;
  /** Always a real S–F letter when `covered`; "unrated" only for the
   * honestly-uncovered rows (MtgTierPlate already renders that as a dashed
   * plate — never a guessed grade). */
  grade: MtgTierLetter | "unrated";
  basis: string | null;
  priorSource: PriorSource | null;
  confidence: DraftConfidence | null;
  sampleSize: number | null;
  gihWinRate: number | null;
  imageNormal?: string;
}

export interface DeckCheckSummary {
  total: number;
  covered: number;
  uncovered: number;
  fromCube: number;
  fromDraftSet: number;
  fromHob: number;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function findCubeMatch(query: string, payload: MtgDraftPayload): CubeCardRow | null {
  const cube = payload.cube;
  if (!cube || isCubeUnavailable(cube)) return null;
  return cube.rows.find((r) => normalizeName(r.card) === query) ?? null;
}

/** Only published sets carry graded rows; only a genuinely gap-filled row
 * (grade !== "unrated") counts as a match — see module doc comment. */
function findDraftSetMatch(
  query: string,
  sets: DraftSetBlock[]
): { row: DraftCardRow; set: DraftSetBlock } | null {
  for (const set of sets) {
    if (set.status !== "published") continue;
    const row = set.overall_rows.find(
      (r) => normalizeName(r.card) === query && r.grade !== "unrated"
    );
    if (row) return { row, set };
  }
  return null;
}

function findHobMatch(query: string, hob: HobModule | undefined): DraftCardRow | null {
  if (!hob || isHobUnavailable(hob)) return null;
  return (
    hob.rows.find((r) => normalizeName(r.card) === query && r.grade !== "unrated") ?? null
  );
}

function fromCubeRow(entry: CardEntry, row: CubeCardRow): DeckCheckRow {
  return {
    card: entry.name,
    count: entry.count,
    covered: true,
    sourceKind: "cube",
    sourceLabel: "Planar Cube",
    grade: row.grade,
    basis: row.basis,
    priorSource: row.prior_source,
    confidence: row.confidence,
    sampleSize: row.sample_size,
    gihWinRate: row.gih_wr,
    imageNormal: row.image_normal,
  };
}

function fromDraftSetRow(entry: CardEntry, row: DraftCardRow, set: DraftSetBlock): DeckCheckRow {
  return {
    card: entry.name,
    count: entry.count,
    covered: true,
    sourceKind: "draft_set",
    sourceLabel: `${set.set_code} Draft`,
    // row.grade is narrowed to exclude "unrated" by findDraftSetMatch's filter.
    grade: row.grade as MtgTierLetter,
    basis: row.basis ?? null,
    priorSource: row.prior_source ?? null,
    confidence: row.confidence,
    sampleSize: row.sample_size,
    gihWinRate: row.gih_wr,
    imageNormal: row.image_normal,
  };
}

function fromHobRow(entry: CardEntry, row: DraftCardRow): DeckCheckRow {
  return {
    card: entry.name,
    count: entry.count,
    covered: true,
    sourceKind: "hob",
    sourceLabel: "The Hobbit (spoiler)",
    grade: row.grade as MtgTierLetter,
    basis: row.basis ?? null,
    priorSource: row.prior_source ?? null,
    confidence: row.confidence,
    sampleSize: row.sample_size,
    gihWinRate: row.gih_wr,
    imageNormal: row.image_normal,
  };
}

function uncoveredRow(entry: CardEntry): DeckCheckRow {
  return {
    card: entry.name,
    count: entry.count,
    covered: false,
    sourceKind: "uncovered",
    sourceLabel: "Not covered",
    grade: "unrated",
    basis: null,
    priorSource: null,
    confidence: null,
    sampleSize: null,
    gihWinRate: null,
  };
}

/** Drops basic lands (never tiered by any module — same exclusion rule the
 * Wildcard Calculator already applies) before matching. */
export function buildDeckCheckRows(
  entries: CardEntry[],
  payload: MtgDraftPayload | null
): DeckCheckRow[] {
  return entries
    .filter((entry) => !isBasicLand(entry.name))
    .map((entry) => {
      const query = normalizeName(entry.name);
      if (payload) {
        const cubeMatch = findCubeMatch(query, payload);
        if (cubeMatch) return fromCubeRow(entry, cubeMatch);

        const draftMatch = findDraftSetMatch(query, payload.sets);
        if (draftMatch) return fromDraftSetRow(entry, draftMatch.row, draftMatch.set);

        const hobMatch = findHobMatch(query, payload.hob);
        if (hobMatch) return fromHobRow(entry, hobMatch);
      }
      return uncoveredRow(entry);
    });
}

const GRADE_RANK: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4, F: 5, unrated: 6 };

/** Covered rows first (best grade first), honestly-uncovered rows trailing
 * — never mixed in ahead of a real grade. */
export function sortDeckCheckRows(rows: DeckCheckRow[]): DeckCheckRow[] {
  return [...rows].sort((a, b) => {
    if (a.covered !== b.covered) return a.covered ? -1 : 1;
    const r = (GRADE_RANK[a.grade] ?? 6) - (GRADE_RANK[b.grade] ?? 6);
    if (r !== 0) return r;
    return a.card.localeCompare(b.card);
  });
}

export function summarizeDeckCheck(rows: DeckCheckRow[]): DeckCheckSummary {
  return {
    total: rows.length,
    covered: rows.filter((r) => r.covered).length,
    uncovered: rows.filter((r) => !r.covered).length,
    fromCube: rows.filter((r) => r.sourceKind === "cube").length,
    fromDraftSet: rows.filter((r) => r.sourceKind === "draft_set").length,
    fromHob: rows.filter((r) => r.sourceKind === "hob").length,
  };
}

/** Basis label color — reuses the exact vocabulary the cube/HOB tables use;
 * uncovered rows (no priorSource) render neutral, never a guessed color. */
export function deckCheckBasisColor(priorSource: PriorSource | null): string {
  return priorSource ? priorSourceBasisColor(priorSource) : "text-text-secondary";
}
