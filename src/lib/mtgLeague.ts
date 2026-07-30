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

export function getMtgForgeStandings(): MtgForgeStandingsPayload {
  const file = path.join(
    process.cwd(),
    "public",
    "mtg-proving-grounds-forge-standings.json"
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
