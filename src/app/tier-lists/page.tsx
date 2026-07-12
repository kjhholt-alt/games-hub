import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, AlertTriangle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { HeroTierList } from "@/components/HeroTierList";
import { Provenance } from "@/components/Provenance";
import { formatFreshness } from "@/lib/format";
import { networkDisplay } from "@/lib/fonts";
import {
  buildTierList,
  fetchHeroStats,
  type DeadlockTierList,
} from "@/lib/deadlock";
import snapshot from "@/data/deadlock-snapshot.json";

export const metadata: Metadata = {
  title: "Deadlock Hero Tier List — Best Heroes This Patch (Live)",
  description:
    "Live Deadlock hero tier list ranked S to D from real win-rate data. Auto-updated from the open deadlock-api. See the strongest heroes this patch.",
  alternates: { canonical: "https://play.buildkit.store/tier-lists" },
};

// Rebuild the page from fresh stats at most once an hour (ISR).
export const revalidate = 3600;

/**
 * Pull live hero stats and compute the tier list. If the API is unreachable at
 * build/revalidate time, fall back to a vendored snapshot so the page always
 * renders real (if slightly stale) data instead of failing.
 */
async function getTierList(): Promise<{
  data: DeadlockTierList;
  live: boolean;
}> {
  try {
    const raw = await fetchHeroStats();
    return { data: buildTierList(raw), live: true };
  } catch (err) {
    console.warn(
      "[tier-lists] live fetch failed, using snapshot:",
      (err as Error).message
    );
    return { data: snapshot as DeadlockTierList, live: false };
  }
}

export default async function TierListsPage() {
  const { data, live } = await getTierList();
  const top = data.heroes.slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Deadlock Hero Tier List",
    itemListElement: data.heroes.slice(0, 10).map((h, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: h.name,
    })),
  };

  return (
    <main className={`min-h-screen ${networkDisplay.variable}`}>
      <SiteHeader />

      <section className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
        <div className="flex items-center gap-2 text-cyan text-xs font-mono mb-3">
          <Trophy size={14} />
          RANKED FROM REAL WIN-RATE DATA
        </div>
        <h1 className="network-display text-3xl sm:text-4xl tracking-tight mb-3">
          Deadlock Hero Tier List
        </h1>
        <p className="text-text-secondary max-w-2xl mb-4">
          Every hero ranked S to D by real win rate across{" "}
          {data.totalMatches.toLocaleString("en-US")} ranked matches, pulled
          live from the open deadlock-api. No opinions, no bias — just what is
          actually winning this patch.
        </p>

        <div className="mb-10">
          <Provenance
            status={live ? "live" : "cached"}
            freshness={formatFreshness(data.generatedAt)}
            note={`${data.heroes.length} heroes · ${data.totalMatches.toLocaleString("en-US")} matches`}
            attribution="deadlock-api.com"
          />
        </div>

        {/* Quick top-3 highlight */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {top.map((hero, i) => (
            <div
              key={hero.id}
              className="bg-surface border border-border rounded-lg p-5"
            >
              <p className="text-xs font-mono text-text-secondary mb-1">
                #{i + 1} this patch
              </p>
              <p className="text-lg font-bold">{hero.name}</p>
              <p className="text-sm text-cyan font-semibold tabular-nums">
                {hero.winRate.toFixed(1)}% win rate
              </p>
            </div>
          ))}
        </div>

        <HeroTierList data={data} />

        {/* Methodology */}
        <div className="bg-surface border border-border rounded-lg p-6 mt-12">
          <h2 className="network-display text-lg mb-2">How this is ranked</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Heroes are scored purely on win rate from the open, free{" "}
            <a
              href="https://deadlock-api.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan hover:underline"
            >
              deadlock-api.com
            </a>{" "}
            (MIT, the same post-match data you see in the game). Tier cuts: S at
            53%+, A at 51%+, B at 49.5%+, C at 48%+, otherwise D. Heroes with too
            few matches to be meaningful are dropped. The list rebuilds
            automatically as the meta shifts — refresh after a balance patch.
          </p>
        </div>

        {!live && (
          <div className="flex items-start gap-2 text-xs text-amber mt-4">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>
              Showing the most recent cached snapshot — the live API was
              unreachable when this page was last built. It will refresh on the
              next successful rebuild.
            </span>
          </div>
        )}

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
