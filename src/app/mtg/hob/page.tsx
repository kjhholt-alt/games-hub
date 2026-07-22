import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, AlertTriangle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MtgSampleBanner } from "@/components/MtgSampleBanner";
import { MtgHobTierTable } from "@/components/MtgHobTierTable";
import { MtgDraftMethodologyAccordion } from "@/components/MtgDraftMethodologyAccordion";
import { getMtgDraft } from "@/lib/mtgDraft";
import { formatFreshness, isHobUnavailable } from "@/lib/mtgDraftView";
import { mtgDisplay } from "@/lib/mtgFonts";

export const metadata: Metadata = {
  title: "MTG The Hobbit (HOB) Day-0 Intel Pack — Spoiler Season Tier List",
  description:
    "Every revealed card from The Hobbit gets a real S–F tier before Arena launch — a cross-set 17lands prior for reprints, a transparent rarity/CMC/type heuristic for new cards. The basis is always shown, never hidden behind an invented win rate.",
  alternates: { canonical: "https://play.buildkit.store/mtg/hob" },
};

// The pipeline republishes at most a few times a day; matches every other
// /mtg page's ISR window. Spoiler count updates on the next scheduled run.
export const revalidate = 3600;

export default function MtgHobPage() {
  const payload = getMtgDraft();
  const hob = payload?.hob;

  if (!payload || isHobUnavailable(hob) || !hob) {
    return (
      <main className={`min-h-screen mtg-scope ${mtgDisplay.variable}`}>
        <SiteHeader />
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h1 className="mtg-display text-3xl mb-4">The Hobbit — Day-0 Intel Pack</h1>
          <div className="flex items-start gap-3 rounded-md border border-amber/40 bg-amber-dim px-4 py-3">
            <AlertTriangle size={15} className="text-amber mt-0.5 shrink-0" />
            <p className="text-text-secondary text-sm leading-relaxed">
              No Hobbit cards have been revealed yet (or this run&rsquo;s spoiler fetch failed) —
              check back shortly. Spoiler season for HOB is expected ahead of its Arena launch on
              August 11, 2026.
            </p>
          </div>
          <p className="text-sm text-text-secondary mt-6">
            <Link href="/mtg" className="text-brass hover:text-brass-bright transition-colors">
              &larr; Back to the MTG Meta Hub
            </Link>
          </p>
        </section>
        <SiteFooter />
      </main>
    );
  }

  const sample = payload.status !== "published";
  const { cross_set_prior, heuristic } = hob.prior_summary;
  const progressPct =
    hob.spoiler_progress !== null ? Math.round(hob.spoiler_progress * 1000) / 10 : null;

  return (
    <main className={`min-h-screen mtg-scope ${mtgDisplay.variable}`}>
      <div className="print:hidden">
        <SiteHeader />
      </div>

      <section className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass mb-4 print:hidden">
          Free · every revealed card tiered · basis always shown
        </p>
        <h1 className="mtg-display text-4xl sm:text-5xl leading-tight mb-3">
          The Hobbit — Day-0 Intel Pack
        </h1>
        <div className="mtg-spectrum w-44 mb-5 print:hidden" aria-hidden />

        {/* Launch + spoiler-progress banner */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-brass border border-brass/40 bg-brass-dim rounded-md px-2.5 py-1">
            Arena launch {hob.arena_launch_date}
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-secondary border border-border rounded-md px-2.5 py-1 tabular-nums">
            {hob.revealed_count} / {hob.total_card_count} revealed
            {progressPct !== null ? ` (${progressPct}%)` : ""}
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-secondary border border-border rounded-md px-2.5 py-1">
            payload updated {formatFreshness(hob.computed_at)}
          </span>
        </div>

        {sample && <MtgSampleBanner />}

        {/* Spoiler-season callout — up front, per the honesty rails. Never a
            paraphrase — this is a short human summary; the FULL verbatim
            methodology string is in the accordion below and on the card. */}
        <div className="flex items-start gap-3 rounded-md border border-amber/40 bg-amber-dim px-4 py-3.5 mb-6">
          <AlertTriangle size={15} className="text-amber mt-0.5 shrink-0" />
          <p className="text-text-secondary text-sm leading-relaxed">
            <span className="font-semibold text-amber">
              SPOILER SEASON — these are Day-0 priors, not real Hobbit draft win rates.
            </span>{" "}
            The Hobbit launches on MTG Arena {hob.arena_launch_date}; no game has been played with
            these cards yet, so 17lands has zero telemetry for this set. Every revealed card below
            still gets a real tier: a cross-set 17lands prior for a reprinted card, or a
            transparent rarity/CMC/type heuristic for a brand-new one. The basis is always shown
            in its own column — nothing is hidden behind an invented win rate, and nothing renders
            &ldquo;unrated&rdquo;. On launch day this page is superseded by the standard Draft
            Ranker (/mtg/draft) once 17lands starts tracking real games.
          </p>
        </div>

        {/* Prior-source breakdown — the honest scoreboard for how much of
            this run is a real cross-set signal vs a heuristic guess. */}
        <div className="flex flex-wrap items-center gap-2 mb-8 font-mono text-[11px]">
          <Stat label="Cross-set prior" value={cross_set_prior} color="text-amber" />
          <Stat label="Heuristic" value={heuristic} color="text-purple" />
        </div>

        <MtgDraftMethodologyAccordion methodology={hob.methodology} />

        <MtgHobTierTable rows={hob.rows} />

        <p className="text-sm text-text-secondary mt-10 mb-3 print:hidden">
          <Link
            href="/mtg/methodology"
            className="text-brass hover:text-brass-bright transition-colors"
          >
            <BookOpen size={13} className="inline -mt-0.5 mr-1" />
            Read the full MTG Meta Hub methodology &amp; attribution
          </Link>
        </p>

        <p className="text-sm text-text-secondary mb-12 print:hidden">
          <Link href="/mtg" className="text-brass hover:text-brass-bright transition-colors">
            &larr; Back to the MTG Meta Hub
          </Link>
        </p>

        {/* Wizards Fan Content Policy boilerplate — every /mtg page, never gated */}
        <div>
          <div className="mtg-spectrum w-full opacity-50 mb-5 print:hidden" aria-hidden />
          <p className="text-xs text-text-secondary leading-relaxed">{payload.boilerplate}</p>
        </div>
      </section>

      <div className="print:hidden">
        <SiteFooter />
      </div>
    </main>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-border rounded-md px-2.5 py-1">
      <span className={`${color} tabular-nums font-semibold`}>{value}</span>
      <span className="text-text-secondary uppercase tracking-wide">{label}</span>
    </span>
  );
}
