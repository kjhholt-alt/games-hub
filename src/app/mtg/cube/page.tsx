import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, BookOpen, AlertTriangle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MtgSampleBanner } from "@/components/MtgSampleBanner";
import { MtgCubeTierTable } from "@/components/MtgCubeTierTable";
import { MtgDraftMethodologyAccordion } from "@/components/MtgDraftMethodologyAccordion";
import { getMtgDraft } from "@/lib/mtgDraft";
import { formatFreshness, isCubeUnavailable } from "@/lib/mtgDraftView";
import { mtgDisplay } from "@/lib/mtgFonts";

export const metadata: Metadata = {
  title: "MTG Planar Cube Tier List — Day-1 Priors, Honestly Labeled",
  description:
    "Every card in MTG Arena's new Planar Cube Draft pool gets a real S–F tier — from real 17lands data when it exists, a Powered Cube or cross-set prior, or a transparent rarity/CMC/type heuristic. The basis is always shown, never hidden behind an invented win rate.",
  alternates: { canonical: "https://play.buildkit.store/mtg/cube" },
};

// The pipeline republishes at most a few times a day; matches every other
// /mtg page's ISR window.
export const revalidate = 3600;

export default function MtgCubePage() {
  const payload = getMtgDraft();
  const cube = payload?.cube;

  if (!payload || isCubeUnavailable(cube) || !cube) {
    return (
      <main className={`min-h-screen mtg-scope ${mtgDisplay.variable}`}>
        <SiteHeader />
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h1 className="mtg-display text-3xl mb-4">MTG Planar Cube Tier List</h1>
          <div className="flex items-start gap-3 rounded-md border border-amber/40 bg-amber-dim px-4 py-3">
            <AlertTriangle size={15} className="text-amber mt-0.5 shrink-0" />
            <p className="text-text-secondary text-sm leading-relaxed">
              Planar Cube data is unavailable right now — the pool ingest may not have run yet
              for this week&rsquo;s module. Check back shortly.
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
  const { live_planar_cube, powered_cube_prior, cross_set_prior, heuristic } = cube.prior_summary;

  return (
    <main className={`min-h-screen mtg-scope ${mtgDisplay.variable}`}>
      <div className="print:hidden">
        <SiteHeader />
      </div>

      <section className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass mb-4 print:hidden">
          Free · every card tiered · basis always shown
        </p>
        <h1 className="mtg-display text-4xl sm:text-5xl leading-tight mb-3">
          Planar Cube Tier List
        </h1>
        <div className="mtg-spectrum w-44 mb-5 print:hidden" aria-hidden />

        {/* Week banner */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-brass border border-brass/40 bg-brass-dim rounded-md px-2.5 py-1">
            {cube.week_label || "Current week"}
          </span>
          {cube.week_start && cube.week_end && (
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-secondary border border-border rounded-md px-2.5 py-1">
              {cube.week_start} – {cube.week_end}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-secondary border border-border rounded-md px-2.5 py-1 tabular-nums">
            {cube.core_count} core + {cube.module_count} module = {cube.rows.length} cards
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-secondary border border-border rounded-md px-2.5 py-1">
            payload updated {formatFreshness(cube.computed_at)}
          </span>
        </div>

        {sample && <MtgSampleBanner />}

        {/* Day-1 priors callout — up front, per the honesty rails. Never a
            paraphrase — this is a short human summary; the FULL verbatim
            methodology string is in the accordion below and on the card. */}
        <div className="flex items-start gap-3 rounded-md border border-amber/40 bg-amber-dim px-4 py-3.5 mb-6">
          <AlertTriangle size={15} className="text-amber mt-0.5 shrink-0" />
          <p className="text-text-secondary text-sm leading-relaxed">
            <span className="font-semibold text-amber">These are Day-1 priors, not real Planar Cube win rates.</span>{" "}
            Planar Cube Draft launched on Arena today — 17lands has no per-card telemetry for it
            yet. Every card below still gets a real tier, graded by the best signal available: real
            live Planar Cube data when it exists, a Powered Cube or cross-set 17lands prior, or a
            transparent rarity/CMC/type heuristic when neither has data. The basis is always shown
            in its own column — nothing is hidden behind an invented win rate, and nothing renders
            &ldquo;unrated&rdquo;.
          </p>
        </div>

        {/* Prior-source breakdown — the honest scoreboard for how much of
            this run is real signal vs a heuristic guess. */}
        <div className="flex flex-wrap items-center gap-2 mb-8 font-mono text-[11px]">
          <Stat label="Live Planar Cube" value={live_planar_cube} color="text-green" />
          <Stat label="Powered Cube prior" value={powered_cube_prior} color="text-brass" />
          <Stat label="Cross-set prior" value={cross_set_prior} color="text-amber" />
          <Stat label="Heuristic" value={heuristic} color="text-purple" />
        </div>

        {cube.source_url && (
          <a
            href={cube.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 border border-brass/40 bg-brass-dim rounded-lg px-5 py-3.5 mb-8 hover:border-brass/70 transition-colors print:hidden"
          >
            <span className="text-sm">
              <span className="font-semibold text-brass">Card pool via Wizards of the Coast</span>{" "}
              <span className="text-text-secondary">
                the official Planar Cube Draft announcement article — the source of every card in this pool.
              </span>
            </span>
            <ExternalLink size={14} className="text-brass shrink-0" />
          </a>
        )}

        <MtgDraftMethodologyAccordion methodology={cube.methodology} />

        <MtgCubeTierTable rows={cube.rows} />

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
