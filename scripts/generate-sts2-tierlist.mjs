// Generate a vendored Slay the Spire 2 tier-list snapshot from our own card-db.
//
// SOURCE OF TRUTH
//   C:/Users/Kruz/Desktop/Projects/buildkit-mods/slay-the-spire-2/card-db/
//     card_ratings.json   aggregate 0-100 score + S-D tier per item (cards + relics),
//                         a weighted mean of 4 public tier lists (Mobalytics,
//                         slaythespire2.space, slaythetierlist.com + its relic list),
//                         kept patch-current. See that repo's card-db/README.md.
//     card_catalog.json   per-card display name (cls), pool/character, type, rarity, cost
//     card_meta.json      per-card name/type/cost/rarity/desc/class (richer descriptions)
//
// This script JOINS ratings -> catalog/meta to attach a readable name, character
// (pool), type, rarity and cost to every rated id, prettifies relic ids into names,
// and writes one self-contained snapshot the games-hub site ships statically. The
// games-hub build cannot read the buildkit-mods repo (different project, not present
// on Vercel), so — exactly like deadlock-snapshot.json — the committed snapshot is the
// data the page renders, and this script is the refresh tool.
//
// Refresh:  node scripts/generate-sts2-tierlist.mjs   (re-reads card-db, rewrites snapshot)
//           (add a `"gen:sts2"` package.json alias to match gen:tierlist when convenient)
// Override card-db location with STS2_CARD_DB=/abs/path/to/card-db
//
// Pure Node stdlib, zero deps, safe to run in CI when the card-db is present.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const CARD_DB =
  process.env.STS2_CARD_DB ||
  path.resolve(
    ROOT,
    "..",
    "buildkit-mods",
    "slay-the-spire-2",
    "card-db"
  );

const TIER_ORDER = ["S", "A", "B", "C", "D"];

// The five playable characters in StS2 EA, plus the shared Colorless pool. Pools
// that aren't a character's own card set (curses, statuses, tokens, event cards)
// fold into "Neutral" so the character facet stays clean.
const CHARACTER_BY_POOL = {
  ironclad: "Ironclad",
  silent: "Silent",
  defect: "Defect",
  necrobinder: "Necrobinder",
  regent: "Regent",
  colorless: "Colorless",
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(CARD_DB, file), "utf-8"));
}

/** "BAG_OF_PREPARATION" -> "Bag of Preparation"; leaves real names alone. */
function prettify(id) {
  const small = new Set(["of", "the", "and", "a", "to", "in", "on", "for"]);
  const words = String(id).toLowerCase().split(/[_\s]+/).filter(Boolean);
  return words
    .map((w, i) =>
      i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)
    )
    .join(" ");
}

function characterFor(kind, pool) {
  if (kind === "relic") return "Relic";
  return CHARACTER_BY_POOL[pool] || "Neutral";
}

function main() {
  const ratings = readJson("card_ratings.json");
  const catalog = readJson("card_catalog.json").cards || {};
  const meta = readJson("card_meta.json").cards || {};

  const items = Object.entries(ratings.items).map(([id, r]) => {
    const cat = catalog[id] || {};
    const met = meta[id] || {};
    const name = met.name || cat.cls || prettify(id);
    const pool = cat.pool || met.class || null;
    const costRaw = cat.cost ?? met.cost;
    const cost =
      costRaw === undefined || costRaw === null || costRaw === ""
        ? null
        : Number(costRaw);

    return {
      id,
      name,
      kind: r.kind, // "card" | "relic"
      tier: r.tier, // S | A | B | C | D
      score: r.score, // 0-100 aggregate
      character: characterFor(r.kind, pool),
      type: cat.type || met.type || null, // Attack | Skill | Power (cards)
      rarity: cat.rarity || met.rarity || null,
      cost: Number.isFinite(cost) ? cost : null,
      nSources: r.n_sources ?? 0,
      spread: r.spread ?? 0,
      confidence: r.confidence || "low",
    };
  });

  // Sort: tier (S..D) first, then score desc, then name. Stable, deterministic.
  const tierIdx = (t) => {
    const i = TIER_ORDER.indexOf(t);
    return i < 0 ? TIER_ORDER.length : i;
  };
  items.sort(
    (a, b) =>
      tierIdx(a.tier) - tierIdx(b.tier) ||
      b.score - a.score ||
      a.name.localeCompare(b.name)
  );
  items.forEach((it, i) => (it.rank = i + 1));

  const cards = items.filter((i) => i.kind === "card").length;
  const relics = items.filter((i) => i.kind === "relic").length;

  const snapshot = {
    generatedAt: new Date().toISOString(),
    gamePatch: ratings.game_patch || null,
    sourcesUpdated: ratings.updated || null,
    sources: ratings.sources || [],
    counts: { total: items.length, cards, relics },
    items,
  };

  const out = path.join(ROOT, "src", "data", "sts2-snapshot.json");
  fs.writeFileSync(out, JSON.stringify(snapshot, null, 2) + "\n");

  const tiers = TIER_ORDER.map(
    (t) => `${t}:${items.filter((i) => i.tier === t).length}`
  ).join(" ");
  console.log(
    `Wrote ${out}\n  ${items.length} items (${cards} cards, ${relics} relics) · patch ${snapshot.gamePatch}\n  tiers ${tiers}`
  );
}

try {
  main();
} catch (e) {
  console.error("FAILED:", e.message);
  console.error(
    `  (expected card-db at ${CARD_DB} — set STS2_CARD_DB to override)`
  );
  process.exit(1);
}
