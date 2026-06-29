// Generate a vendored Deadlock tier-list snapshot from the live API.
//
// The /tier-lists page fetches live data with ISR, but falls back to this
// snapshot if the API is unreachable at build time — so the page never ships
// empty. Run `npm run gen:tierlist` to refresh it.
//
// Pure-stdlib mirror of the tier logic in src/lib/deadlock.ts so this script has
// zero dependencies and can run in CI.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const HERO_STATS_URL = "https://api.deadlock-api.com/v1/analytics/hero-stats";
const MIN_MATCHES = 5000;

function tierFor(wr) {
  if (wr >= 53) return "S";
  if (wr >= 51) return "A";
  if (wr >= 49.5) return "B";
  if (wr >= 48) return "C";
  return "D";
}
const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;

async function main() {
  // Load the generated hero map (id -> name + icon).
  const heroesTs = fs.readFileSync(
    path.join(ROOT, "src", "data", "heroes.ts"),
    "utf-8"
  );
  const jsonMatch = heroesTs.match(/HERO_BY_ID[^=]*=\s*(\{[\s\S]*?\});/);
  if (!jsonMatch) throw new Error("could not parse HERO_BY_ID from heroes.ts");
  const heroById = JSON.parse(jsonMatch[1]);

  const res = await fetch(HERO_STATS_URL, {
    headers: {
      "User-Agent": "games-hub/0.1 (+https://play.buildkit.store)",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`hero-stats returned ${res.status}`);
  const raw = await res.json();

  const eligible = raw.filter((s) => s.matches >= MIN_MATCHES);
  const totalMatches = eligible.reduce((sum, s) => sum + s.matches, 0) || 1;

  const heroes = eligible
    .map((s) => {
      const info = heroById[s.hero_id];
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

  const snapshot = {
    generatedAt: new Date().toISOString(),
    totalMatches,
    minMatches: MIN_MATCHES,
    heroes,
  };

  const out = path.join(ROOT, "src", "data", "deadlock-snapshot.json");
  fs.writeFileSync(out, JSON.stringify(snapshot, null, 2) + "\n");
  console.log(
    `Wrote ${out}\n  ${heroes.length} heroes, ${totalMatches.toLocaleString(
      "en-US"
    )} matches\n  Top: ${heroes
      .slice(0, 3)
      .map((h) => `${h.name} ${h.winRate}%`)
      .join(", ")}`
  );
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
