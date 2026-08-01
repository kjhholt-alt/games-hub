"""Merge the Data Counter-offensive (gl-0590) engine stats artifact into
public/mtg-draft.json's cube module.

Written in Python (not Node) on purpose: the real mtg-workstation pipeline
that produces mtg-draft.json is itself Python, and round-tripping the file
through json.load/json.dump here reproduces its exact existing formatting
(ensure_ascii escaping, float-vs-int number formatting) byte-for-byte on
every field this script doesn't touch -- a Node JSON.parse/stringify round
trip silently reformats those (e.g. "cmc": 5.0 -> 5, unicode chars
un-escaped) across the WHOLE file, turning a small additive change into a
diff that touches nearly every row for no reason. This script's own diff is
meant to be exactly what it says: additive.

This is deliberately NOT a full pipeline re-run: the real engine owns
cube.rows' grade/draft_score/heuristic_score computation and isn't reachable
from this repo, so cube.computed_at and every existing grading field are
left byte-for-byte alone. This script only ADDS the new
engine_wr/engine_games/engine_decks fields (gated on the disclosed floor)
and, only where a row's current basis is the weakest ("heuristic", zero
real data behind it), upgrades that row's basis to "forge_engine" -- never
touching a row that already carries real 17lands data or a Powered
Cube/cross-set prior.

Input: data/engine-stats.json by default -- games-hub's OWN committed source
artifact (gl-0600), built by scripts/build_engine_stats_artifact.py from
mtg-forge-shard's aggregate_cube_cards.py output. Committing this artifact
INSIDE games-hub (rather than only ever reading the sibling mtg-forge-shard
checkout live) is the whole fix for the failure mode this script's history
warns about: a from-scratch publisher refresh of mtg-draft.json wipes
cube.engine_stats because it doesn't know that block exists, and previously
there was no committed record in this repo to re-merge from afterward. Now
there is -- this script is wired into `npm run build` (see package.json's
"prebuild") so every build re-applies it automatically. Raw match receipts
still stay in mtg-forge-shard -- this script never copies them into the web
payload, only the aggregated numbers.

Fails CLOSED (skips the merge, exits 0, leaves the payload byte-for-byte
untouched) rather than applying stale evidence, whenever:
  - public/mtg-draft.json has no `cube` module at all, or
  - the artifact's `week_label` doesn't match the live payload's
    `cube.week_label` -- the cube's card pool rotates weekly, so an artifact
    aggregated against a prior week's pool must never be silently reapplied
    to a different week's rows; re-run build_engine_stats_artifact.py against
    the new week first.

Usage: py scripts/merge_cube_engine_stats.py [path/to/engine-stats.json]
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent

# Disclosed floor: a card needs at least this many credited engine games
# before engine_wr/engine_games/engine_decks appear on its row at all, or
# before "forge_engine" can become that row's basis. Below this, nothing is
# shown -- the same never-guess-off-a-thin-sample rule every other basis
# tier on this page already follows.
FLOOR_GAMES = 40

ATTRIBUTION_LINE = (
    "Card-Forge rules-engine round-robin matches, self-hosted (BuildKit Proving Grounds)"
)

ENGINE_METHODOLOGY_ADDENDUM = (
    "DATA COUNTER-OFFENSIVE ADDENDUM (gl-0590): cube.engine_stats is a genuinely "
    "independent evidence source, computed by us rather than scraped -- our own "
    "Card-Forge rules engine (mtg-forge-shard) plays the 10 real Planar-Cube guild "
    "decks (one per two-color pair, built from this same pool under the same "
    "heuristic-construction rules used everywhere on this page) against each other "
    "in repeated best-of-three round robins, chained across freshly-seeded seed "
    "sets exactly like the existing plan-s2..s6 lineage, with every match run "
    "TWICE and only promoted to \"rules_engine_verified\" when both runs normalize "
    "identically -- a held or non-repeating run earns nothing. Every card in a "
    "deck's real decklist is credited with that deck's game wins/losses in every "
    "match it plays, so a card's engine_wr is wins/games summed across every "
    "credited game from every guild deck that carries it, across every receipted "
    "seed set -- computed strictly from receipts, never estimated. A card only "
    "earns engine_wr/engine_games/engine_decks on its row, and the \"forge_engine\" "
    "basis (rendered \"Engine (N games)\"), once its total credited games clear "
    "cube.engine_stats.floor_games; below that floor nothing is shown. forge_engine "
    "ONLY ever replaces the \"heuristic\" tier (rarity/CMC/type points, zero real "
    "data behind them) -- a row already carrying real 17lands data, a Powered Cube "
    "prior, or a cross-set prior keeps that basis exactly as it was, never "
    "silently overridden. This is NOT a per-card draft signal: it is a "
    "constructed guild-deck win rate shared across every card that deck carries, "
    "so a strong deck inflates every card in it the same way any constructed win "
    "rate would -- read it as \"this card's deck wins with the Forge AI\", not "
    "\"this card is individually strong\" (grade/draft_score/heuristic_score are "
    "computed by the real pipeline and are never rewritten by this addendum). "
    "Card-Forge is not MTG Arena and its AI may value cards differently than a "
    "human drafter. Full match receipts (every run's raw log, hash, and "
    "normalized result) are retained in the Forge shard for audit; this payload "
    "carries only the aggregated numbers, kept small on purpose."
)


def main() -> int:
    artifact_path = (
        Path(sys.argv[1]).resolve()
        if len(sys.argv) > 1
        else ROOT / "data" / "engine-stats.json"
    )
    payload_path = ROOT / "public" / "mtg-draft.json"

    artifact = json.loads(artifact_path.read_text(encoding="utf-8"))
    payload = json.loads(payload_path.read_text(encoding="utf-8"))

    cube = payload.get("cube")
    if not cube:
        print(
            "merge_cube_engine_stats: mtg-draft.json has no cube module -- "
            "skipping (fail-closed, payload left untouched)"
        )
        return 0

    if artifact["week_label"] != cube["week_label"]:
        print(
            "merge_cube_engine_stats: artifact week_label "
            f"{artifact['week_label']!r} != live cube week_label "
            f"{cube['week_label']!r} -- skipping (fail-closed, payload left "
            "untouched); re-run build_engine_stats_artifact.py against the "
            "current week's receipts first"
        )
        return 0

    card_index = {c["card"]: c for c in artifact["cards"]}

    upgraded = 0
    engine_rows_populated = 0

    for row in cube["rows"]:
        stat = card_index.get(row["card"])
        if not stat or stat["engine_games"] < FLOOR_GAMES:
            continue

        row["engine_wr"] = stat["engine_wr"]
        row["engine_games"] = stat["engine_games"]
        row["engine_decks"] = stat["engine_decks"]
        engine_rows_populated += 1

        if row["prior_source"] == "heuristic":
            row["prior_source"] = "forge_engine"
            row["basis"] = f"Engine ({stat['engine_games']} games)"
            row["confidence"] = "low"
            row["sample_size"] = stat["engine_games"]
            row["heuristic_score"] = None
            upgraded += 1

    # Recomputed by scanning every row fresh (never a per-run delta) so this
    # script stays idempotent across repeated merges as more seed sets land
    # -- a delta counter would only reflect rows upgraded THIS run and lose
    # the running total from a prior merge.
    cube["prior_summary"]["heuristic"] = sum(
        1 for row in cube["rows"] if row["prior_source"] == "heuristic"
    )
    cube["prior_summary"]["forge_engine"] = sum(
        1 for row in cube["rows"] if row["prior_source"] == "forge_engine"
    )

    cards_above_floor = [c for c in artifact["cards"] if c["engine_games"] >= FLOOR_GAMES]
    cards_above_floor.sort(key=lambda c: (-c["engine_games"], c["card"]))

    cube["engine_stats"] = {
        "status": "published",
        "evidence_class": "rules_engine",
        "generated_utc": artifact["generated_utc"],
        "methodology": ENGINE_METHODOLOGY_ADDENDUM,
        "engine": artifact["engine"],
        "floor_games": FLOOR_GAMES,
        "seed_sets": artifact["seed_sets"],
        "total_planned_matches": artifact["total_planned_matches"],
        "total_receipted_matches": artifact["total_receipted_matches"],
        "total_held_matches": artifact["total_held_matches"],
        "total_credited_matches": artifact["total_credited_matches"],
        "cards_tracked": len(artifact["cards"]),
        "cards_above_floor": len(cards_above_floor),
        "limitations": [
            "Card-Forge is not MTG Arena and may implement cards or AI differently.",
            "This is a constructed guild-deck win rate credited to every card in "
            "that deck's list, not an isolated per-card draft signal -- a strong "
            "deck inflates every card it carries.",
            "Only the 10 guild constructed decks are exercised; most pool cards "
            "never appear in any of them and carry no engine data at all.",
            "One pinned engine version and one family of AI-vs-AI matchups -- "
            "proves reproducible engine results, not a live metagame win rate.",
        ],
        "cards": [
            {
                "card": c["card"],
                "engine_games": c["engine_games"],
                "engine_wins": c["engine_wins"],
                "engine_wr": c["engine_wr"],
                "engine_decks": c["engine_decks"],
            }
            for c in cards_above_floor
        ],
    }

    if "DATA COUNTER-OFFENSIVE ADDENDUM" not in cube["methodology"]:
        cube["methodology"] = f"{cube['methodology']}\n\n{ENGINE_METHODOLOGY_ADDENDUM}"
    if ATTRIBUTION_LINE not in cube["attribution"]:
        cube["attribution"].append(ATTRIBUTION_LINE)

    payload_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8"
    )

    print(
        f"merged engine stats: {engine_rows_populated} rows carry "
        f"engine_wr/engine_games (floor {FLOOR_GAMES} games), {upgraded} upgraded "
        f"heuristic -> forge_engine"
    )
    print(
        f"cube.engine_stats: {len(cards_above_floor)}/{len(artifact['cards'])} cards "
        f"above floor, {artifact['total_receipted_matches']}/"
        f"{artifact['total_planned_matches']} matches receipted across "
        f"{artifact['seed_sets']} seed sets ({artifact['total_held_matches']} held)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
