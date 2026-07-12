import Link from "next/link";
import {
  Trophy,
  Radio,
  BookOpen,
  ArrowRight,
  Gamepad2,
  Tag,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TierBadge } from "@/components/TierBadge";
import { Provenance } from "@/components/Provenance";
import { buildTierList, fetchHeroStats } from "@/lib/deadlock";
import { getNewsFeed } from "@/lib/news";
import { formatFreshness } from "@/lib/format";
import { networkDisplay } from "@/lib/fonts";
import snapshot from "@/data/deadlock-snapshot.json";
import type { DeadlockTierList, RankedHero } from "@/lib/deadlock";

export const revalidate = 3600;

async function getHeroSnapshot(): Promise<{
  heroes: RankedHero[];
  live: boolean;
  generatedAt: string;
}> {
  try {
    const raw = await fetchHeroStats();
    const list = buildTierList(raw);
    return { heroes: list.heroes.slice(0, 5), live: true, generatedAt: list.generatedAt };
  } catch {
    const list = snapshot as DeadlockTierList;
    return { heroes: list.heroes.slice(0, 5), live: false, generatedAt: list.generatedAt };
  }
}

export default async function HomePage() {
  const [heroSnapshot, news] = await Promise.all([
    getHeroSnapshot(),
    Promise.resolve(getNewsFeed(3)),
  ]);
  const { heroes: topHeroes, live, generatedAt } = heroSnapshot;

  return (
    <main className={`min-h-screen ${networkDisplay.variable}`}>
      <SiteHeader />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 sm:pt-24 sm:pb-16 text-center">
        <div className="inline-flex items-center gap-2 text-cyan text-xs font-mono mb-5">
          <Gamepad2 size={13} />
          BUILDKIT PLAY
        </div>
        <h1 className="network-display text-4xl sm:text-6xl tracking-tight mb-5">
          Game meta, decided by{" "}
          <span className="text-cyan">real data</span>.
        </h1>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto mb-8">
          Auto-updated tier lists from live win rates, hands-on game guides, and
          a radar for what gaming and AI communities are talking about — all in
          one place.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/tier-lists"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan text-background font-semibold rounded-lg text-sm hover:bg-cyan/90 transition-colors"
          >
            <Trophy size={15} />
            Deadlock Tier List
          </Link>
          <Link
            href="/news"
            className="inline-flex items-center gap-2 px-6 py-3 bg-surface border border-border font-semibold rounded-lg text-sm hover:border-foreground/20 transition-colors"
          >
            <Radio size={15} />
            News Radar
          </Link>
        </div>
      </section>

      {/* Feature cards — the thesis IS live data, so each card carries its stamp */}
      <section className="max-w-5xl mx-auto px-6 grid md:grid-cols-3 gap-5">
        {/* Live tier list preview */}
        <Link
          href="/tier-lists"
          className="group md:col-span-2 bg-surface border border-border rounded-lg p-6 hover:border-foreground/15 transition-colors flex flex-col"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-text-secondary mb-4">
            <Trophy size={14} className="text-cyan" />
            DEADLOCK TIER LIST
          </div>
          <ol className="space-y-2 mb-4 flex-1">
            {topHeroes.map((hero, i) => (
              <li
                key={hero.id}
                className="flex items-center gap-3 text-sm"
              >
                <span className="text-text-secondary tabular-nums w-4">
                  {i + 1}
                </span>
                <TierBadge letter={hero.tier} />
                <span className="font-medium flex-1">{hero.name}</span>
                <span className="text-cyan font-semibold tabular-nums">
                  {hero.winRate.toFixed(1)}%
                </span>
              </li>
            ))}
          </ol>
          <div className="flex items-end justify-between gap-4 pt-3 border-t border-border/60">
            <Provenance
              status={live ? "live" : "cached"}
              freshness={formatFreshness(generatedAt)}
              attribution="deadlock-api.com"
            />
            <span className="text-cyan text-sm flex items-center gap-1 group-hover:gap-2 transition-all shrink-0">
              Full ranking <ArrowRight size={14} />
            </span>
          </div>
        </Link>

        {/* News preview */}
        <Link
          href="/news"
          className="group bg-surface border border-border rounded-lg p-6 hover:border-foreground/15 transition-colors flex flex-col"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-text-secondary mb-4">
            <Radio size={14} className="text-cyan" />
            NEWS RADAR
          </div>
          <ul className="space-y-3 mb-4 flex-1">
            {news.items.length > 0 ? (
              news.items.map((item, i) => (
                <li key={i} className="text-sm leading-snug line-clamp-2">
                  {item.entity && (
                    <span className="text-cyan font-medium">
                      {item.entity}:{" "}
                    </span>
                  )}
                  {item.title}
                </li>
              ))
            ) : (
              <li className="text-sm text-text-secondary">
                Trending gaming &amp; AI topics, updated daily.
              </li>
            )}
          </ul>
          <div className="flex items-end justify-between gap-4 pt-3 border-t border-border/60">
            <Provenance
              status="signal"
              freshness={
                news.generatedUtc ? formatFreshness(news.generatedUtc) : undefined
              }
            />
            <span className="text-cyan text-sm flex items-center gap-1 group-hover:gap-2 transition-all shrink-0">
              Open <ArrowRight size={14} />
            </span>
          </div>
        </Link>
      </section>

      {/* Network strip */}
      <section className="max-w-5xl mx-auto px-6 mt-12">
        <div className="grid sm:grid-cols-2 gap-5">
          <a
            href="https://pcbottleneck.buildkit.store"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-surface border border-border rounded-lg p-6 hover:border-foreground/15 transition-colors"
          >
            <div className="flex items-center gap-2 text-xs font-mono text-text-secondary mb-2">
              <BookOpen size={14} />
              BUILDKIT NETWORK
            </div>
            <h3 className="font-semibold group-hover:text-cyan transition-colors">
              PC Bottleneck Analyzer
            </h3>
            <p className="text-sm text-text-secondary mt-1">
              Free hardware analysis — find your bottleneck and the smartest
              upgrade, ranked from real benchmarks.
            </p>
          </a>
          <a
            href="https://buildkit.store/go/deals?src=buildkit-play-home"
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="group bg-surface border border-border rounded-lg p-6 hover:border-foreground/15 transition-colors"
          >
            <div className="flex items-center gap-2 text-xs font-mono text-text-secondary mb-2">
              <Tag size={14} />
              BUILDKIT NETWORK
            </div>
            <h3 className="font-semibold group-hover:text-cyan transition-colors">
              GambaTime Game Deals
            </h3>
            <p className="text-sm text-text-secondary mt-1">
              Current PC game offers with direct storefront links and transparent
              affiliate disclosure.
            </p>
          </a>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
