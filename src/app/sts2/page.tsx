import type { Metadata } from "next";
import Link from "next/link";
import { Swords, RefreshCw } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Sts2TierList } from "@/components/Sts2TierList";
import { getSnapshot } from "@/lib/sts2";

export const metadata: Metadata = {
  title: "Slay the Spire 2 Tier List — Best Cards & Relics (S–D)",
  description:
    "Slay the Spire 2 tier list ranking every card and relic S to D, aggregated from the best public tier lists and kept patch-current. Filter by character.",
  alternates: { canonical: "https://play.buildkit.store/sts2" },
};

export default function Sts2Page() {
  const data = getSnapshot();

  // Top S-tier cards for the highlight strip (cards read better than relics here).
  const topCards = data.items
    .filter((i) => i.kind === "card" && i.tier === "S")
    .slice(0, 3);

  const updated = new Date(data.generatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Slay the Spire 2 Tier List",
    itemListElement: data.items
      .filter((i) => i.kind === "card")
      .slice(0, 10)
      .map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
      })),
  };

  return (
    <main className="min-h-screen">
      <SiteHeader />

      <section className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
        <div className="flex items-center gap-2 text-cyan text-xs font-mono mb-3">
          <Swords size={14} />
          AGGREGATED FROM THE BEST TIER LISTS
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          Slay the Spire 2 Tier List
        </h1>
        <p className="text-text-secondary max-w-2xl mb-4">
          Every card and relic ranked S to D, blended from{" "}
          {data.sources.length} of the best public tier lists into one
          patch-current consensus. Filter by character to plan your next run —
          no single list&rsquo;s bias, just where the community actually lands.
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary mb-10">
          <span className="inline-flex items-center gap-1.5">
            <RefreshCw size={12} className="text-green" />
            Patch {data.gamePatch ?? "current"} &middot; updated {updated}
          </span>
          <span className="inline-flex items-center gap-1.5 bg-surface border border-border rounded-full px-3 py-1">
            {data.counts.cards} cards &middot; {data.counts.relics} relics ranked
          </span>
        </div>

        {/* Quick top-3 S-tier card highlight */}
        {topCards.length > 0 && (
          <div className="grid sm:grid-cols-3 gap-4 mb-12">
            {topCards.map((it) => (
              <div
                key={it.id}
                className="bg-surface border border-border rounded-2xl p-5"
              >
                <p className="text-xs font-mono text-text-secondary mb-1">
                  S-TIER &middot; {it.character}
                </p>
                <p className="text-lg font-bold">{it.name}</p>
                <p className="text-sm text-cyan font-semibold tabular-nums">
                  {Math.round(it.score)} / 100
                </p>
              </div>
            ))}
          </div>
        )}

        <Sts2TierList data={data} />

        {/* Methodology */}
        <div className="bg-surface border border-border rounded-2xl p-6 mt-12">
          <h2 className="text-lg font-semibold mb-2">How this is ranked</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Each source list rates a card or relic on an S–F scale; those letters
            map to anchor scores (S=95, A=84, B=70, C=55, D=40), we take the
            weighted mean across {data.sources.length} high-quality public lists
            {data.sources.length > 0 ? ` (${data.sources.join(", ")})` : ""}, then
            snap the result back to the nearest tier. Aggregating multiple lists —
            rather than trusting one — smooths out any single author&rsquo;s bias,
            and the consensus dots surface picks the lists disagree on. The same
            aggregate powers the in-game 0–100 shop/reward rater in the BuildKit
            Slay the Spire 2 toolkit. It refreshes on the roughly two-week Early
            Access patch cadence
            {data.gamePatch ? ` (currently ${data.gamePatch})` : ""}.
          </p>
        </div>

        <p className="text-sm text-text-secondary mt-12">
          <Link href="/" className="text-cyan hover:underline">
            &larr; Back to BuildKit Play
          </Link>
        </p>
      </section>

      <SiteFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
