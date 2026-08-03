import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileJson, ShieldAlert } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  cubeDeckName,
  getMtgCubeSealedCombined,
  getMtgForgeCombined,
  getMtgIntake,
  type MtgForgeCombinedMatch,
} from "@/lib/mtgLeague";
import { mtgDisplay } from "@/lib/mtgFonts";

// Same republish cadence as the league page this drills down from.
export const revalidate = 3600;

// The combined payloads only ever cover exactly the six Forge-admitted Brawl
// decks and the ten Forge-admitted Cube guild shells; a deck id outside both
// sets 404s rather than rendering an empty shell that looks like a hidden
// receipt.
export const dynamicParams = false;

export function generateStaticParams() {
  const combined = getMtgForgeCombined();
  const cubeCombined = getMtgCubeSealedCombined();
  return [
    ...(combined?.table.map((row) => ({ deckId: row.deck_id })) ?? []),
    ...(cubeCombined?.table.map((row) => ({ deckId: row.deck_id })) ?? []),
  ];
}

// Brawl and Cube deck ids never overlap (Cube ids are always "cube-*"), so a
// deck id resolves to exactly one of the two combined payloads.
function findRow(deckId: string) {
  const combined = getMtgForgeCombined();
  if (combined) {
    const row = combined.table.find((r) => r.deck_id === deckId);
    if (row) return { combined, row, kind: "brawl" as const };
  }

  const cubeCombined = getMtgCubeSealedCombined();
  if (cubeCombined) {
    const row = cubeCombined.table.find((r) => r.deck_id === deckId);
    if (row) return { combined: cubeCombined, row, kind: "cube" as const };
  }

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ deckId: string }>;
}): Promise<Metadata> {
  const { deckId } = await params;
  const found = findRow(deckId);
  if (!found) return { title: "Receipt not found" };
  const name =
    found.kind === "cube"
      ? cubeDeckName(deckId)
      : getMtgIntake().candidates.find((c) => c.id === deckId)?.name ?? deckId;
  const formatLabel = found.kind === "cube" ? "Cube Sealed" : "Brawl";
  return {
    title: `${name} — ${formatLabel} receipt drill-down`,
    description: `Every Card-Forge ${formatLabel} match ${name} played across all six receipted seed shards, with a per-match receipt hash and per-game result.`,
    alternates: {
      canonical: `https://play.buildkit.store/mtg/league/receipts/${deckId}`,
    },
  };
}

function opponentOf(match: MtgForgeCombinedMatch, deckId: string) {
  return match.deck_a_id === deckId ? match.deck_b_id : match.deck_a_id;
}

export default async function MtgLeagueReceiptPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;
  const found = findRow(deckId);
  if (!found) notFound();
  const { combined, row, kind } = found;
  const isCube = kind === "cube";

  const intake = getMtgIntake();
  const nameByDeckId = new Map(intake.candidates.map((c) => [c.id, c.name]));
  const sourceByDeckId = new Map(intake.candidates.map((c) => [c.id, c.source_url]));
  const deckName = isCube ? cubeDeckName(deckId) : nameByDeckId.get(deckId) ?? deckId;
  const deckSource = isCube ? undefined : sourceByDeckId.get(deckId);
  const formatLabel = isCube ? "Cube Sealed" : "Brawl";
  const jsonHref = isCube
    ? "/mtg-proving-grounds-cube-sealed-combined.json"
    : "/mtg-proving-grounds-forge-combined.json";

  const matches = combined.matches
    .filter((m) => m.deck_a_id === deckId || m.deck_b_id === deckId)
    .sort((a, b) => a.shard.localeCompare(b.shard) || a.match_id.localeCompare(b.match_id));

  return (
    <main className={`min-h-screen mtg-scope ${mtgDisplay.variable}`}>
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <Link
          href="/mtg/league"
          className="mb-5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-text-secondary transition-colors hover:text-brass"
        >
          <ArrowLeft className="h-3 w-3" />
          Proving Grounds
        </Link>

        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-brass">
          Receipt drill-down · six-seed combined · {formatLabel}
        </p>
        <h1 className="mtg-display mb-3 text-3xl leading-tight sm:text-4xl">{deckName}</h1>
        {deckSource ? (
          <a
            href={deckSource}
            target="_blank"
            rel="noreferrer"
            className="mb-6 inline-flex items-center gap-1 text-sm text-brass hover:text-brass-bright transition-colors"
          >
            Source decklist <ExternalLink size={12} />
          </a>
        ) : null}

        <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-4">
          {[
            ["Matches", row.matches],
            ["Match W-L", `${row.match_wins}-${row.match_losses}`],
            ["Game W-L", `${row.game_wins}-${row.game_losses}`],
            ["Win rate", `${Math.round(row.match_win_rate * 100)}%`],
          ].map(([label, value]) => (
            <div key={String(label)} className="bg-surface px-4 py-3">
              <p className="font-mono text-[9px] uppercase tracking-wide text-text-secondary">{label}</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        <p className="mb-4 max-w-2xl text-sm leading-relaxed text-text-secondary">
          Every match this deck played across all {combined.shard_count} receipted seed shards ({combined.promoted_match_count} total matches league-wide), each reproduced twice on pinned Card-Forge before promotion. The receipt hash is the exact record this row traces back to — nothing here is re-derived or estimated.
        </p>

        <div className="overflow-hidden rounded-lg border border-green/30 bg-surface">
          <div className="hidden gap-3 border-b border-border bg-border/40 px-4 py-2 font-mono text-[9px] uppercase tracking-wide text-text-secondary sm:grid sm:grid-cols-[1fr_90px_70px_90px_1fr]">
            <span>Opponent</span>
            <span>Shard</span>
            <span className="text-right">Result</span>
            <span className="text-right">Games</span>
            <span className="text-right">Receipt</span>
          </div>
          <div className="divide-y divide-border/70">
            {matches.map((match) => {
              const opponentId = opponentOf(match, deckId);
              const won = match.winner_deck_id === deckId;
              return (
                <div
                  key={match.match_id}
                  className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_90px_70px_90px_1fr] sm:items-center"
                >
                  <span className="truncate text-sm font-medium">
                    {isCube ? cubeDeckName(opponentId) : nameByDeckId.get(opponentId) ?? opponentId}
                  </span>
                  <span className="font-mono text-[10px] text-text-secondary">
                    {match.shard} · {match.seed}
                  </span>
                  <span
                    className={`font-mono text-[10px] font-medium sm:text-right ${
                      won ? "text-green" : "text-text-secondary"
                    }`}
                  >
                    {won ? "WIN" : "LOSS"}
                  </span>
                  <span className="font-mono text-[10px] tabular-nums text-text-secondary sm:text-right">
                    {match.games.map((g) => (g.winner_deck_id === deckId ? "W" : "L")).join("")}
                    {" · "}
                    {match.games.map((g) => g.turns ?? "?").join("/")}t
                  </span>
                  <span className="truncate font-mono text-[9px] text-text-secondary sm:text-right">
                    {match.receipt_hash.slice(0, 12)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-amber-dim p-4 text-xs leading-relaxed text-amber">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            {combined.limitations.join(" ")}
          </p>
        </div>

        <a
          href={jsonHref}
          className="mt-4 inline-flex items-center gap-1.5 rounded border border-green/30 px-2.5 py-1.5 font-mono text-[10px] text-green transition-colors hover:border-green/60"
        >
          <FileJson className="h-3 w-3" />
          full combined receipt {combined.receipt_hash.slice(0, 12)}
        </a>
      </section>
      <SiteFooter />
    </main>
  );
}
