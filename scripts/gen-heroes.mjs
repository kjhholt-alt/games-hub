// Regenerate src/data/heroes.ts from the deadlock-highlights hero fixture.
//
// Maps each selectable Deadlock hero_id -> { name, icon } so the live hero-stats
// feed (which is keyed by hero_id only) can be joined to display names + icons.
// Source fixture: deadlock-highlights/fixtures/heroes.json (the open
// deadlock-api asset list). Run `npm run gen:heroes` if Valve adds heroes.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// Prefer a sibling deadlock-highlights checkout; fall back to a vendored copy.
const SOURCES = [
  path.join(ROOT, "..", "deadlock-highlights", "fixtures", "heroes.json"),
  path.join(ROOT, "src", "data", "heroes-source.json"),
];

function loadHeroes() {
  for (const src of SOURCES) {
    try {
      return JSON.parse(fs.readFileSync(src, "utf-8"));
    } catch {
      /* try next */
    }
  }
  throw new Error("no heroes.json source found");
}

const heroes = loadHeroes();
const out = {};
for (const h of heroes) {
  if (!h.player_selectable || h.disabled) continue;
  out[h.id] = {
    id: h.id,
    name: h.name,
    icon:
      (h.images && (h.images.icon_image_small_webp || h.images.icon_image_small)) ||
      null,
  };
}

const banner =
  "// AUTO-GENERATED from deadlock-highlights/fixtures/heroes.json (selectable heroes).\n" +
  "// Regenerate via: npm run gen:heroes\n" +
  "// Maps Deadlock hero_id -> { name, icon } for joining live hero-stats to display names + icons.\n";
const body =
  "export interface HeroMeta { id: number; name: string; icon: string | null; }\n\n" +
  "export const HERO_BY_ID: Record<number, HeroMeta> = " +
  JSON.stringify(out, null, 2) +
  ";\n";

fs.writeFileSync(path.join(ROOT, "src", "data", "heroes.ts"), banner + body);
console.log(`Wrote src/data/heroes.ts with ${Object.keys(out).length} heroes`);
