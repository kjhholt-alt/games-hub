"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Bot,
  ChevronRight,
  FlaskConical,
  RotateCcw,
  ShieldCheck,
  Swords,
  type LucideIcon,
} from "lucide-react";
import type {
  LeagueMatch,
  LeagueParticipant,
  LeagueStanding,
  MtgLeaguePayload,
} from "@/lib/mtgLeague";

const PROFILE_LABELS: Array<[keyof LeagueParticipant["profile"], string]> = [
  ["curve", "Curve"],
  ["mana", "Mana"],
  ["interaction", "Interaction"],
  ["threats", "Threats"],
  ["card_advantage", "Cards"],
  ["synergy", "Synergy"],
  ["resilience", "Resilience"],
];

function EligibilityChip({ value }: { value: LeagueParticipant["eligibility"] }) {
  const tone =
    value === "eligible"
      ? "border-green/30 bg-green-dim text-green"
      : value === "rejected"
        ? "border-red/30 bg-red-dim text-red"
        : "border-amber/30 bg-amber-dim text-amber";
  return (
    <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide ${tone}`}>
      {value.replace("_", " ")}
    </span>
  );
}

function Record({ standing }: { standing: LeagueStanding }) {
  return (
    <span className="font-mono text-xs tabular-nums text-text-secondary">
      {standing.match_wins}-{standing.match_losses}
    </span>
  );
}

function ScoreBars({ deck }: { deck: LeagueParticipant }) {
  return (
    <div className="space-y-2">
      {PROFILE_LABELS.map(([key, label]) => (
        <div key={key} className="grid grid-cols-[78px_1fr_32px] items-center gap-2">
          <span className="font-mono text-[10px] text-text-secondary">{label}</span>
          <span className="h-1.5 overflow-hidden rounded-full bg-background">
            <span
              className="block h-full rounded-full bg-brass"
              style={{ width: `${Math.round(deck.profile[key] * 100)}%` }}
            />
          </span>
          <span className="font-mono text-[10px] tabular-nums text-foreground">
            {Math.round(deck.profile[key] * 100)}
          </span>
        </div>
      ))}
    </div>
  );
}

function MatchRow({
  match,
  participants,
}: {
  match: LeagueMatch;
  participants: Map<string, LeagueParticipant>;
}) {
  const a = participants.get(match.deck_a_id);
  const b = participants.get(match.deck_b_id);
  const aWins = match.games.filter((game) => game.winner_id === match.deck_a_id).length;
  const bWins = match.games.length - aWins;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border/70 py-3 last:border-b-0">
      <div className={match.winner_id === a?.id ? "text-foreground" : "text-text-secondary"}>
        <p className="truncate text-sm font-medium">{a?.name}</p>
        <p className="font-mono text-[9px] text-text-secondary">{a?.model_coach}</p>
      </div>
      <div className="rounded border border-border bg-background px-3 py-1 font-mono text-sm tabular-nums">
        {aWins} : {bWins}
      </div>
      <div className={`text-right ${match.winner_id === b?.id ? "text-foreground" : "text-text-secondary"}`}>
        <p className="truncate text-sm font-medium">{b?.name}</p>
        <p className="font-mono text-[9px] text-text-secondary">{b?.model_coach}</p>
      </div>
    </div>
  );
}

export function MtgLeagueObservatory({ payload }: { payload: MtgLeaguePayload }) {
  const participants = useMemo(
    () => new Map(payload.participants.map((deck) => [deck.id, deck])),
    [payload.participants]
  );
  const [selectedId, setSelectedId] = useState(payload.standings[0]?.deck_id ?? "");
  const selected = participants.get(selectedId) ?? payload.participants[0];
  const selectedStanding = payload.standings.find((row) => row.deck_id === selected.id);
  const deckMatches = payload.matches
    .filter((match) => match.deck_a_id === selected.id || match.deck_b_id === selected.id)
    .slice(0, 8);
  const summary: Array<[string, string | number, LucideIcon]> = [
    ["Seats", payload.participants.length, Swords],
    ["Matches", payload.matches.length, Activity],
    ["Coaches", new Set(payload.participants.map((deck) => deck.model_coach)).size, Bot],
    ["Evidence", payload.engine.evidence_class, FlaskConical],
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
        {summary.map(([label, value, Icon]) => (
          <div key={String(label)} className="bg-surface p-4">
            <Icon className="mb-3 h-4 w-4 text-brass" aria-hidden />
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-secondary">{label}</p>
            <p className="mt-1 text-xl font-semibold capitalize">{String(value).replace("_", " ")}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.18fr)_minmax(300px,0.82fr)]">
        <section className="overflow-hidden rounded-lg border border-border bg-surface" aria-labelledby="standings-title">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-brass">Round robin</p>
              <h2 id="standings-title" className="mtg-display text-xl">League standings</h2>
            </div>
            <span className="font-mono text-[9px] text-text-secondary">PTS / BUCHHOLZ</span>
          </div>
          <div className="max-h-[650px] overflow-y-auto">
            {payload.standings.map((standing) => {
              const deck = participants.get(standing.deck_id);
              if (!deck) return null;
              const active = deck.id === selected.id;
              return (
                <button
                  key={deck.id}
                  type="button"
                  onClick={() => setSelectedId(deck.id)}
                  className={`grid w-full grid-cols-[34px_minmax(0,1fr)_auto_54px_18px] items-center gap-3 border-b border-border/70 px-4 py-3 text-left transition-colors last:border-b-0 ${
                    active ? "bg-brass/10" : "hover:bg-white/[0.025]"
                  }`}
                >
                  <span className={`font-mono text-sm tabular-nums ${standing.rank <= 3 ? "text-brass" : "text-text-secondary"}`}>
                    {String(standing.rank).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{deck.name}</span>
                    <span className="mt-1 flex items-center gap-2">
                      <span className="truncate font-mono text-[9px] text-text-secondary">{deck.model_coach}</span>
                      <EligibilityChip value={deck.eligibility} />
                    </span>
                  </span>
                  <Record standing={standing} />
                  <span className="text-right font-mono text-xs tabular-nums">
                    <strong className="text-brass">{standing.points}</strong>
                    <span className="text-text-secondary"> / {standing.buchholz}</span>
                  </span>
                  <ChevronRight className={`h-3.5 w-3.5 ${active ? "text-brass" : "text-text-secondary"}`} />
                </button>
              );
            })}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-surface p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-brass">
                  Seat {String(selectedStanding?.rank ?? 0).padStart(2, "0")}
                </p>
                <h2 className="mtg-display mt-1 text-2xl">{selected.name}</h2>
                <p className="mt-1 font-mono text-[10px] text-text-secondary">{selected.model_coach}</p>
              </div>
              {selectedStanding && (
                <div className="rounded border border-brass/30 bg-brass/10 px-3 py-2 text-center">
                  <p className="font-mono text-[9px] uppercase text-text-secondary">Record</p>
                  <p className="font-mono text-lg text-brass">
                    {selectedStanding.match_wins}-{selectedStanding.match_losses}
                  </p>
                </div>
              )}
            </div>
            <ScoreBars deck={selected} />
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-text-secondary">
                Featured cards / identity
              </p>
              <div className="flex flex-wrap gap-2">
                {selected.featured_cards.map((card) => (
                  <span key={card} className="rounded border border-border bg-background px-2 py-1 text-xs">
                    {card}
                  </span>
                ))}
              </div>
            </div>
            {selected.structural_issues.length > 0 && (
              <div className="mt-4 rounded border border-amber/30 bg-amber-dim p-3 text-xs leading-relaxed text-amber">
                <strong>Admission hold:</strong> {selected.structural_issues.join("; ")}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-border bg-surface">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <RotateCcw className="h-3.5 w-3.5 text-brass" />
              <h2 className="mtg-display text-lg">Replay strip</h2>
            </div>
            <div className="px-4">
              {deckMatches.map((match) => (
                <MatchRow key={match.match_id} match={match} participants={participants} />
              ))}
            </div>
          </section>
        </aside>
      </div>

      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brass" />
          <div>
            <h2 className="mtg-display text-lg">What this run proves</h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-text-secondary">
              The scheduler, seeds, deck hashes, standings, model identities, and replay receipts are real and
              repeatable. The outcomes are a feature-proxy fixture—not Magic rules execution and not an Arena
              win-rate forecast. Real leaderboard claims stay locked until full decklists pass a frozen legality
              snapshot and a rules-engine or Arena-observed adapter produces the games.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
