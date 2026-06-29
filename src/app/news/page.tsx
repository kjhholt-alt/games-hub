import type { Metadata } from "next";
import Link from "next/link";
import { Radio, AlertTriangle, TrendingUp, ExternalLink } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getNewsFeed } from "@/lib/news";

export const metadata: Metadata = {
  title: "Gaming & AI News Radar — Trending Topics",
  description:
    "What gaming and AI communities are talking about right now — trending topics surfaced from across Reddit, ranked by momentum. Updated daily.",
  alternates: { canonical: "https://play.buildkit.store/news" },
};

// Rebuild when the vendored feed changes; revalidate hourly.
export const revalidate = 3600;

export default function NewsPage() {
  const feed = getNewsFeed();
  const generated = feed.generatedUtc
    ? new Date(feed.generatedUtc).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "UTC",
        timeZoneName: "short",
      })
    : null;

  return (
    <main className="min-h-screen">
      <SiteHeader />

      <section className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
        <div className="flex items-center gap-2 text-cyan text-xs font-mono mb-3">
          <Radio size={14} />
          TRENDING ACROSS THE COMMUNITY
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          Gaming &amp; AI News Radar
        </h1>
        <p className="text-text-secondary max-w-2xl mb-6">
          The topics gaming and AI communities are buzzing about right now,
          surfaced from across Reddit and ranked by momentum.
          {generated && (
            <>
              {" "}
              <span className="text-text-secondary">
                Last scan: {generated}.
              </span>
            </>
          )}
        </p>

        {/* Unverified-signal caveat — content-radar items are leads, not facts. */}
        <div className="flex items-start gap-2.5 bg-amber-dim border border-amber/30 rounded-xl p-4 mb-10">
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
                  className="group block bg-surface border border-border rounded-2xl p-5 hover:border-cyan/40 transition-colors"
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
    <div className="bg-surface border border-border rounded-2xl p-10 text-center">
      <Radio size={28} className="text-text-secondary mx-auto mb-4" />
      <h2 className="text-lg font-semibold mb-2">No signals loaded yet</h2>
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
