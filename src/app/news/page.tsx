import type { Metadata } from "next";
import Link from "next/link";
import {
  Radio,
  AlertTriangle,
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Provenance } from "@/components/Provenance";
import { formatFreshness } from "@/lib/format";
import { networkDisplay } from "@/lib/fonts";
import { getNewsFeed } from "@/lib/news";
import { getEditions } from "@/lib/editions";

export const metadata: Metadata = {
  title: "BuildKit Brief — Grounded Gaming & Tech News",
  description:
    "Auto-written, grounded report editions on PoE, CS2, Deadlock, StS2, HOI4 and PC hardware — every claim traced to a primary source — plus a live community signal radar.",
  alternates: { canonical: "https://play.buildkit.store/news" },
};

// Rebuild when the vendored feed changes; revalidate hourly.
export const revalidate = 3600;

export default function NewsPage() {
  const feed = getNewsFeed();
  const editions = getEditions();

  return (
    <main className={`min-h-screen ${networkDisplay.variable}`}>
      <SiteHeader />

      <section className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
        <div className="flex items-center gap-2 text-cyan text-xs font-mono mb-3">
          <ShieldCheck size={14} />
          BUILDKIT BRIEF
        </div>
        <h1 className="network-display text-3xl sm:text-4xl tracking-tight mb-3">
          Grounded Gaming &amp; Tech News
        </h1>
        <p className="text-text-secondary max-w-2xl mb-10">
          Auto-written report editions on the games worth your time — every claim
          traced to a primary source with a freshness stamp. Below the briefs, a
          live community signal radar surfaces what people are buzzing about.
        </p>

        {/* Published editions — the grounded product. */}
        {editions.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 text-green text-xs font-mono mb-4">
              <ShieldCheck size={14} />
              LATEST BRIEFS · EVERY CLAIM SOURCED
            </div>
            <div className="grid gap-3">
              {editions.map((ed) => (
                <Link
                  key={ed.slug}
                  href={`/news/${ed.slug}`}
                  className="group block bg-surface border border-border rounded-lg p-5 hover:border-green/40 transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs font-mono text-text-secondary mb-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-green">
                      <ShieldCheck size={11} /> grounded
                    </span>
                    <span>&middot;</span>
                    <span>{ed.total_items} updates</span>
                    <span>&middot;</span>
                    <span>{ed.date}</span>
                  </div>
                  <h2 className="network-display text-lg text-foreground group-hover:text-green transition-colors leading-snug flex items-center gap-1.5">
                    {ed.title}
                    <ArrowRight
                      size={15}
                      className="shrink-0 text-text-secondary group-hover:text-green group-hover:translate-x-0.5 transition-all"
                    />
                  </h2>
                  <p className="text-sm text-text-secondary mt-1.5">
                    {ed.subtitle}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Community signal radar (raw, unverified leads). */}
        <div className="flex items-center gap-2 text-cyan text-xs font-mono mb-3">
          <Radio size={14} />
          COMMUNITY SIGNAL RADAR
        </div>
        <div className="mb-3">
          <Provenance
            status="signal"
            freshness={
              feed.generatedUtc ? formatFreshness(feed.generatedUtc) : undefined
            }
            note={`${feed.items.length} signals`}
          />
        </div>

        {/* Unverified-signal caveat — content-radar items are leads, not facts. */}
        <div className="flex items-start gap-2.5 bg-amber-dim border border-amber/30 rounded-lg p-4 mb-8 mt-2">
          <AlertTriangle size={16} className="text-amber mt-0.5 shrink-0" />
          <p className="text-sm text-text-secondary">
            <span className="text-amber font-semibold">Signals, not facts.</span>{" "}
            These are trending community discussions, not verified reporting.
            Treat headlines as leads and check the source before believing them.
          </p>
        </div>

        {feed.items.length === 0 ? (
          <EmptyState />
        ) : (
          <ol className="space-y-3">
            {feed.items.map((item, i) => (
              <li key={`${item.url}-${i}`}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block bg-surface border border-border rounded-lg p-5 hover:border-foreground/15 transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs font-mono text-text-secondary mb-2 flex-wrap">
                    {item.entity && (
                      <span className="text-cyan">{item.entity}</span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <TrendingUp size={11} />
                      {Math.round(item.momentum).toLocaleString("en-US")}
                    </span>
                    <span>&middot;</span>
                    <span>{item.source}</span>
                    {item.subCount > 1 && (
                      <>
                        <span>&middot;</span>
                        <span>{item.subCount} subreddits</span>
                      </>
                    )}
                  </div>
                  <h2 className="text-base font-semibold text-foreground group-hover:text-cyan transition-colors leading-snug flex items-start gap-1.5">
                    {item.title}
                    <ExternalLink
                      size={13}
                      className="mt-1 shrink-0 text-text-secondary group-hover:text-cyan"
                    />
                  </h2>
                  {item.domain && (
                    <p className="text-xs text-text-secondary mt-1.5">
                      {item.domain}
                    </p>
                  )}
                </a>
              </li>
            ))}
          </ol>
        )}

        <p className="text-sm text-text-secondary mt-12">
          <Link href="/" className="text-cyan hover:underline">
            &larr; Back to BuildKit Play
          </Link>
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}

function EmptyState() {
  return (
    <div className="bg-surface border border-border rounded-lg p-10 text-center">
      <Radio size={28} className="text-text-secondary mx-auto mb-4" />
      <h2 className="network-display text-lg mb-2">No signals loaded yet</h2>
      <p className="text-sm text-text-secondary max-w-md mx-auto">
        The news radar reads its feed from content-radar. Once a feed is
        published to{" "}
        <code className="text-cyan bg-surface-raised border border-border rounded px-1.5 py-0.5 text-xs">
          public/news-feed.json
        </code>
        , the latest trending topics will appear here automatically.
      </p>
    </div>
  );
}
