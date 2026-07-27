import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink, FileJson, ShieldAlert, Swords } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MtgLeagueObservatory } from "@/components/MtgLeagueObservatory";
import {
  getMtgForgeExport,
  getMtgForgeMatch,
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
          visibly marked <strong className="font-medium text-amber">sample / proxy</strong>. A separate pinned
          Card-Forge proof below now contains the first repeated real-rules Brawl match; it is never mixed into
          the synthetic standings.
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

        <section className="mt-6 overflow-hidden rounded-lg border border-border bg-surface" aria-labelledby="intake-title">
          <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-brass">Live source intake</p>
              <h2 id="intake-title" className="mtg-display mt-1 text-2xl">Brawl admission queue</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
                These are real decklists from Archidekt&apos;s Competitive Brawl format—not the synthetic league
                above. Structure and frozen Oracle legality are checked; all ten verified lists resolve in the
                pinned Forge archive, and the first two have passed repeatable game execution.
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
              Match-proven decks 2/{intake.candidate_count}. Frozen Oracle audit {shortSnapshot} verified{" "}
              {audit.legality_verified_count} real Competitive Brawl lists; {auditHeld} are rejected or held.
              Forge resolves {forgeExport.compatible_candidate_count}/{forgeExport.verified_candidate_count}{" "}
              verified lists without substitutions. Only the two decks in the repeated receipt have
              rules-engine evidence; no proxy result can promote the rest.
            </p>
          </div>
        </section>

        <div className="mt-10">
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
