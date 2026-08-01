"""Wrap mtg-forge-shard's aggregate_cube_cards.py output into games-hub's OWN
committed source artifact (data/engine-stats.json).

Why this exists (gl-0600, gl-0599 successor): gl-0590/gl-0600's engine stats
previously lived only as a derived field on public/mtg-draft.json, produced by
running aggregate_cube_cards.py + merge_cube_engine_stats.py by hand against
whatever receipts happened to be on disk in mtg-forge-shard (a sibling
directory, NOT part of this repo, NOT under version control). A routine
publisher refresh of mtg-draft.json (a full, from-scratch payload regenerate
that knows nothing about engine_stats) silently wiped it, because there was no
committed record of the aggregate anywhere in games-hub to re-merge from.

This script fixes that by committing the aggregate itself, in this repo, as
data/engine-stats.json -- the source of truth merge_cube_engine_stats.py reads
from by default. Re-running this script re-derives that artifact from
whatever receipts currently exist (rerun after every top-up batch); the
artifact's own `week_label` is stamped from the CURRENT live payload at
generation time so a later merge can fail closed if the cube has since
rotated to a different week's card pool.

Input: the raw aggregate JSON from mtg-forge-shard/aggregate_cube_cards.py
(copied through byte-for-byte except for the fields this script adds), plus
the receipts root + shard directory names it was aggregated from (for the
live per-shard file recount -- aggregate_cube_cards.py itself only records
directory NAMES, not counts).

Usage:
  py scripts/build_engine_stats_artifact.py <raw_cube_engine_stats.json> \
      <receipts_root_dir> <shard_dir_name> [<shard_dir_name> ...]
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent


def main() -> int:
    if len(sys.argv) < 4:
        raise SystemExit(
            "usage: build_engine_stats_artifact.py <raw_stats.json> "
            "<receipts_root_dir> <shard_dir_name> [<shard_dir_name> ...]"
        )

    raw_path = Path(sys.argv[1]).resolve()
    receipts_root = Path(sys.argv[2]).resolve()
    shard_dirs = sys.argv[3:]

    raw = json.loads(raw_path.read_text(encoding="utf-8"))

    payload_path = ROOT / "public" / "mtg-draft.json"
    payload = json.loads(payload_path.read_text(encoding="utf-8"))
    cube = payload.get("cube")
    if not cube:
        raise SystemExit(
            "public/mtg-draft.json has no cube module -- cannot stamp a "
            "week_label onto the engine-stats artifact"
        )

    shard_receipt_counts = {
        name: len(list((receipts_root / name).glob("*.json"))) for name in shard_dirs
    }
    total_shard_receipts = sum(shard_receipt_counts.values())

    artifact = {
        "schema": "buildkit-cube-engine-stats-artifact@1",
        "generated_utc": raw["generated_utc"],
        "week_label": cube["week_label"],
        "evidence_class": raw["evidence_class"],
        "engine": raw["engine"],
        "seed_sets": raw["seed_sets"],
        "source_receipt_dirs": raw["source_receipt_dirs"],
        "shard_receipt_counts": shard_receipt_counts,
        "total_shard_receipts": total_shard_receipts,
        "total_planned_matches": raw["total_planned_matches"],
        "total_receipted_matches": raw["total_receipted_matches"],
        "total_held_matches": raw["total_held_matches"],
        "total_credited_matches": raw["total_credited_matches"],
        "deck_count": raw["deck_count"],
        "cards": raw["cards"],
    }

    out_path = ROOT / "data" / "engine-stats.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(artifact, indent=2) + "\n", encoding="utf-8")

    print(
        f"wrote {out_path} -- week_label={artifact['week_label']!r}, "
        f"{total_shard_receipts} shard receipts across {len(shard_dirs)} shards, "
        f"{artifact['total_credited_matches']}/{artifact['total_planned_matches']} "
        f"credited, {len(artifact['cards'])} cards tracked"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
