// Combine all six Brawl chain seed-shards (mtg-forge-shard's receipts,
// receipts-s2..s6 -- the same six seed sets already cross-checked in
// public/mtg-proving-grounds-forge-agreement.json) into ONE receipted
// standings payload: 270 real Card-Forge matches (45 pairings x 6 seeds),
// summed per deck, with a per-match record carrying its own receipt_hash so
// the league page can link every score to the raw match it came from.
//
// This is additive evidence, not a replacement: public/mtg-proving-grounds
// -forge-standings.json (single shard, seed 20260727) and
// -forge-agreement.json (cross-seed reproducibility) are untouched. This
// script only ever WRITES public/mtg-proving-grounds-forge-combined.json.
//
// Fails CLOSED (throws, writes nothing) if:
//   - any shard directory is missing or has other than 45 receipt files
//   - any receipt's status isn't "rules_engine_verified" or held_reasons
//     isn't empty
//   - a receipt's two runs didn't normalize identically (normalized_repeat
//     must be true) -- an unreproduced match earns nothing here either
//   - a match's winner label can't be resolved to exactly one of its two
//     deck_files entries
// Status is only ever "receipted" because promoted == planned is verified
// before writing; if a future re-run of this script sees a gap it must fail
// closed rather than silently downgrade a status field a page already reads.
//
// Usage: node scripts/build-forge-combined-standings.mjs <mtg-forge-shard root>

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_PATH = path.join(ROOT, "public", "mtg-proving-grounds-forge-combined.json");

const SHARD_DIRS = [
  "receipts",
  "receipts-s2",
  "receipts-s3",
  "receipts-s4",
  "receipts-s5",
  "receipts-s6",
];
const EXPECTED_MATCHES_PER_SHARD = 45;

function fail(message) {
  throw new Error(`build-forge-combined-standings: ${message}`);
}

function resolveDeckIdForLabel(label, deckFiles) {
  const hit = deckFiles.filter((deck) => label.includes(deck.deck_name));
  if (hit.length !== 1) {
    fail(`winner label "${label}" did not resolve to exactly one deck (matched ${hit.length})`);
  }
  return hit[0].deck_id;
}

function main() {
  const forgeShardRoot = process.argv[2];
  if (!forgeShardRoot) {
    fail("usage: build-forge-combined-standings.mjs <mtg-forge-shard root>");
  }

  const perMatch = [];
  const seedSets = [];
  let jarSha256 = null;

  for (const shardDir of SHARD_DIRS) {
    const dirPath = path.join(forgeShardRoot, shardDir);
    if (!fs.existsSync(dirPath)) {
      fail(`shard directory missing: ${dirPath} -- stopping, not fabricating coverage`);
    }
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".json")).sort();
    if (files.length !== EXPECTED_MATCHES_PER_SHARD) {
      fail(
        `${shardDir} has ${files.length} receipts, expected ${EXPECTED_MATCHES_PER_SHARD} -- incomplete shard, stopping`
      );
    }

    let shardSeed = null;
    for (const file of files) {
      const receipt = JSON.parse(fs.readFileSync(path.join(dirPath, file), "utf8"));

      if (receipt.status !== "rules_engine_verified") {
        fail(`${shardDir}/${file} status is "${receipt.status}", not rules_engine_verified -- stopping`);
      }
      if ((receipt.held_reasons ?? []).length > 0) {
        fail(`${shardDir}/${file} carries held_reasons -- stopping`);
      }
      if (receipt.normalized_repeat !== true) {
        fail(`${shardDir}/${file} did not reproduce across its two runs -- stopping`);
      }
      if (receipt.runs.length !== 2) {
        fail(`${shardDir}/${file} does not have exactly two runs -- stopping`);
      }
      const [runA, runB] = receipt.runs;
      if (JSON.stringify(runA.normalized) !== JSON.stringify(runB.normalized)) {
        fail(`${shardDir}/${file} run outputs differ despite normalized_repeat=true -- stopping`);
      }
      if (receipt.engine.jar_sha256 == null) {
        fail(`${shardDir}/${file} has no engine jar_sha256 -- stopping`);
      }
      if (jarSha256 === null) {
        jarSha256 = receipt.engine.jar_sha256;
      } else if (jarSha256 !== receipt.engine.jar_sha256) {
        fail(
          `${shardDir}/${file} was run on a different engine jar (${receipt.engine.jar_sha256}) than the rest (${jarSha256}) -- not directly comparable, stopping`
        );
      }
      // Each match in a shard gets its own auto-incremented seed
      // (forge-brawl-001 uses the shard's base seed, forge-brawl-002 uses
      // base+1, ...) -- record the shard's base seed from the
      // alphabetically-first match, matching how the plan files and
      // forge-agreement.json both label a shard by its first match's seed.
      if (shardSeed === null) {
        shardSeed = receipt.seed;
      }

      const [deckA, deckB] = receipt.deck_files;
      const normalized = runA.normalized;
      const winnerDeckId = resolveDeckIdForLabel(normalized.match_winner, receipt.deck_files);
      const loserDeckId = winnerDeckId === deckA.deck_id ? deckB.deck_id : deckA.deck_id;

      const gameWinsByDeck = { [deckA.deck_id]: 0, [deckB.deck_id]: 0 };
      for (const game of normalized.games) {
        const gameWinnerId = resolveDeckIdForLabel(game.winner, receipt.deck_files);
        gameWinsByDeck[gameWinnerId] += 1;
      }

      perMatch.push({
        match_id: `${shardDir}:${receipt.match_id}`,
        shard: shardDir,
        seed: receipt.seed,
        executed_utc: receipt.executed_utc,
        deck_a_id: deckA.deck_id,
        deck_b_id: deckB.deck_id,
        winner_deck_id: winnerDeckId,
        loser_deck_id: loserDeckId,
        game_count: normalized.game_count,
        games: normalized.games.map((g) => ({
          game: g.game,
          winner_deck_id: resolveDeckIdForLabel(g.winner, receipt.deck_files),
          turns: g.turns,
        })),
        game_wins: gameWinsByDeck,
        normalized_repeat: true,
        receipt_hash: receipt.receipt_hash,
      });
    }
    seedSets.push({ shard: shardDir, seed: shardSeed, match_count: files.length });
  }

  const plannedMatchCount = SHARD_DIRS.length * EXPECTED_MATCHES_PER_SHARD;
  if (perMatch.length !== plannedMatchCount) {
    fail(`collected ${perMatch.length} matches, expected ${plannedMatchCount} -- stopping`);
  }

  const tableByDeck = new Map();
  function rowFor(deckId) {
    if (!tableByDeck.has(deckId)) {
      tableByDeck.set(deckId, {
        deck_id: deckId,
        matches: 0,
        match_wins: 0,
        match_losses: 0,
        game_wins: 0,
        game_losses: 0,
      });
    }
    return tableByDeck.get(deckId);
  }

  for (const match of perMatch) {
    const winnerRow = rowFor(match.winner_deck_id);
    const loserRow = rowFor(match.loser_deck_id);
    winnerRow.matches += 1;
    winnerRow.match_wins += 1;
    loserRow.matches += 1;
    loserRow.match_losses += 1;
    const winnerGames = match.game_wins[match.winner_deck_id];
    const loserGames = match.game_wins[match.loser_deck_id];
    winnerRow.game_wins += winnerGames;
    winnerRow.game_losses += loserGames;
    loserRow.game_wins += loserGames;
    loserRow.game_losses += winnerGames;
  }

  const table = [...tableByDeck.values()]
    .map((row) => ({ ...row, match_win_rate: Math.round((row.match_wins / row.matches) * 10000) / 10000 }))
    .sort((a, b) => b.match_win_rate - a.match_win_rate || b.match_wins - a.match_wins);

  // Full coverage means: every deck played every other deck exactly once per
  // shard, across all six shards -- (deck_count - 1) * shard_count matches
  // each, with nothing held and nothing unattributed.
  const deckCount = table.length;
  const expectedMatchesPerDeck = (deckCount - 1) * SHARD_DIRS.length;
  const coverageComplete = table.every((row) => row.matches === expectedMatchesPerDeck);
  if (!coverageComplete) {
    fail(
      `standings are not evenly covered (expected ${expectedMatchesPerDeck} matches/deck) -- refusing to mark status "receipted"`
    );
  }

  const payloadWithoutHash = {
    schema: "buildkit-mtg-forge-combined-standings@1",
    // Only reachable because coverageComplete was verified true above --
    // this field must never be set any other way.
    status: "receipted",
    evidence_class: "rules_engine",
    generated_utc: new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00"),
    engine: { name: "Card-Forge", version: "2.0.14-SNAPSHOT-07.26", jar_sha256: jarSha256 },
    seed_sets: seedSets,
    shard_count: SHARD_DIRS.length,
    planned_match_count: plannedMatchCount,
    promoted_match_count: perMatch.length,
    held_match_count: 0,
    unattributed_match_count: 0,
    coverage_complete: true,
    promotion_rule:
      "Only receipts whose two independent runs normalized identically, on one pinned engine jar, across all six seeded round robins, may enter this table.",
    limitations: [
      "Forge is not MTG Arena and may implement cards or AI differently.",
      "This proves reproducible pinned-engine matchups repeated across six seeds, not a live metagame win rate.",
      "Deck AI quality, not just deck strength, influences these results.",
      "Only the ten Forge-compatible admitted decks are exercised here; the synthetic 20-deck sample table above uses an unrelated fixture roster and is never mixed with this data.",
    ],
    table,
    matches: perMatch,
  };

  const receiptHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(payloadWithoutHash))
    .digest("hex");
  const payload = { ...payloadWithoutHash, receipt_hash: receiptHash };

  const json = JSON.stringify(payload, null, 2) + "\n";
  const sizeKb = Buffer.byteLength(json, "utf8") / 1024;
  fs.writeFileSync(OUT_PATH, json, "utf8");

  console.log(
    `wrote ${OUT_PATH} (${sizeKb.toFixed(1)} KiB) -- ${payload.promoted_match_count}/${payload.planned_match_count} matches, ${deckCount} decks, status=${payload.status}, receipt ${receiptHash.slice(0, 12)}`
  );
}

main();
