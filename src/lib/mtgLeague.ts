import fs from "fs";
import path from "path";

export interface LeagueProfile {
  curve: number;
  mana: number;
  interaction: number;
  threats: number;
  card_advantage: number;
  synergy: number;
  resilience: number;
}

export interface LeagueParticipant {
  id: string;
  name: string;
  format: "standard" | "brawl" | "draft" | "sandbox";
  commander: string | null;
  commander_image: string | null;
  featured_cards: string[];
  profile: LeagueProfile;
  eligibility: "intake" | "structure_valid" | "legality_verified" | "eligible" | "rejected";
  structural_issues: string[];
  legality_issues: string[];
  model_coach: string | null;
  source_name: string;
  source_url: string;
  card_count: number;
  deck_hash: string;
}

export interface LeagueStanding {
  rank: number;
  deck_id: string;
  match_wins: number;
  match_losses: number;
  game_wins: number;
  game_losses: number;
  points: number;
  buchholz: number;
}

export interface LeagueGame {
  game_id: string;
  winner_id: string;
  seed: number;
  turns: number;
}

export interface LeagueMatch {
  match_id: string;
  deck_a_id: string;
  deck_b_id: string;
  winner_id: string;
  games: LeagueGame[];
}

export interface MtgLeaguePayload {
  schema: string;
  status: "sample" | "published";
  computed_at: string;
  config: {
    league_id: string;
    format: string;
    seed: number;
    games_per_match: number;
    max_decks: number;
    rules_snapshot: string;
    card_snapshot: string;
  };
  engine: {
    name: string;
    version: string;
    evidence_class: "fixture" | "proxy" | "rules_engine" | "arena_observed";
    limitations: string[];
  };
  participants: LeagueParticipant[];
  matches: LeagueMatch[];
  standings: LeagueStanding[];
  receipt_hash: string;
}

export interface MtgIntakeCandidate {
  id: string;
  name: string;
  format: "standard" | "brawl" | "draft" | "sandbox";
  cards: Array<{ name: string; quantity: number }>;
  source_name: string;
  source_url: string;
  source_observed_at: string;
  eligibility: "intake" | "structure_valid" | "legality_verified" | "eligible" | "rejected";
  structural_issues: string[];
  legality_issues: string[];
}

export interface MtgIntakePayload {
  schema: string;
  status: "intake";
  source_payload: string;
  candidate_count: number;
  eligible_count: number;
  warnings: string[];
  candidates: MtgIntakeCandidate[];
}

export interface MtgOracleAuditPayload {
  schema: string;
  status: "audited";
  snapshot: {
    id: string;
    sha256: string;
    cache_modified_at: string;
    card_objects: number;
    network_fetch: false;
  };
  candidate_count: number;
  structure_valid_count: number;
  legality_verified_count: number;
  eligible_count: number;
  candidates: Array<{
    id: string;
    name: string;
    resolved_cards: number;
    competitivebrawl_legal_cards: number;
    issue_count: number;
    verdict:
      | "rejected_structure"
      | "held_unresolved_commander"
      | "held_unresolved_cards"
      | "rejected_legality"
      | "legality_verified";
  }>;
  limitations: string[];
}

export interface MtgForgeExportPayload {
  schema: string;
  status: "ready" | "held";
  compatible_candidate_count: number;
  verified_candidate_count: number;
  selected_deck_ids: string[];
  receipt_hash: string;
}

export interface MtgForgeMatchPayload {
  schema: string;
  status: "rules_engine_verified" | "held";
  evidence_class: "rules_engine" | "held";
  engine: { name: string; version: string; jar_sha256: string };
  deck_ids: string[];
  seed: number;
  runs: Array<{
    run: number;
    exit_code: number;
    errors: string[];
    normalized: {
      game_count: number;
      match_winner: string | null;
      match_score: Record<string, number>;
      games: Array<{ game: number; winner: string; turns: number | null }>;
    };
  }>;
  normalized_repeat: boolean;
  limitations: string[];
  receipt_hash: string;
}

/**
 * Provisional standings from the resumable Forge queue. Every field that
 * discloses incompleteness is required, not optional: a partial shard must
 * never be renderable as a finished league.
 */
export interface MtgForgeStandingsPayload {
  schema: string;
  status: "provisional";
  evidence_class: "rules_engine" | "none_until_executed";
  generated_utc: string;
  plan_receipt_hash: string;
  planned_match_count: number;
  promoted_match_count: number;
  held_match_count: number;
  unattributed_match_count: number;
  promoted_matches: string[];
  held_matches: Array<{ match_id: string; reasons: string[] }>;
  unattributed_matches: Array<{
    match_id: string;
    match_winner: string | null;
    reason: string;
  }>;
  promotion_rule: string;
  coverage_complete: boolean;
  coverage_warning: string;
  table: Array<{
    deck_id: string;
    matches: number;
    match_wins: number;
    match_losses: number;
    game_wins: number;
    game_losses: number;
    unattributed: number;
  }>;
  receipt_hash: string;
}

/**
 * Cross-seed reproducibility. Separate from standings on purpose: standings say
 * what was played, this says how much of it held up when the seed changed.
 */
export interface MtgForgeAgreementPayload {
  schema: string;
  status: "provisional";
  evidence_class: "rules_engine" | "none_until_replayed";
  generated_utc: string;
  seed_set_count: number;
  /** False until at least two seed sets have run — one agrees with itself. */
  reproducibility_proven: boolean;
  evidence_identity: {
    engine_jar_sha256: string | null;
    deck_sha256_by_id: Record<string, string>;
  };
  seed_sets: Array<{
    seed: number | null;
    plan_receipt_hash: string;
    standings_receipt_hash: string;
    planned_match_count: number;
    promoted_match_count: number;
    held_match_count: number;
    unattributed_match_count: number;
    coverage_complete: boolean;
  }>;
  pairing_count: number;
  fully_observed_pairing_count: number;
  reproducible_pairing_count: number;
  split_pairing_count: number;
  agreement_rate: number;
  /** Histogram of disagreement shapes, e.g. {"6":31,"5-1":9,"3-3":2}. */
  split_shapes: Record<string, number>;
  /** False below 4 seed sets — a bare 1-1 does not establish a coin flip. */
  coin_flip_threshold_met: boolean;
  /** Pairings whose top winner holds 50% or less. Null until the threshold. */
  coin_flip_pairing_count: number | null;
  split_pairings: string[];
  pairings: Array<{
    pairing: string;
    deck_ids: string[];
    observations: number;
    winners: Record<string, number>;
    seeds_seen: Array<number | null>;
    fully_observed: boolean;
    reproducible: boolean;
    majority_winner: string | null;
    split_shape: string;
    dominant_fraction: number;
  }>;
  table: Array<{
    deck_id: string;
    pairings: number;
    reproducible_pairings: number;
    swept: number;
    swept_against: number;
    wins_across_seeds: number;
    observations: number;
    win_rate_across_seeds: number;
  }>;
  limitations: string[];
  receipt_hash: string;
}

/**
 * Six-seed combined Brawl standings: every one of the 45 pairings replayed
 * across all six seeded round robins (270 matches total), summed per deck.
 * Additive to -forge-standings.json (single shard) and -forge-agreement.json
 * (cross-seed reproducibility, not summed records) -- this is the third,
 * independent view: "add up every receipted game this deck played."
 * status is only ever "receipted" because the builder script
 * (scripts/build-forge-combined-standings.mjs) verifies full, even coverage
 * across every deck before it will write the file at all.
 */
export interface MtgForgeCombinedMatch {
  match_id: string;
  shard: string;
  seed: number;
  executed_utc: string;
  deck_a_id: string;
  deck_b_id: string;
  winner_deck_id: string;
  loser_deck_id: string;
  game_count: number;
  games: Array<{ game: number; winner_deck_id: string; turns: number | null }>;
  game_wins: Record<string, number>;
  normalized_repeat: boolean;
  receipt_hash: string;
}

export interface MtgForgeCombinedPayload {
  schema: string;
  status: "receipted";
  evidence_class: "rules_engine";
  generated_utc: string;
  engine: { name: string; version: string; jar_sha256: string };
  seed_sets: Array<{ shard: string; seed: number; match_count: number }>;
  shard_count: number;
  planned_match_count: number;
  promoted_match_count: number;
  held_match_count: number;
  unattributed_match_count: number;
  coverage_complete: boolean;
  promotion_rule: string;
  limitations: string[];
  table: Array<{
    deck_id: string;
    matches: number;
    match_wins: number;
    match_losses: number;
    game_wins: number;
    game_losses: number;
    match_win_rate: number;
  }>;
  matches: MtgForgeCombinedMatch[];
  receipt_hash: string;
}

export function getMtgForgeCombined(): MtgForgeCombinedPayload | null {
  const file = path.join(
    process.cwd(),
    "public",
    "mtg-proving-grounds-forge-combined.json"
  );
  // Absent until the six-shard aggregation has been run; the page must
  // render without it rather than assume it exists.
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as MtgForgeCombinedPayload;
}

export function getMtgForgeAgreement(): MtgForgeAgreementPayload | null {
  const file = path.join(
    process.cwd(),
    "public",
    "mtg-proving-grounds-forge-agreement.json"
  );
  // Absent until more than one seed set has run; the page must render without it.
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as MtgForgeAgreementPayload;
}

export function getMtgForgeStandings(): MtgForgeStandingsPayload {
  const file = path.join(
    process.cwd(),
    "public",
    "mtg-proving-grounds-forge-standings.json"
  );
  return JSON.parse(fs.readFileSync(file, "utf8")) as MtgForgeStandingsPayload;
}

export function getMtgForgeCubeStandings(): MtgForgeStandingsPayload {
  const file = path.join(
    process.cwd(),
    "public",
    "mtg-proving-grounds-cube-standings.json"
  );
  return JSON.parse(fs.readFileSync(file, "utf8")) as MtgForgeStandingsPayload;
}

export function getMtgLeague(): MtgLeaguePayload {
  const file = path.join(process.cwd(), "public", "mtg-proving-grounds.json");
  return JSON.parse(fs.readFileSync(file, "utf8")) as MtgLeaguePayload;
}

export function getMtgIntake(): MtgIntakePayload {
  const file = path.join(process.cwd(), "public", "mtg-proving-grounds-intake.json");
  return JSON.parse(fs.readFileSync(file, "utf8")) as MtgIntakePayload;
}

export function getMtgOracleAudit(): MtgOracleAuditPayload {
  const file = path.join(process.cwd(), "public", "mtg-proving-grounds-oracle-audit.json");
  return JSON.parse(fs.readFileSync(file, "utf8")) as MtgOracleAuditPayload;
}

export function getMtgForgeExport(): MtgForgeExportPayload {
  const file = path.join(process.cwd(), "public", "mtg-proving-grounds-forge-export.json");
  return JSON.parse(fs.readFileSync(file, "utf8")) as MtgForgeExportPayload;
}

export function getMtgForgeMatch(): MtgForgeMatchPayload {
  const file = path.join(process.cwd(), "public", "mtg-proving-grounds-forge-match.json");
  return JSON.parse(fs.readFileSync(file, "utf8")) as MtgForgeMatchPayload;
}
