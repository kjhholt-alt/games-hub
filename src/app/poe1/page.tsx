import type { Metadata } from "next";
import Link from "next/link";
import { Swords, CalendarClock, BookOpen } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Poe1TierList } from "@/components/Poe1TierList";
import {
  POE1_META,
  entriesByCategory,
  allCitedSources,
  daysRemaining,
} from "@/lib/poe1";

export const metadata: Metadata = {
  title: "Path of Exile Build Tier List — Return of the Ancestors (Live Event)",
  description:
    "PoE1 Return of the Ancestors event meta: the best league-start builds, Phrecian ascendancies, and skills ranked S to D from current community consensus.",
  alternates: { canonical: "https://play.buildkit.store/poe1" },
};

// Static-friendly; the dataset is curated, so a daily revalidate is plenty.
export const revalidate = 86400;

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Poe1Page() {
  const meta = POE1_META;
  const builds = entriesByCategory("build", meta);
  const top = builds.slice(0, 3);
  const sources = allCitedSources(meta);
  const left = daysRemaining(meta);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Path of Exile — ${meta.league} build tier list`,
    itemListElement: builds.slice(0, 10).map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
    })),
  };

  return (
    <main className="min-h-screen">
      <SiteHeader />

      <section className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
        <div className="flex items-center gap-2 text-cyan text-xs font-mono mb-3">
          <Swords size={14} />
          PATH OF EXILE 1 &middot; LIVE EVENT META
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          {meta.league} — Build Tier List
        </h1>
        <p className="text-text-secondary max-w-2xl mb-4">
          The best league-start builds, Phrecian ascendancies, and skills for
          Path of Exile&rsquo;s {meta.league} event, ranked S to D. Built on the{" "}
          {meta.baseLeague} base with the 19 alternate ascendancies and Trial of
          the Ancestors layered on top.
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary mb-10">
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock size={12} className="text-cyan" />
            {fmt(meta.startsAt)} – {fmt(meta.endsAt)}
          </span>
          <span className="inline-flex items-center gap-1.5 bg-surface border border-border rounded-full px-3 py-1">
            {left > 0 ? `${left} days left` : "Event ended"}
          </span>
          <span className="inline-flex items-center gap-1.5 bg-surface border border-border rounded-full px-3 py-1">
            {meta.dataSource.label}
          </span>
        </div>

        {/* Top-3 build highlight */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {top.map((b, i) => (
            <div
              key={b.id}
              className="bg-surface border border-border rounded-2xl p-5"
            >
              <p className="text-xs font-mono text-text-secondary mb-1">
                #{i + 1} starter
              </p>
              <p className="text-lg font-bold leading-tight">{b.name}</p>
              <p className="text-sm text-cyan font-semibold mt-1">
                {b.ascendancy}
              </p>
              <p className="text-xs text-text-secondary mt-2 leading-snug">
                {b.oneLiner}
              </p>
            </div>
          ))}
        </div>

        <Poe1TierList meta={meta} />

        {/* Methodology */}
        <div className="bg-surface border border-border rounded-2xl p-6 mt-12">
          <h2 className="text-lg font-semibold mb-2">How this is ranked</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            {meta.league} is a brand-new 3-week event, so there is no mature
            win-rate ladder to scrape yet. These tiers are the current{" "}
            <strong className="text-foreground">community consensus</strong> —
            ported from our own PoE1 planner and cross-checked across reputable
            sources (PoE Vault and Odealo agree on every ascendancy&rsquo;s base
            class). Tier cuts: S = top of the meta, A = excellent all-rounder, B
            = solid, C = situational, D = off-meta/gimmick. Exact gem links and
            passive trees should be finalised in{" "}
            <a
              href="https://github.com/PathOfBuildingCommunity/PathOfBuilding"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan hover:underline"
            >
              Path of Building Community
            </a>
            . {meta.dataSource.note}
          </p>
        </div>

        {/* Sources */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <BookOpen size={16} className="text-cyan" />
            Sources
          </h2>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {sources.map((s) => (
              <li key={s.id} className="flex items-start gap-2">
                <span
                  className={`mt-0.5 text-[10px] font-mono uppercase rounded px-1.5 py-0.5 shrink-0 ${
                    s.kind === "official"
                      ? "text-cyan bg-cyan-dim"
                      : s.kind === "tool"
                        ? "text-purple bg-purple-dim"
                        : "text-text-secondary bg-surface border border-border"
                  }`}
                >
                  {s.kind}
                </span>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary hover:text-cyan transition-colors"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-xs text-text-secondary mt-4">
            Path of Exile is a trademark of Grinding Gear Games. This page is an
            unofficial community resource and is not affiliated with GGG.
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
