import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Sparkles, BookOpen } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MtgSampleBanner } from "@/components/MtgSampleBanner";
import { MtgDraftRanker } from "@/components/MtgDraftRanker";
import { getMtgDraft, isSampleDraftPayload } from "@/lib/mtgDraft";
import { formatFreshness } from "@/lib/mtg";

export const metadata: Metadata = {
  title: "MTG Draft Ranker — Real 17lands Win Rates & Draft Score Grades",
  description:
    "The free, honest draft ranker: every card graded S–F from real 17lands game data with a transparent shrinkage formula, sortable/filterable and stamped with its sample size — no paywalled pick ratings.",
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
    <main className="min-h-screen">
      <div className="print:hidden">
        <SiteHeader />
      </div>

      <section className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
        <div className="flex items-center gap-2 text-cyan text-xs font-mono mb-3 print:hidden">
          <Sparkles size={14} />
          FREE, HONEST, SAMPLE-SIZE-STAMPED — NO PAYWALLED PICK RATINGS
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          MTG Draft Ranker
        </h1>
        <p className="text-text-secondary max-w-2xl mb-4 print:hidden">
          Every card graded S through F by the BuildKit Draft Score — a transparent,
          sample-size-shrunk composite computed from 17lands&rsquo; real, open PremierDraft
          game data. Sort, filter, and search live; switch sets or flip to the print-friendly
          cheat sheet for your second screen.
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary mb-6 print:hidden">
          <span className="inline-flex items-center gap-1.5 bg-surface border border-border rounded-full px-3 py-1">
            payload updated {formatFreshness(payload.computed_at)}
          </span>
          <span className="inline-flex items-center gap-1.5 bg-surface border border-border rounded-full px-3 py-1">
            {payload.sets.length} sets tracked
          </span>
        </div>

        {sample && <MtgSampleBanner />}

        {/* 17lands CC BY attribution — prominent per the licensing terms */}
        <a
          href="https://www.17lands.com/about"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 bg-cyan-dim border border-cyan/30 rounded-2xl px-5 py-3.5 mb-8 hover:border-cyan/50 transition-colors print:hidden"
        >
          <span className="text-sm">
            <span className="font-semibold text-cyan">Win rates via 17lands.com</span>{" "}
            <span className="text-text-secondary">
              public card ratings, licensed CC BY 4.0 — every row credits its source.
            </span>
          </span>
          <ExternalLink size={14} className="text-cyan shrink-0" />
        </a>

        <MtgDraftRanker sets={payload.sets} />

        <p className="text-sm text-text-secondary mt-10 mb-4 print:hidden">
          <Link href="/mtg/methodology" className="text-cyan hover:underline">
            <BookOpen size={13} className="inline -mt-0.5 mr-1" />
            Read the full MTG Meta Hub methodology &amp; attribution
          </Link>
        </p>

        <p className="text-sm text-text-secondary mb-12 print:hidden">
          <Link href="/mtg" className="text-cyan hover:underline">
            &larr; Back to the MTG Meta Hub
          </Link>
        </p>

        {/* Wizards Fan Content Policy boilerplate — every /mtg page, never gated */}
        <div className="border-t border-border pt-6">
          <p className="text-xs text-text-secondary leading-relaxed">{payload.boilerplate}</p>
        </div>
      </section>

      <div className="print:hidden">
        <SiteFooter />
      </div>
    </main>
  );
}
