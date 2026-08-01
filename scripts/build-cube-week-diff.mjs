// Derive the Planar Cube "what changed this week" diff straight from this
// repo's own git history for public/mtg-draft.json — the true published
// record (gl-0573: mtg-workstation/metahub does not exist on this node, so
// there is no separate pipeline to compute this; the games-hub clone's own
// commit history of the cube payload IS the source of truth).
//
// Walks `git log -- public/mtg-draft.json` newest-first, finds the most
// recent commit whose cube.week_label differs from the CURRENT on-disk
// payload's week_label, and diffs the two row sets by card name. FAILS
// CLOSED: if no prior distinct week exists anywhere in history (first-ever
// cube publish, or every commit shares today's week_label), nothing is
// written — the page's own isCubeWeekDiffCurrent() gate means an absent
// file just hides the strip, never a stale or fabricated one.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PAYLOAD_REL = "public/mtg-draft.json";
const OUT_REL = "public/mtg-cube-week-diff.json";
const MAX_BUFFER = 20 * 1024 * 1024;

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, maxBuffer: MAX_BUFFER }).toString("utf-8");
}

function cubeAt(sha) {
  let text;
  try {
    text = git(["show", `${sha}:${PAYLOAD_REL}`]);
  } catch {
    return null; // file didn't exist in that commit yet
  }
  try {
    const payload = JSON.parse(text);
    return payload.cube ?? null;
  } catch {
    return null;
  }
}

function diffRows(prevRows, curRows) {
  const prevByCard = new Map(prevRows.map((r) => [r.card, r]));
  const curByCard = new Map(curRows.map((r) => [r.card, r]));

  const added = [...curByCard.keys()]
    .filter((c) => !prevByCard.has(c))
    .sort((a, b) => a.localeCompare(b))
    .map((card) => ({ card, grade: curByCard.get(card).grade }));

  const removed = [...prevByCard.keys()]
    .filter((c) => !curByCard.has(c))
    .sort((a, b) => a.localeCompare(b))
    .map((card) => ({ card, grade: prevByCard.get(card).grade }));

  const tier_moves = [];
  for (const [card, curRow] of curByCard) {
    const prevRow = prevByCard.get(card);
    if (prevRow && prevRow.grade !== curRow.grade) {
      tier_moves.push({ name: card, from_tier: prevRow.grade, to_tier: curRow.grade });
    }
  }
  tier_moves.sort((a, b) => a.name.localeCompare(b.name));

  return { added, removed, tier_moves };
}

function main() {
  const payloadPath = path.join(ROOT, PAYLOAD_REL);
  let currentPayload;
  try {
    currentPayload = JSON.parse(fs.readFileSync(payloadPath, "utf-8"));
  } catch {
    console.log(`[cube-week-diff] can't read/parse ${PAYLOAD_REL} -- fail closed, nothing written.`);
    return;
  }

  const currentCube = currentPayload.cube;
  if (!currentCube || !currentCube.week_label || !Array.isArray(currentCube.rows)) {
    console.log("[cube-week-diff] no usable cube module in current payload -- fail closed, nothing written.");
    return;
  }

  let commits;
  try {
    commits = git(["log", "--format=%H", "--", PAYLOAD_REL]).trim().split("\n").filter(Boolean);
  } catch {
    console.log("[cube-week-diff] git log failed -- fail closed, nothing written.");
    return;
  }

  let currentCommit = null;
  let previousCommit = null;
  let previousCube = null;

  for (const sha of commits) {
    const cube = cubeAt(sha);
    if (!cube || !cube.week_label || !Array.isArray(cube.rows)) continue;
    if (cube.week_label === currentCube.week_label) {
      if (!currentCommit) currentCommit = sha;
      continue;
    }
    previousCommit = sha;
    previousCube = cube;
    break;
  }

  if (!previousCommit || !previousCube) {
    console.log(
      "[cube-week-diff] no prior commit with a distinct cube.week_label found in history -- fail closed, nothing written."
    );
    return;
  }

  const { added, removed, tier_moves } = diffRows(previousCube.rows, currentCube.rows);

  const output = {
    schema: "buildkit-mtg-cube-week-diff@1",
    computed_at: new Date().toISOString(),
    basis: `Diff of published payload history (git log -- ${PAYLOAD_REL}): ${previousCube.week_label} -> ${currentCube.week_label}.`,
    current_week_label: currentCube.week_label,
    previous_week_label: previousCube.week_label,
    current_commit: currentCommit ?? "(working tree, not yet committed)",
    previous_commit: previousCommit,
    counts: {
      added: added.length,
      removed: removed.length,
      tier_moves: tier_moves.length,
    },
    added,
    removed,
    tier_moves,
  };

  fs.writeFileSync(path.join(ROOT, OUT_REL), JSON.stringify(output, null, 2) + "\n");
  console.log(
    `[cube-week-diff] wrote ${OUT_REL}: ${previousCube.week_label} -> ${currentCube.week_label} ` +
      `(+${added.length} / -${removed.length} / ${tier_moves.length} tier moves)`
  );
}

main();
