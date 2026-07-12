import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MtgWildcardCalculator } from "@/components/MtgWildcardCalculator";
import { mtgDisplay } from "@/lib/mtgFonts";

export const metadata: Metadata = {
  title: "MTG Arena Wildcard Calculator",
  description:
    "Paste an Arena decklist export and see exactly how many common/uncommon/rare/mythic wildcards you still need to build it — card rarities via Scryfall, nothing guessed.",
  alternates: { canonical: "https://play.buildkit.store/mtg/wildcards" },
};

// This page has no server-side payload dependency (client-interactive,
// Scryfall-only lookups) so a static render is fine — there's nothing here
// that changes between the metahub pipeline's own refreshes the way /mtg
// and /mtg/draft do.
export const dynamic = "force-static";

// Wizards Fan Content Policy boilerplate, kept byte-identical to
// mtg-workstation/metahub/config.py's FAN_CONTENT_BOILERPLATE. This page
// can't read it off the published payload the way /mtg and /mtg/draft do
// (no server data need here), but it's required on every /mtg page
// regardless per METAHUB-SPEC.md — a card-data page never gates on it.
const FAN_CONTENT_BOILERPLATE =
  "BuildKit MTG Meta Hub is unofficial Fan Content permitted under the Wizards of the Coast Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. (c) Wizards of the Coast LLC.";

export default function MtgWildcardsPage() {
  return (
    <main className={`min-h-screen mtg-scope ${mtgDisplay.variable}`}>
      <SiteHeader />

      <section className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass mb-4">
          Paste your decklist &middot; rarities via Scryfall &middot; nothing guessed
        </p>
        <h1 className="mtg-display text-4xl sm:text-5xl leading-tight mb-3">
          Arena Wildcard Calculator
        </h1>
        <div className="mtg-spectrum w-44 mb-5" aria-hidden />
        <p className="text-text-secondary max-w-2xl mb-8">
          Paste an Arena decklist export — Deck and Sideboard, with or
          without the (SET) code — and see exactly how many common,
          uncommon, rare, and mythic wildcards you still need. Basic lands
          are free, cards you already own zero out, and anything Scryfall
          can&rsquo;t identify is listed honestly rather than guessed at.
        </p>

        <MtgWildcardCalculator />

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
