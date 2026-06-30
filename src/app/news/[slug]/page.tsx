import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ShieldCheck,
  ExternalLink,
  Cpu,
  TrendingUp,
  CalendarDays,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  getEdition,
  getPublishedSlugs,
  type Edition,
  type EditionItem,
  type EditionSection,
} from "@/lib/editions";

// Only published editions are pre-rendered. Any other slug (e.g. a draft) 404s
// in production — that IS the approval gate.
export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return getPublishedSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ed = getEdition(slug);
  if (!ed) return { title: "Brief not found" };
  return {
    title: `${ed.title} — BuildKit Brief`,
    description: ed.subtitle,
    alternates: { canonical: `https://play.buildkit.store/news/${ed.slug}` },
  };
}

const KIND_LABEL: Record<string, string> = {
  patch: "PATCH",
  event: "EVENT",
  news: "NEWS",
  price: "PRICE",
  meta: "STATUS",
};

function ConfidenceBadge({ confidence }: { confidence: string }) {
  if (confidence === "confirmed") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide text-green border border-green/30 bg-green/10 rounded px-1.5 py-0.5">
        <ShieldCheck size={10} /> confirmed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide text-amber border border-amber/30 bg-amber-dim rounded px-1.5 py-0.5">
      rumor · unconfirmed
    </span>
  );
}

function ItemCard({ item }: { item: EditionItem }) {
  const when = item.published
    ? new Date(item.published).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      })
    : null;
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-[10px] font-mono text-text-secondary border border-border rounded px-1.5 py-0.5">
          {KIND_LABEL[item.kind] ?? item.kind.toUpperCase()}
        </span>
        <ConfidenceBadge confidence={item.confidence} />
      </div>
      <h3 className="text-base font-semibold text-foreground leading-snug mb-2">
        {item.headline}
      </h3>
      {item.summary && (
        <p className="text-sm text-text-secondary leading-relaxed mb-3">
          {item.summary}
        </p>
      )}
      {item.bullets.length > 0 && (
        <ul className="space-y-1 mb-3">
          {item.bullets.map((b, i) => (
            <li
              key={i}
              className="text-sm text-text-secondary leading-snug pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-cyan"
            >
              {b}
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2 text-xs font-mono text-text-secondary flex-wrap pt-1 border-t border-border/50 mt-1">
        <a
          href={item.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-cyan hover:underline"
        >
          {item.source.name}
          <ExternalLink size={11} />
        </a>
        {when && (
          <>
            <span>&middot;</span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={11} />
              {when}
            </span>
          </>
        )}
        {item.source.stamp && item.source.stamp !== "live" && (
          <>
            <span>&middot;</span>
            <span>{item.source.stamp}</span>
          </>
        )}
        {item.crosslink && (
          <>
            <span>&middot;</span>
            <a
              href={item.crosslink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-purple hover:underline"
            >
              <Cpu size={11} /> specs on PC Bottleneck
            </a>
          </>
        )}
      </div>
    </div>
  );
}

function SectionBlock({ section }: { section: EditionSection }) {
  const hasItems = section.items.length > 0;
  return (
    <section className="mb-10">
      <div className="flex items-baseline gap-2 mb-1">
        <h2 className="text-xl font-bold tracking-tight">
          <span className="mr-2">{section.emoji}</span>
          {section.world_name}
        </h2>
      </div>
      {section.blurb && (
        <p className="text-xs text-text-secondary mb-4">{section.blurb}</p>
      )}
      <div className="space-y-3">
        {hasItems ? (
          section.items.map((it, i) => <ItemCard key={i} item={it} />)
        ) : (
          <div className="bg-surface border border-border rounded-2xl p-5 text-sm text-text-secondary">
            No confirmed changes this cycle.
            {section.crosslink && (
              <>
                {" "}
                Hardware deep-dives live on{" "}
                <a
                  href={section.crosslink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple hover:underline inline-flex items-center gap-1"
                >
                  PC Bottleneck <ExternalLink size={11} />
                </a>
                .
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default async function EditionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ed: Edition | null = getEdition(slug);
  if (!ed) notFound();

  const generated = ed.generated_utc
    ? new Date(ed.generated_utc).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      })
    : null;

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <article className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
        <Link
          href="/news"
          className="text-sm text-cyan hover:underline mb-6 inline-block"
        >
          &larr; All briefs
        </Link>

        <div className="flex items-center gap-2 text-cyan text-xs font-mono mb-3">
          <ShieldCheck size={14} />
          BUILDKIT BRIEF · GROUNDED
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          {ed.title}
        </h1>
        <p className="text-text-secondary mb-4">{ed.subtitle}</p>
        <div className="flex items-center gap-3 text-xs font-mono text-text-secondary mb-8 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <TrendingUp size={12} /> {ed.total_items} grounded updates
          </span>
          {generated && (
            <>
              <span>&middot;</span>
              <span>{generated}</span>
            </>
          )}
        </div>

        {/* Grounding promise — this is the product's whole point. */}
        <div className="flex items-start gap-2.5 bg-green/10 border border-green/30 rounded-xl p-4 mb-10">
          <ShieldCheck size={16} className="text-green mt-0.5 shrink-0" />
          <p className="text-sm text-text-secondary">
            <span className="text-green font-semibold">Every claim is sourced.</span>{" "}
            {ed.grounding_note}
          </p>
        </div>

        {ed.sections.map((s) => (
          <SectionBlock key={s.world_key} section={s} />
        ))}

        <p className="text-sm text-text-secondary mt-8 pt-6 border-t border-border">
          <Link href="/news" className="text-cyan hover:underline">
            &larr; Back to all briefs
          </Link>
        </p>
      </article>
      <SiteFooter />
    </main>
  );
}
