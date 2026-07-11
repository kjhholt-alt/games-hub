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
import type { MtgDraftPayload } from "@/lib/mtgDraftView";

export type {
  DraftCardRow,
  DraftConfidence,
  DraftGrade,
  DraftSetBlock,
  DraftSetStatus,
  MtgDraftPayload,
} from "@/lib/mtgDraftView";
export { isSampleDraftPayload } from "@/lib/mtgDraftView";

const MTG_DRAFT_FILE = path.join(process.cwd(), "public", "mtg-draft.json");

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
