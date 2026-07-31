import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, BookOpen } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MtgSampleBanner } from "@/components/MtgSampleBanner";
import { MtgCubeTrainer } from "@/components/MtgCubeTrainer";
import { getMtgDraft } from "@/lib/mtgDraft";
import { isCubeUnavailable } from "@/lib/mtgDraftView";
import { PACK_SIZE } from "@/lib/mtgCubeTrainer";
import { mtgDisplay } from "@/lib/mtgFonts";

const BASE_DESCRIPTION =
  "Free P1P1 pick trainer for MTG Arena's Planar Cube Draft: a random pack dealt straight from our live tiered cube pool, weighted by rarity. Pick blind, then see our real S–F tier and basis for every card in the pack — no invented win rates, no backend, no saved history.";

export async function generateMetadata(): Promise<Metadata> {
  const payload = getMtgDraft();
  const cube = payload?.cube;
  const weekLabel = cube && !isCubeUnavailable(cube) ? cube.week_label : null;

  const title = weekLabel
    ? `MTG Planar Cube P1P1 Trainer — ${weekLabel}`
    : "MTG Planar Cube P1P1 Trainer";
  const description = weekLabel ? `${weekLabel}. ${BASE_DESCRIPTION}` : BASE_DESCRIPTION;

  return {
    title,
    description,
    alternates: { canonical: "https://play.buildkit.store/mtg/cube/trainer" },
  };
}

// Same republish cadence as /mtg/cube — the pool it deals packs from.
export const revalidate = 3600;

export default function MtgCubeTrainerPage() {
  const payload = getMtgDraft();
  const cube = payload?.cube;

  if (!payload || isCubeUnavailable(cube) || !cube) {
    return (
      <main className={`min-h-screen mtg-scope ${mtgDisplay.variable}`}>
        <SiteHeader />
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h1 className="mtg-display text-3xl mb-4">MTG Planar Cube P1P1 Trainer</h1>
          <div className="flex items-start gap-3 rounded-md border border-amber/40 bg-amber-dim px-4 py-3">
            <AlertTriangle size={15} className="text-amber mt-0.5 shrink-0" />
            <p className="text-text-secondary text-sm leading-relaxed">
              Planar Cube data is unavailable right now — the pool ingest may not have run yet
              for this week&rsquo;s module. Check back shortly.
            </p>
          </div>
          <p className="text-sm text-text-secondary mt-6">
            <Link href="/mtg/cube" className="text-brass hover:text-brass-bright transition-colors">
              &larr; Back to the Planar Cube Tier List
            </Link>
          </p>
        </section>
        <SiteFooter />
      </main>
    );
  }

  const sample = payload.status !== "published";

  return (
    <main className={`min-h-screen mtg-scope ${mtgDisplay.variable}`}>
      <div className="print:hidden">
        <SiteHeader />
      </div>

      <section className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass mb-4 print:hidden">
          Free · pack 1 pick 1 · basis always shown
        </p>
        <h1 className="mtg-display text-4xl sm:text-5xl leading-tight mb-3">
          Planar Cube P1P1 Trainer
        </h1>
        <div className="mtg-spectrum w-44 mb-5 print:hidden" aria-hidden />
        <p className="text-text-secondary max-w-2xl mb-5 print:hidden">
          A {PACK_SIZE}-card pack, dealt at random and weighted by rarity from{" "}
          {cube.week_label || "this week's"} live Planar Cube pool. Pick the card you&rsquo;d
          first-pick, then see our real S&ndash;F tier and basis label for every card in the pack
          — same honest grading as the{" "}
          <Link href="/mtg/cube" className="text-brass hover:text-brass-bright transition-colors">
            full tier list
          </Link>
          , never an invented win rate. Your streak lives only in this tab; nothing is saved or
          sent anywhere.
        </p>

        {sample && <MtgSampleBanner />}

        <MtgCubeTrainer rows={cube.rows} />

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
          <Link href="/mtg/cube" className="text-brass hover:text-brass-bright transition-colors">
            &larr; Back to the Planar Cube Tier List
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
