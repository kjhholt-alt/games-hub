// ─── BuildKit Draft Ranker reader ────────────────────────────────────────────
//
// The mtg-workstation metahub engine writes a SEPARATE payload to
// public/mtg-draft.json (schema "buildkit-mtg-draft@1") to keep mtg-meta.json
// lean — see METAHUB-SPEC.md's ADDENDUM (wave 2, "THE DRAFT RANKER"). This
// file is the fs-based reader ONLY (server components / route handlers) — a
// deliberate mirror of lib/mtg.ts's idiom, split from the client-safe types
// and pure helpers in lib/mtgDraftView.ts. The ranker table, cheat sheet, and
// set switcher are CLIENT components (live search/sort/filter/set-switch),
// and `fs` has no browser polyfill: any client component that transitively
// imports it fails the Next.js build. Server code (this page's page.tsx)
// reads the payload here and passes plain data down as props; everything
// downstream of that only needs lib/mtgDraftView.ts.

import fs from "fs";
import path from "path";
import type { CubeWeekDiffPayload, MtgDraftPayload } from "@/lib/mtgDraftView";

export type {
  CubeCardRow,
  CubeEngineStatsBlock,
  CubeEngineStatsCard,
  CubeModule,
  CubeModuleStatus,
  CubePoolFilter,
  CubeCategoryFilter,
  CubePriorSource,
  CubePriorSummary,
  CubeWeekDiffCardRef,
  CubeWeekDiffCounts,
  CubeWeekDiffPayload,
  CubeWeekDiffTierMove,
  DraftCardRow,
  DraftConfidence,
  DraftGrade,
  DraftSetBlock,
  DraftSetStatus,
  HobModule,
  HobPriorSummary,
  MtgDraftPayload,
  PriorSource,
} from "@/lib/mtgDraftView";
export {
  isSampleDraftPayload,
  isCubeUnavailable,
  isCubeWeekDiffCurrent,
  isHobUnavailable,
  hasGapFillBasis,
  priorSourceBasisColor,
} from "@/lib/mtgDraftView";

const MTG_DRAFT_FILE = path.join(process.cwd(), "public", "mtg-draft.json");
const MTG_CUBE_WEEK_DIFF_FILE = path.join(process.cwd(), "public", "mtg-cube-week-diff.json");

function readFile(): MtgDraftPayload | null {
  try {
    return JSON.parse(fs.readFileSync(MTG_DRAFT_FILE, "utf-8")) as MtgDraftPayload;
  } catch {
    return null;
  }
}

/** The full payload, or null if the file is missing/unparseable. Callers must
 * handle null — an absent payload is a build-time honesty state too. */
export function getMtgDraft(): MtgDraftPayload | null {
  return readFile();
}

/** The cube week-over-week diff (scripts/build-cube-week-diff.mjs), or null
 * if it's missing/unparseable — the same fail-closed "null is a real state"
 * rule as getMtgDraft. Callers must ALSO check isCubeWeekDiffCurrent before
 * rendering anything from this — a present-but-stale file is expected
 * (fail-closed means the builder skips writing, it doesn't delete an old
 * one) and must render as absent. */
export function getMtgCubeWeekDiff(): CubeWeekDiffPayload | null {
  try {
    return JSON.parse(fs.readFileSync(MTG_CUBE_WEEK_DIFF_FILE, "utf-8")) as CubeWeekDiffPayload;
  } catch {
    return null;
  }
}
