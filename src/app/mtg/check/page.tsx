import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MtgDeckChecker } from "@/components/MtgDeckChecker";
import { mtgDisplay } from "@/lib/mtgFonts";

export const metadata: Metadata = {
  title: "MTG Deck Checker — Per-Card Tier & Basis, Honestly Labeled",
  description:
    "Paste an Arena decklist export and see every card's real tier against the live Planar Cube pool and published format tier data — the basis is always shown, and cards with no rating render honestly uncovered rather than an invented score.",
  alternates: { canonical: "https://play.buildkit.store/mtg/check" },
};

// No server-side payload dependency — the checker fetches the already-
// published /mtg-draft.json static file client-side (same idiom as
// /mtg/wildcards' force-static shell around a client-interactive tool).
export const dynamic = "force-static";

// Wizards Fan Content Policy boilerplate, kept byte-identical to
// mtg-workstation/metahub/config.py's FAN_CONTENT_BOILERPLATE — required on
// every /mtg page per METAHUB-SPEC.md, never gated behind a data fetch.
const FAN_CONTENT_BOILERPLATE =
  "BuildKit MTG Meta Hub is unofficial Fan Content permitted under the Wizards of the Coast Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. (c) Wizards of the Coast LLC.";

export default function MtgCheckPage() {
  return (
    <main className={`min-h-screen mtg-scope ${mtgDisplay.variable}`}>
      <SiteHeader />

      <section className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass mb-4">
          Paste your decklist &middot; matched against the live Cube pool &middot; basis always shown
        </p>
        <h1 className="mtg-display text-4xl sm:text-5xl leading-tight mb-3">
          Deck Checker
        </h1>
        <div className="mtg-spectrum w-44 mb-5" aria-hidden />
        <p className="text-text-secondary max-w-2xl mb-8">
          Paste an Arena decklist export — Deck and Sideboard, with or
          without the (SET) code — and every card gets checked against this
          week&rsquo;s Planar Cube tier list, falling back to published Draft
          Ranker/HOB tier data when a card isn&rsquo;t in the Cube pool.
          Every graded row shows its basis; a card with no rating anywhere
          renders honestly uncovered instead of a guessed score.
        </p>

        <MtgDeckChecker />

        <p className="text-sm text-text-secondary mt-10 mb-3">
          <Link
            href="/mtg"
            className="text-brass hover:text-brass-bright transition-colors"
          >
            &larr; Back to the MTG Meta Hub
          </Link>
        </p>

        {/* Wizards Fan Content Policy boilerplate — every /mtg page, never gated */}
        <div>
          <div className="mtg-spectrum w-full opacity-50 mb-5" aria-hidden />
          <p className="text-xs text-text-secondary leading-relaxed">
            {FAN_CONTENT_BOILERPLATE}
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
