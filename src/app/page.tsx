import Link from "next/link";
import {
  Trophy,
  Radio,
  BookOpen,
  ArrowRight,
  Gamepad2,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TierBadge } from "@/components/TierBadge";
import { buildTierList, fetchHeroStats } from "@/lib/deadlock";
import { getNewsFeed } from "@/lib/news";
import snapshot from "@/data/deadlock-snapshot.json";
import type { DeadlockTierList } from "@/lib/deadlock";

export const revalidate = 3600;

async function getTopHeroes() {
  try {
    const raw = await fetchHeroStats();
    return buildTierList(raw).heroes.slice(0, 5);
  } catch {
    return (snapshot as DeadlockTierList).heroes.slice(0, 5);
  }
}

export default async function HomePage() {
  const [topHeroes, news] = await Promise.all([
    getTopHeroes(),
    Promise.resolve(getNewsFeed(3)),
  ]);

  return (
    <main className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 sm:pt-24 sm:pb-16 text-center">
        <div className="inline-flex items-center gap-2 text-cyan text-xs font-mono mb-5 bg-cyan-dim border border-cyan/20 rounded-full px-3 py-1.5">
          <Gamepad2 size={13} />
          BUILDKIT PLAY
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-5">
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
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan text-background font-semibold rounded-xl text-sm hover:bg-cyan/90 transition-colors"
          >
            <Trophy size={15} />
            Deadlock Tier List
          </Link>
          <Link
            href="/news"
            className="inline-flex items-center gap-2 px-6 py-3 bg-surface border border-border font-semibold rounded-xl text-sm hover:border-cyan/40 transition-colors"
          >
            <Radio size={15} />
            News Radar
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-5xl mx-auto px-6 grid md:grid-cols-3 gap-5">
        {/* Live tier list preview */}
        <Link
          href="/tier-lists"
          className="group md:col-span-2 bg-surface border border-border rounded-2xl p-6 hover:border-cyan/40 transition-colors"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-text-secondary mb-4">
            <Trophy size={14} className="text-cyan" />
            LIVE DEADLOCK TIER LIST
          </div>
          <ol className="space-y-2 mb-4">
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
          <span className="text-cyan text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
            See the full S–D ranking <ArrowRight size={14} />
          </span>
        </Link>

        {/* News preview */}
        <Link
          href="/news"
          className="group bg-surface border border-border rounded-2xl p-6 hover:border-cyan/40 transition-colors flex flex-col"
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
          <span className="text-cyan text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
            Open the radar <ArrowRight size={14} />
          </span>
        </Link>
      </section>

      {/* Network strip */}
      <section className="max-w-5xl mx-auto px-6 mt-12">
        <div className="grid sm:grid-cols-2 gap-5">
          <a
            href="https://pcbottleneck.buildkit.store"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-surface border border-border rounded-2xl p-6 hover:border-cyan/40 transition-colors"
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
            href="https://007.buildkit.store"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-surface border border-border rounded-2xl p-6 hover:border-cyan/40 transition-colors"
          >
            <div className="flex items-center gap-2 text-xs font-mono text-text-secondary mb-2">
              <Gamepad2 size={14} />
              BUILDKIT NETWORK
            </div>
            <h3 className="font-semibold group-hover:text-cyan transition-colors">
              BuildKit Game Guides
            </h3>
            <p className="text-sm text-text-secondary mt-1">
              Interactive collectible maps, trophy trackers, and loadout tools —
              verified by actually playing.
            </p>
          </a>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
