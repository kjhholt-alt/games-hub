import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, BookOpen } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MtgSampleBanner } from "@/components/MtgSampleBanner";
import { MtgDraftRanker } from "@/components/MtgDraftRanker";
import { getMtgDraft, isSampleDraftPayload } from "@/lib/mtgDraft";
import { formatFreshness } from "@/lib/mtg";
import { mtgDisplay } from "@/lib/mtgFonts";

export const metadata: Metadata = {
  title: "MTG Draft Ranker — Real 17lands Win Rates & Draft Score Grades",
  description:
    "The free, honest draft ranker: every card in the set graded S–F, never 'unrated' — real 17lands game data with a transparent shrinkage formula where the sample supports it, a cross-set prior or heuristic where it doesn't, basis always shown, no paywalled pick ratings.",
  alternates: { canonical: "https://play.buildkit.store/mtg/draft" },
};

// The pipeline republishes at most a few times a day; an hourly ISR window
// keeps this static-friendly between refreshes, same as /mtg.
export const revalidate = 3600;

export default function MtgDraftPage() {
  const payload = getMtgDraft();

  if (!payload) {
    return (
      <main className="min-h-screen">
        <SiteHeader />
        <section className="max-w-5xl mx-auto px-6 py-16">
          <p className="text-text-secondary">
            Draft Ranker data is unavailable right now — check back shortly.
          </p>
        </section>
        <SiteFooter />
      </main>
    );
  }

  const sample = isSampleDraftPayload(payload);

  return (
    <main className={`min-h-screen mtg-scope ${mtgDisplay.variable}`}>
      <div className="print:hidden">
        <SiteHeader />
      </div>

      <section className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass mb-4 print:hidden">
          Free · every card graded · basis always shown
        </p>
        <h1 className="mtg-display text-4xl sm:text-5xl leading-tight mb-3">
          MTG Draft Ranker
        </h1>
        <div className="mtg-spectrum w-44 mb-5 print:hidden" aria-hidden />
        <p className="text-text-secondary max-w-2xl mb-5 print:hidden">
          Every card in the set graded S through F by the BuildKit Draft Score — never
          &ldquo;unrated&rdquo;. Real, open 17lands PremierDraft game data with a transparent
          sample-size-shrunk formula where the sample supports it; a cross-set 17lands prior or a
          transparent rarity/CMC/type heuristic where it doesn&rsquo;t, always labeled in its own
          Basis column. Sort, filter, and search live; switch sets or flip to the print-friendly
          cheat sheet for your second screen.
        </p>

        <div className="flex flex-wrap items-center gap-2 mb-6 print:hidden">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-secondary border border-border rounded-md px-2.5 py-1">
            payload updated {formatFreshness(payload.computed_at)}
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-secondary border border-border rounded-md px-2.5 py-1 tabular-nums">
            {payload.sets.length} sets tracked
          </span>
        </div>

        {sample && <MtgSampleBanner />}

        {/* 17lands CC BY attribution — prominent per the licensing terms */}
        <a
          href="https://www.17lands.com/about"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 border border-brass/40 bg-brass-dim rounded-lg px-5 py-3.5 mb-8 hover:border-brass/70 transition-colors print:hidden"
        >
          <span className="text-sm">
            <span className="font-semibold text-brass">Win rates via 17lands.com</span>{" "}
            <span className="text-text-secondary">
              public card ratings, licensed CC BY 4.0 — every row credits its source.
            </span>
          </span>
          <ExternalLink size={14} className="text-brass shrink-0" />
        </a>

        <MtgDraftRanker sets={payload.sets} />

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
          <Link
            href="/mtg"
            className="text-brass hover:text-brass-bright transition-colors"
          >
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
