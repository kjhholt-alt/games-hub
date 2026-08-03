import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, ExternalLink, FileJson, ShieldAlert, Swords, Microscope } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MtgLeagueObservatory } from "@/components/MtgLeagueObservatory";
import {
  cubeDeckName,
  getMtgCubeSealedCombined,
  getMtgForgeAgreement,
  getMtgForgeCombined,
  getMtgForgeCubeStandings,
  getMtgForgeExport,
  getMtgForgeMatch,
  getMtgForgeStandings,
  getMtgIntake,
  getMtgLeague,
  getMtgOracleAudit,
} from "@/lib/mtgLeague";
import { mtgDisplay } from "@/lib/mtgFonts";

export const metadata: Metadata = {
  title: "MTG Proving Grounds — Model League Observatory",
  description:
    "A reproducible MTG deck lab where bounded local model coaches submit candidates and trusted evaluators publish replayable match receipts.",
  alternates: { canonical: "https://play.buildkit.store/mtg/league" },
};

export const revalidate = 3600;

export default function MtgLeaguePage() {
  const payload = getMtgLeague();
  const intake = getMtgIntake();
  const audit = getMtgOracleAudit();
  const forgeExport = getMtgForgeExport();
  const forgeMatch = getMtgForgeMatch();
  const shortReceipt = payload.receipt_hash.slice(0, 12);
  const shortSnapshot = audit.snapshot.sha256.slice(0, 12);
  const structureValid = intake.candidates.filter(
    (candidate) => candidate.eligibility === "structure_valid"
  ).length;
  const rejected = intake.candidates.filter(
    (candidate) => candidate.eligibility === "rejected"
  ).length;
  const auditHeld = audit.candidate_count - audit.legality_verified_count;
  const auditById = new Map(audit.candidates.map((candidate) => [candidate.id, candidate]));
  const engineGames = forgeMatch.runs[0]?.normalized.games ?? [];
  const uginWins = engineGames.filter((game) => game.winner.includes("Ugin")).length;
  const lightPawsWins = engineGames.length - uginWins;

  const standings = getMtgForgeStandings();
  const nameByDeckId = new Map(
    intake.candidates.map((candidate) => [candidate.id, candidate.name])
  );
  const sourceByDeckId = new Map(
    intake.candidates.map((candidate) => [candidate.id, candidate.source_url])
  );
  // Decks that have played a promoted match, out of the ten admitted.
  const shardDeckCount = standings.table.length;
  // The queue runs in plan order, so an unfinished shard covers some decks far
  // more than others. Saying so is the difference between a partial table and a
  // misleading one.
  const agreement = getMtgForgeAgreement();
  const combined = getMtgForgeCombined();
  const cubeStandings = getMtgForgeCubeStandings();
  const cubeCombined = getMtgCubeSealedCombined();
  const matchesPlayed = standings.table.map((row) => row.matches);
  const shardIsUneven =
    matchesPlayed.length > 1 &&
    Math.max(...matchesPlayed) > Math.min(...matchesPlayed);

  return (
    <main className={`min-h-screen mtg-scope ${mtgDisplay.variable}`}>
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/mtg"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-text-secondary transition-colors hover:text-brass"
          >
            <ArrowLeft className="h-3 w-3" />
            Meta Hub
          </Link>
          <a
            href="/mtg-proving-grounds.json"
            className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 font-mono text-[10px] text-text-secondary transition-colors hover:border-brass/40 hover:text-foreground"
          >
            <FileJson className="h-3 w-3" />
            receipt {shortReceipt}
          </a>
        </div>

        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-brass">
          Models propose · trusted gates admit · receipts decide
        </p>
        <h1 className="mtg-display mb-3 text-4xl leading-tight sm:text-5xl">Proving Grounds</h1>
        <div className="mtg-spectrum mb-5 w-52" aria-hidden />
        <p className="mb-4 max-w-3xl text-lg text-foreground/90">
          A model-coached deck league built to show its work.
        </p>
        <p className="mb-8 max-w-3xl text-sm leading-relaxed text-text-secondary">
          Twenty deck candidates enter a seeded round robin. Qwen coaches can rank and tune candidates, but
          trusted code owns legality, scheduling, evaluation, and every replayable receipt. This first run is
          visibly marked <strong className="font-medium text-amber">sample / proxy</strong>. Below it, pinned
          Card-Forge has now executed{" "}
          <strong className="font-medium text-green">
            {standings.promoted_match_count} of {standings.planned_match_count}
          </strong>{" "}
          real-rules Brawl matches, each reproduced twice
          {standings.coverage_complete ? " — the full round robin" : ""}. Those receipts are scored separately
          and are never mixed into the synthetic standings.{" "}
          <strong className="font-medium text-amber">This sample stays sample permanently, by design</strong>:
          its twenty fixture participants aren&rsquo;t the ten real decks Forge plays, so no volume of real
          receipts could ever honestly cover this specific standings table — relabeling it would be exactly the
          fabrication this league refuses to do. The real, receipted evidence lives in the sections below
          instead.
        </p>

        <div className="mb-8 flex flex-wrap gap-2 font-mono text-[10px]">
          <span className="rounded border border-amber/30 bg-amber-dim px-2.5 py-1 uppercase text-amber">
            {payload.status}
          </span>
          <span className="rounded border border-border px-2.5 py-1 text-text-secondary">
            {payload.config.league_id}
          </span>
          <span className="rounded border border-border px-2.5 py-1 text-text-secondary">
            seed {payload.config.seed}
          </span>
          <span className="rounded border border-border px-2.5 py-1 text-text-secondary">
            {payload.engine.name} v{payload.engine.version}
          </span>
        </div>

        <MtgLeagueObservatory payload={payload} />

        <section
          className="mt-6 overflow-hidden rounded-lg border border-green/30 bg-surface"
          aria-labelledby="forge-proof-title"
        >
          <div className="grid gap-px bg-border lg:grid-cols-[1.15fr_0.85fr]">
            <div className="bg-surface p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-green" aria-hidden />
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-green">
                    First rules-engine proof
                  </p>
                  <h2 id="forge-proof-title" className="mtg-display mt-1 text-2xl">
                    Ugin defeats Light-Paws, 2–1
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
                    Card-Forge executed the same seeded best-of-three twice. Both runs reproduced the same
                    winners and turn counts with exit code 0 and no tracked import or game exceptions.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded border border-border bg-border">
                {engineGames.map((game) => (
                  <div key={game.game} className="bg-background px-3 py-3 text-center">
                    <p className="font-mono text-[9px] uppercase text-text-secondary">Game {game.game}</p>
                    <p className="mt-1 text-sm font-medium">{game.winner.includes("Ugin") ? "Ugin" : "Light-Paws"}</p>
                    <p className="mt-1 font-mono text-[9px] text-brass">turn {game.turns}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-surface p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Swords className="h-4 w-4 text-brass" aria-hidden />
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-brass">Trust receipt</p>
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-text-secondary">Evidence</dt>
                  <dd className="font-mono text-green">rules engine verified</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-secondary">Repeat</dt>
                  <dd className="font-mono">{forgeMatch.normalized_repeat ? "2 / 2 exact" : "held"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-secondary">Score</dt>
                  <dd className="font-mono">{uginWins}–{lightPawsWins}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-secondary">Compatible decks</dt>
                  <dd className="font-mono">
                    {forgeExport.compatible_candidate_count}/{forgeExport.verified_candidate_count}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-secondary">Seed</dt>
                  <dd className="font-mono">{forgeMatch.seed}</dd>
                </div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href="/mtg-proving-grounds-forge-match.json"
                  className="inline-flex items-center gap-1.5 rounded border border-green/30 px-2.5 py-1.5 font-mono text-[10px] text-green"
                >
                  <FileJson className="h-3 w-3" /> match receipt
                </a>
                <a
                  href="/mtg-proving-grounds-forge-export.json"
                  className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 font-mono text-[10px] text-text-secondary"
                >
                  <FileJson className="h-3 w-3" /> import audit
                </a>
              </div>
            </div>
          </div>
        </section>

        <section
          className="mt-6 overflow-hidden rounded-lg border border-green/30 bg-surface"
          aria-labelledby="forge-standings-title"
        >
          <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-green">
                Rules-engine standings ·{" "}
                {standings.coverage_complete ? "complete round robin" : "partial shard"}
              </p>
              <h2 id="forge-standings-title" className="mtg-display mt-1 text-2xl">
                {standings.promoted_match_count} of {standings.planned_match_count} queued matches executed
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
                Real Card-Forge games between pinned Competitive Brawl lists, each played twice on a fixed seed
                and promoted only when both runs normalized identically. This table is scored from those
                receipts alone and never mixes with the synthetic standings above.{" "}
                {standings.coverage_complete
                  ? `Every deck has now played all ${standings.table.length - 1} of its opponents.`
                  : `It is a shard of the ${standings.planned_match_count}-match round robin, not a finished league.`}
              </p>
            </div>
            <a
              href="/mtg-proving-grounds-forge-standings.json"
              className="inline-flex shrink-0 items-center gap-1.5 rounded border border-green/30 px-2.5 py-1.5 font-mono text-[10px] text-green transition-colors hover:border-green/60"
            >
              <FileJson className="h-3 w-3" />
              standings {standings.receipt_hash.slice(0, 12)}
            </a>
          </div>

          <div className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-4">
            {[
              ["Promoted", standings.promoted_match_count],
              ["Held", standings.held_match_count],
              ["Unattributed", standings.unattributed_match_count],
              ["Decks ranked", shardDeckCount],
            ].map(([label, value]) => (
              <div key={String(label)} className="bg-surface px-4 py-3">
                <p className="font-mono text-[9px] uppercase tracking-wide text-text-secondary">{label}</p>
                <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          <div className="hidden gap-3 border-b border-border px-4 py-2 font-mono text-[9px] uppercase tracking-wide text-text-secondary sm:grid sm:grid-cols-[34px_minmax(0,1fr)_70px_86px_86px]">
            <span>#</span>
            <span>Deck</span>
            <span className="text-right">Matches</span>
            <span className="text-right">Match W–L</span>
            <span className="text-right">Game W–L</span>
          </div>
          <div className="divide-y divide-border/70">
            {standings.table.map((row, index) => {
              const source = sourceByDeckId.get(row.deck_id);
              return (
                <div
                  key={row.deck_id}
                  className="grid gap-2 px-4 py-3 sm:grid-cols-[34px_minmax(0,1fr)_70px_86px_86px] sm:items-center sm:gap-3"
                >
                  <span className="hidden font-mono text-xs tabular-nums text-text-secondary sm:block">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    {source ? (
                      <a
                        href={source}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-sm font-medium transition-colors hover:text-brass"
                      >
                        {nameByDeckId.get(row.deck_id) ?? row.deck_id}
                      </a>
                    ) : (
                      <span className="truncate text-sm font-medium">
                        {nameByDeckId.get(row.deck_id) ?? row.deck_id}
                      </span>
                    )}
                    <p className="mt-0.5 truncate font-mono text-[9px] text-text-secondary">{row.deck_id}</p>
                  </div>
                  <span className="font-mono text-[10px] tabular-nums text-text-secondary sm:text-right">
                    {row.matches}
                  </span>
                  {combined ? (
                    <Link
                      href={`/mtg/league/receipts/${row.deck_id}`}
                      className="group font-mono text-[10px] tabular-nums sm:text-right"
                      title="Open receipt drill-down"
                    >
                      <span className="text-green group-hover:underline">{row.match_wins}</span>
                      <span className="text-text-secondary group-hover:underline">–{row.match_losses}</span>
                    </Link>
                  ) : (
                    <span className="font-mono text-[10px] tabular-nums sm:text-right">
                      <span className="text-green">{row.match_wins}</span>
                      <span className="text-text-secondary">–{row.match_losses}</span>
                    </span>
                  )}
                  <span className="font-mono text-[10px] tabular-nums sm:text-right">
                    <span className="text-foreground">{row.game_wins}</span>
                    <span className="text-text-secondary">–{row.game_losses}</span>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-start gap-3 border-t border-border bg-amber-dim p-4 text-xs leading-relaxed text-amber">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              {standings.coverage_warning} {standings.promotion_rule}
              {combined
                ? ` Every score in this shard links to a receipt drill-down (click the Match W–L column) with the full six-seed combined history.`
                : ""}
              {shardIsUneven
                ? ` Matches are drawn in plan order, so decks here have played between ${Math.min(
                    ...matchesPlayed
                  )} and ${Math.max(
                    ...matchesPlayed
                  )} of them. Rows are ordered by match win rate, not raw wins, so a deck is not promoted for
                  simply having played more — but a rate over one or two matches is not a win-rate claim, and
                  none of this is a metagame reading until the round robin completes.`
                : ""}
              {standings.held_match_count > 0
                ? ` ${standings.held_match_count} match(es) are held and score nothing: ${standings.held_matches
                    .map((match) => `${match.match_id} (${match.reasons.join(", ")})`)
                    .join("; ")}.`
                : ""}
              {standings.unattributed_match_count > 0
                ? ` ${standings.unattributed_match_count} promoted match(es) could not be tied to a seat and were credited to nobody.`
                : ""}
            </p>
          </div>
        </section>

        {combined ? (
          <section
            className="mt-6 overflow-hidden rounded-lg border border-green/40 bg-surface"
            aria-labelledby="forge-combined-title"
          >
            <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-green">
                  Six-seed combined · {combined.status}
                </p>
                <h2 id="forge-combined-title" className="mtg-display mt-1 text-2xl">
                  {combined.promoted_match_count} of {combined.planned_match_count} matches receipted across{" "}
                  {combined.shard_count} seeds
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
                  The shard above is one seeded round robin. This sums every deck&rsquo;s receipted games across
                  all {combined.shard_count} independently-seeded round robins run so far (
                  {combined.seed_sets.map((s) => s.seed).join(", ")}) — {combined.promoted_match_count} real
                  Card-Forge matches, each reproduced twice before counting. Coverage is even and complete, so
                  this table is the only one on this page whose status reads{" "}
                  <strong className="font-medium text-green">receipted</strong> rather than provisional or
                  sample. Click any score to open that deck&rsquo;s full receipt drill-down.
                </p>
              </div>
              <a
                href="/mtg-proving-grounds-forge-combined.json"
                className="inline-flex shrink-0 items-center gap-1.5 rounded border border-green/40 px-2.5 py-1.5 font-mono text-[10px] text-green transition-colors hover:border-green/70"
              >
                <FileJson className="h-3 w-3" />
                combined {combined.receipt_hash.slice(0, 12)}
              </a>
            </div>

            <div className="hidden gap-3 border-b border-border px-4 py-2 font-mono text-[9px] uppercase tracking-wide text-text-secondary sm:grid sm:grid-cols-[34px_minmax(0,1fr)_70px_86px_86px]">
              <span>#</span>
              <span>Deck</span>
              <span className="text-right">Matches</span>
              <span className="text-right">Match W–L</span>
              <span className="text-right">Game W–L</span>
            </div>
            <div className="divide-y divide-border/70">
              {combined.table.map((row, index) => (
                <div
                  key={row.deck_id}
                  className="grid gap-2 px-4 py-3 sm:grid-cols-[34px_minmax(0,1fr)_70px_86px_86px] sm:items-center sm:gap-3"
                >
                  <span className="hidden font-mono text-xs tabular-nums text-text-secondary sm:block">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Link
                    href={`/mtg/league/receipts/${row.deck_id}`}
                    className="min-w-0 truncate text-sm font-medium transition-colors hover:text-brass"
                  >
                    {nameByDeckId.get(row.deck_id) ?? row.deck_id}
                    <span className="ml-1.5 inline-flex align-middle">
                      <Microscope className="h-3 w-3 text-text-secondary" aria-hidden />
                    </span>
                  </Link>
                  <span className="font-mono text-[10px] tabular-nums text-text-secondary sm:text-right">
                    {row.matches}
                  </span>
                  <Link
                    href={`/mtg/league/receipts/${row.deck_id}`}
                    className="group font-mono text-[10px] tabular-nums sm:text-right"
                    title="Open receipt drill-down"
                  >
                    <span className="text-green group-hover:underline">{row.match_wins}</span>
                    <span className="text-text-secondary group-hover:underline">–{row.match_losses}</span>
                  </Link>
                  <span className="font-mono text-[10px] tabular-nums sm:text-right">
                    <span className="text-foreground">{row.game_wins}</span>
                    <span className="text-text-secondary">–{row.game_losses}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 border-t border-border bg-amber-dim p-4 text-xs leading-relaxed text-amber">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>{combined.limitations.join(" ")}</p>
            </div>
          </section>
        ) : null}

        <section
          className="mt-6 overflow-hidden rounded-lg border border-brass/30 bg-surface"
          aria-labelledby="numbers-differ-title"
        >
          <div className="p-5 sm:p-6">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-brass">Why these numbers are different</p>
            <h2 id="numbers-differ-title" className="mtg-display mt-1 text-xl">
              Three kinds of evidence on this page, never mixed
            </h2>
            <dl className="mt-4 space-y-3 text-sm leading-relaxed text-text-secondary">
              <div>
                <dt className="font-medium text-foreground">Engine-receipted (the standings above)</dt>
                <dd>
                  Real Card-Forge rules-engine matches we ran ourselves, twice each, on a pinned engine jar and
                  pinned decklists. Every score traces to a receipt hash you can open — that&rsquo;s what the
                  drill-down links go to. Small, honest sample; zero guessing.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Crowd telemetry (what we don&rsquo;t have)</dt>
                <dd>
                  Sites like untapped.gg compute win rates from aggregated real-player match telemetry at a
                  scale we can&rsquo;t reproduce — thousands of live Arena games a day. We have zero player-match
                  telemetry and won&rsquo;t publish a win-rate number at that scale we can&rsquo;t back with a
                  receipt, so none of the numbers above claim to be that.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Externals (cite-only)</dt>
                <dd>
                  untapped.gg, MTGGoldfish, EDHREC, and similar trackers are linked by name wherever they have
                  real telemetry we don&rsquo;t — never scraped, never re-hosted as our own numbers. See{" "}
                  <Link href="/mtg/methodology#us-vs-untapped" className="text-brass hover:text-brass-bright">
                    Us vs. untapped.gg
                  </Link>{" "}
                  for the full comparison.
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {agreement &&
        agreement.reproducibility_proven &&
        agreement.fully_observed_pairing_count > 0 ? (
          <section
            className="mt-6 overflow-hidden rounded-lg border border-brass/30 bg-surface"
            aria-labelledby="forge-agreement-title"
          >
            <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-brass">
                  Reproducibility · {agreement.seed_set_count} seed sets
                </p>
                <h2 id="forge-agreement-title" className="mtg-display mt-1 text-2xl">
                  {agreement.reproducible_pairing_count} of {agreement.fully_observed_pairing_count} pairings
                  gave the same winner every time
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
                  The standings above say what was <em>played</em>. This says what <em>reproduced</em>. The same{" "}
                  {agreement.pairing_count} pairings were replayed under {agreement.seed_set_count} different seed
                  sets — {agreement.seed_sets.reduce((n, s) => n + s.promoted_match_count, 0)} promoted matches in
                  all — and a pairing counts as reproducible only when every seed set credited the same deck.
                  Split pairings are the interesting result, not a defect, so they are named below with the shape
                  of the disagreement.
                </p>
              </div>
              <a
                href="/mtg-proving-grounds-forge-agreement.json"
                className="inline-flex shrink-0 items-center gap-1.5 rounded border border-brass/30 px-2.5 py-1.5 font-mono text-[10px] text-brass transition-colors hover:border-brass/60"
              >
                <FileJson className="h-3 w-3" />
                agreement {agreement.receipt_hash.slice(0, 12)}
              </a>
            </div>

            <div className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-4">
              {[
                ["Agreement", `${Math.round(agreement.agreement_rate * 100)}%`],
                ["Reproducible", agreement.reproducible_pairing_count],
                ["Seed-sensitive", agreement.split_pairing_count],
                // Only claimed once there are enough seed sets to tell a 3-3
                // from a 5-1; before that the slot shows the sample instead.
                agreement.coin_flip_threshold_met
                  ? ["Coin flips", agreement.coin_flip_pairing_count ?? 0]
                  : ["Seed sets", agreement.seed_set_count],
              ].map(([label, value]) => (
                <div key={String(label)} className="bg-surface px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-wide text-text-secondary">{label}</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>

            <div className="hidden gap-3 border-b border-border px-4 py-2 font-mono text-[9px] uppercase tracking-wide text-text-secondary sm:grid sm:grid-cols-[34px_minmax(0,1fr)_78px_78px_84px]">
              <span>#</span>
              <span>Deck</span>
              <span className="text-right">Swept</span>
              <span className="text-right">Swept vs</span>
              <span className="text-right">Seed wins</span>
            </div>
            <div className="divide-y divide-border/70">
              {agreement.table.map((row, index) => (
                <div
                  key={row.deck_id}
                  className="grid gap-2 px-4 py-3 sm:grid-cols-[34px_minmax(0,1fr)_78px_78px_84px] sm:items-center sm:gap-3"
                >
                  <span className="hidden font-mono text-xs tabular-nums text-text-secondary sm:block">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    {combined ? (
                      <Link
                        href={`/mtg/league/receipts/${row.deck_id}`}
                        className="truncate text-sm font-medium transition-colors hover:text-brass"
                      >
                        {nameByDeckId.get(row.deck_id) ?? row.deck_id}
                      </Link>
                    ) : (
                      <span className="truncate text-sm font-medium">
                        {nameByDeckId.get(row.deck_id) ?? row.deck_id}
                      </span>
                    )}
                    <p className="mt-0.5 truncate font-mono text-[9px] text-text-secondary">
                      {row.reproducible_pairings}/{row.pairings} pairings reproduced
                    </p>
                  </div>
                  <span className="font-mono text-[10px] tabular-nums text-green sm:text-right">
                    {row.swept}
                  </span>
                  <span className="font-mono text-[10px] tabular-nums text-text-secondary sm:text-right">
                    {row.swept_against}
                  </span>
                  <span className="font-mono text-[10px] tabular-nums sm:text-right">
                    {row.wins_across_seeds}
                    <span className="text-text-secondary"> / {row.observations}</span>
                  </span>
                </div>
              ))}
            </div>

            {agreement.split_pairing_count > 0 ? (
              <div className="border-t border-border px-4 py-3">
                <p className="font-mono text-[9px] uppercase tracking-wide text-brass">
                  Seed-sensitive pairings — the same two decks, different winners
                </p>
                <p className="mt-1 font-mono text-[9px] text-text-secondary">
                  shapes:{" "}
                  {Object.entries(agreement.split_shapes)
                    .map(([shape, count]) => `${shape} ×${count}`)
                    .join("  ·  ")}
                </p>
                <ul className="mt-2 space-y-1">
                  {agreement.pairings
                    .filter((row) => row.fully_observed && !row.reproducible)
                    .sort((a, b) => a.dominant_fraction - b.dominant_fraction)
                    .map((row) => (
                      <li key={row.pairing} className="font-mono text-[10px] text-text-secondary">
                        <span
                          className={
                            agreement.coin_flip_threshold_met &&
                            row.dominant_fraction <= 0.5
                              ? "text-red"
                              : "text-amber"
                          }
                        >
                          {row.split_shape}
                        </span>{" "}
                        {/* The counts already name both decks, so listing the
                            pairing separately just repeats them. Separator is a
                            middot because several deck names contain em dashes. */}
                        {Object.entries(row.winners)
                          .sort((a, b) => b[1] - a[1])
                          .map(([id, count]) => `${nameByDeckId.get(id) ?? id} ${count}`)
                          .join("  ·  ")}
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}

            <div className="flex items-start gap-3 border-t border-border bg-amber-dim p-4 text-xs leading-relaxed text-amber">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>{agreement.limitations.join(" ")}</p>
            </div>
          </section>
        ) : null}

        <section
          className="mt-6 overflow-hidden rounded-lg border border-green/30 bg-surface"
          aria-labelledby="cube-standings-title"
        >
          <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-green">
                Planar Cube · Sealed rules-engine proof
              </p>
              <h2 id="cube-standings-title" className="mtg-display mt-1 text-2xl">
                {cubeStandings.promoted_match_count} of {cubeStandings.planned_match_count} Cube matches promoted
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
                Ten two-color shells built from the live Cube pool played one complete Forge Sealed round robin.
                Every match ran twice with the same normalized result before promotion. This verifies the export,
                card compatibility, and match pipeline; it does not simulate drafting decisions.
              </p>
            </div>
            <a
              href="/mtg-proving-grounds-cube-standings.json"
              className="inline-flex shrink-0 items-center gap-1.5 rounded border border-green/30 px-2.5 py-1.5 font-mono text-[10px] text-green transition-colors hover:border-green/60"
            >
              <FileJson className="h-3 w-3" />
              Cube standings {cubeStandings.receipt_hash.slice(0, 12)}
            </a>
          </div>

          <div className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-4">
            {[
              ["Promoted", cubeStandings.promoted_match_count],
              ["Held", cubeStandings.held_match_count],
              ["Unattributed", cubeStandings.unattributed_match_count],
              ["Decks", cubeStandings.table.length],
            ].map(([label, value]) => (
              <div key={String(label)} className="bg-surface px-4 py-3">
                <p className="font-mono text-[9px] uppercase tracking-wide text-text-secondary">{label}</p>
                <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          <div className="hidden gap-3 border-b border-border px-4 py-2 font-mono text-[9px] uppercase tracking-wide text-text-secondary sm:grid sm:grid-cols-[34px_minmax(0,1fr)_92px_92px]">
            <span>#</span>
            <span>Guild shell</span>
            <span className="text-right">Matches</span>
            <span className="text-right">Games</span>
          </div>
          <div className="divide-y divide-border/70">
            {cubeStandings.table.map((row, index) => (
              <div
                key={row.deck_id}
                className="grid gap-2 px-4 py-3 sm:grid-cols-[34px_minmax(0,1fr)_92px_92px] sm:items-center sm:gap-3"
              >
                <span className="hidden font-mono text-xs tabular-nums text-text-secondary sm:block">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="truncate text-sm font-medium">{cubeDeckName(row.deck_id)}</span>
                <span className="font-mono text-[10px] tabular-nums sm:text-right">
                  {row.match_wins}-{row.match_losses}
                </span>
                <span className="font-mono text-[10px] tabular-nums text-text-secondary sm:text-right">
                  {row.game_wins}-{row.game_losses}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-3 border-t border-border bg-amber-dim p-4 text-xs leading-relaxed text-amber">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              One seeded Forge round robin is an engine experiment, not an Arena Cube tier list. Deck AI quality
              and the fixed guild-shell construction both influence these records.
            </p>
          </div>
        </section>

        {cubeCombined ? (
          <section
            className="mt-6 overflow-hidden rounded-lg border border-green/40 bg-surface"
            aria-labelledby="cube-combined-title"
          >
            <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-green">
                  Six-seed combined · Cube Sealed · {cubeCombined.status}
                </p>
                <h2 id="cube-combined-title" className="mtg-display mt-1 text-2xl">
                  {cubeCombined.promoted_match_count} of {cubeCombined.planned_match_count} Cube matches receipted
                  across {cubeCombined.shard_count} seeds
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
                  The Cube shard above is one seeded Sealed round robin. This sums every guild shell&rsquo;s
                  receipted games across all {cubeCombined.shard_count} independently-seeded round robins run so
                  far ({cubeCombined.seed_sets.map((s) => s.seed).join(", ")}) —{" "}
                  {cubeCombined.promoted_match_count} real Card-Forge Sealed matches, each reproduced twice before
                  counting. Coverage is even and complete, so this table reads{" "}
                  <strong className="font-medium text-green">receipted</strong> rather than provisional or sample.
                  Click any score to open that shell&rsquo;s full receipt drill-down.
                </p>
              </div>
              <a
                href="/mtg-proving-grounds-cube-sealed-combined.json"
                className="inline-flex shrink-0 items-center gap-1.5 rounded border border-green/40 px-2.5 py-1.5 font-mono text-[10px] text-green transition-colors hover:border-green/70"
              >
                <FileJson className="h-3 w-3" />
                combined {cubeCombined.receipt_hash.slice(0, 12)}
              </a>
            </div>

            <div className="hidden gap-3 border-b border-border px-4 py-2 font-mono text-[9px] uppercase tracking-wide text-text-secondary sm:grid sm:grid-cols-[34px_minmax(0,1fr)_70px_86px_86px]">
              <span>#</span>
              <span>Guild shell</span>
              <span className="text-right">Matches</span>
              <span className="text-right">Match W–L</span>
              <span className="text-right">Game W–L</span>
            </div>
            <div className="divide-y divide-border/70">
              {cubeCombined.table.map((row, index) => (
                <div
                  key={row.deck_id}
                  className="grid gap-2 px-4 py-3 sm:grid-cols-[34px_minmax(0,1fr)_70px_86px_86px] sm:items-center sm:gap-3"
                >
                  <span className="hidden font-mono text-xs tabular-nums text-text-secondary sm:block">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Link
                    href={`/mtg/league/receipts/${row.deck_id}`}
                    className="min-w-0 truncate text-sm font-medium transition-colors hover:text-brass"
                  >
                    {cubeDeckName(row.deck_id)}
                    <span className="ml-1.5 inline-flex align-middle">
                      <Microscope className="h-3 w-3 text-text-secondary" aria-hidden />
                    </span>
                  </Link>
                  <span className="font-mono text-[10px] tabular-nums text-text-secondary sm:text-right">
                    {row.matches}
                  </span>
                  <Link
                    href={`/mtg/league/receipts/${row.deck_id}`}
                    className="group font-mono text-[10px] tabular-nums sm:text-right"
                    title="Open receipt drill-down"
                  >
                    <span className="text-green group-hover:underline">{row.match_wins}</span>
                    <span className="text-text-secondary group-hover:underline">–{row.match_losses}</span>
                  </Link>
                  <span className="font-mono text-[10px] tabular-nums sm:text-right">
                    <span className="text-foreground">{row.game_wins}</span>
                    <span className="text-text-secondary">–{row.game_losses}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 border-t border-border bg-amber-dim p-4 text-xs leading-relaxed text-amber">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>{cubeCombined.limitations.join(" ")}</p>
            </div>
          </section>
        ) : null}

        <section className="mt-6 overflow-hidden rounded-lg border border-border bg-surface" aria-labelledby="intake-title">
          <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-brass">Live source intake</p>
              <h2 id="intake-title" className="mtg-display mt-1 text-2xl">Brawl admission queue</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
                These are real decklists from Archidekt&apos;s Competitive Brawl format—not the synthetic league
                above. Structure and frozen Oracle legality are checked; all ten verified lists resolve in the
                pinned Forge archive, and {shardDeckCount} have now passed repeatable game execution.
              </p>
            </div>
            <a
              href="/mtg-proving-grounds-intake.json"
              className="inline-flex shrink-0 items-center gap-1.5 rounded border border-border px-2.5 py-1.5 font-mono text-[10px] text-text-secondary transition-colors hover:border-brass/40 hover:text-foreground"
            >
              <FileJson className="h-3 w-3" />
              source receipt
            </a>
          </div>
          <div className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-4">
            {[
              ["Sourced", intake.candidate_count],
              ["Structure valid", structureValid],
              ["Structure rejected", rejected],
              ["Legality verified", audit.legality_verified_count],
            ].map(([label, value]) => (
              <div key={String(label)} className="bg-surface px-4 py-3">
                <p className="font-mono text-[9px] uppercase tracking-wide text-text-secondary">{label}</p>
                <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
          <div className="divide-y divide-border/70">
            {intake.candidates.map((candidate, index) => {
              const cardCount = candidate.cards.reduce((total, card) => total + card.quantity, 0);
              const auditResult = auditById.get(candidate.id);
              const verdict = auditResult?.verdict ?? "held_unresolved_cards";
              const verified = verdict === "legality_verified";
              return (
                <div
                  key={candidate.id}
                  className="grid gap-2 px-4 py-3 sm:grid-cols-[34px_minmax(0,1fr)_86px_118px_22px] sm:items-center sm:gap-3"
                >
                  <span className="hidden font-mono text-xs tabular-nums text-text-secondary sm:block">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <a
                      href={candidate.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-sm font-medium transition-colors hover:text-brass"
                    >
                      {candidate.name}
                    </a>
                    <p className="mt-0.5 truncate font-mono text-[9px] text-text-secondary">
                      {candidate.source_name}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] tabular-nums text-text-secondary">{cardCount} cards</span>
                  <span
                    className={`w-fit rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide ${
                      verified
                        ? "border-amber/30 bg-amber-dim text-amber"
                        : "border-red/30 bg-red-dim text-red"
                    }`}
                  >
                    {verdict.replaceAll("_", " ")}
                  </span>
                  <ExternalLink className="hidden h-3.5 w-3.5 text-text-secondary sm:block" aria-hidden />
                </div>
              );
            })}
          </div>
          <div className="flex items-start gap-3 border-t border-border bg-amber-dim p-4 text-xs leading-relaxed text-amber">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              Match-proven decks {shardDeckCount}/{intake.candidate_count}. Frozen Oracle audit {shortSnapshot}{" "}
              verified {audit.legality_verified_count} real Competitive Brawl lists; {auditHeld} are rejected or
              held. Forge resolves {forgeExport.compatible_candidate_count}/
              {forgeExport.verified_candidate_count} verified lists without substitutions. Only decks appearing
              in a promoted receipt have rules-engine evidence; no proxy result can promote the rest.
            </p>
          </div>
        </section>

        <p className="mt-10 text-sm text-text-secondary">
          <Link
            href="/mtg/methodology"
            className="inline-flex items-center gap-1 text-brass hover:text-brass-bright transition-colors"
          >
            <BookOpen size={13} className="inline -mt-0.5 mr-1" />
            Read the full MTG Meta Hub methodology &amp; attribution
          </Link>
        </p>

        <div className="mt-6">
          <div className="mtg-spectrum mb-5 w-full opacity-60" aria-hidden />
          <p className="text-xs leading-relaxed text-text-secondary">
            Magic: The Gathering is © Wizards of the Coast. BuildKit is unofficial Fan Content permitted under
            the Wizards Fan Content Policy. Not approved or endorsed by Wizards.
          </p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
