import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MtgTierPlate } from "@/components/MtgTierPlate";
import { MtgProvenance } from "@/components/MtgProvenance";
import { ManaDots } from "@/components/MtgManaPips";
import { mtgDisplay } from "@/lib/mtgFonts";
import {
  BUCKET_LABEL,
  CONFIDENCE_LABEL,
  colorIdentityPips,
  formatLabel,
  getMtgMeta,
  type CommanderTierRow,
} from "@/lib/mtg";
import {
  commanderRowStatus,
  getAllCommanderSlugs,
  getCommanderPageEntry,
  type CommanderPageEntry,
} from "@/lib/mtgCommanderPages";

// The pipeline republishes at most a few times a day — matches /mtg's ISR
// window so a detail page never drifts stale relative to the hub table it's
// linked from.
export const revalidate = 3600;

// New commanders (a later publish adds one the build-time corpus didn't
// have) must resolve on request rather than permanently 404 until the next
// redeploy — the opposite of news/[slug]'s dynamicParams=false, because this
// corpus grows continuously instead of gating on manual approval.
export const dynamicParams = true;

/** Empty corpus -> empty params, never a crash — by design this page ships
 * ahead of the repaired commander_tiers payload (0 rows on disk today). */
export function generateStaticParams() {
  return getAllCommanderSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = lookupEntry(slug);
  if (!entry) return { title: "Commander not found" };

  const totalDecks = entry.rows.reduce((sum, r) => sum + r.deck_count, 0);
  return {
    title: `${entry.name} — Commander Tier & Top Inclusions`,
    description: `${entry.name} tracked across ${totalDecks.toLocaleString(
      "en-US"
    )} scanned decks — tier, sample size, confidence, and source receipts for every format it's rated in, never a guessed number.`,
    alternates: {
      canonical: `https://play.buildkit.store/mtg/commander/${entry.slug}`,
    },
  };
}

function lookupEntry(slug: string): CommanderPageEntry | null {
  return getCommanderPageEntry(slug);
}

export default async function CommanderDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = lookupEntry(slug);
  if (!entry) notFound();

  const payload = getMtgMeta();
  const art = entry.rows.find((r) => r.image_normal)?.image_normal;
  const totalDecks = entry.rows.reduce((sum, r) => sum + r.deck_count, 0);

  return (
    <main className={`min-h-screen mtg-scope ${mtgDisplay.variable}`}>
      <SiteHeader />

      <section className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass mb-4">
          Source · sample · freshness · confidence — every fact below carries
          its receipts
        </p>

        <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-3">
          {art && (
            <div className="w-[220px] h-[307px] shrink-0 rounded-lg overflow-hidden border border-border bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={art}
                alt={entry.name}
                width={220}
                height={307}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="mtg-display text-4xl sm:text-5xl leading-tight mb-3">
              {entry.name}
            </h1>
            <div className="mtg-spectrum w-44 mb-5" aria-hidden />
            <p className="text-text-secondary max-w-xl">
              Tier = deck-count rank-percentile within its bucket — a
              popularity measure, not a win rate.{" "}
              {totalDecks.toLocaleString("en-US")} decks scanned across{" "}
              {entry.rows.length} format/bucket{" "}
              {entry.rows.length === 1 ? "slice" : "slices"}.
            </p>
          </div>
        </div>

        <div className="space-y-6 mb-12">
          {entry.rows.map((row) => (
            <FactCard key={`${row.format}-${row.bucket}`} row={row} />
          ))}
        </div>

        <p className="text-sm text-text-secondary mb-4">
          <Link
            href="/mtg#meta=commander"
            className="inline-flex items-center gap-1 text-brass hover:text-brass-bright transition-colors"
          >
            &larr; Back to the MTG Meta Hub
          </Link>
        </p>

        {/* Wizards Fan Content Policy boilerplate — every /mtg page, never gated */}
        {payload && (
          <div>
            <div className="mtg-spectrum w-full opacity-50 mb-5" aria-hidden />
            <p className="text-xs text-text-secondary leading-relaxed">
              {payload.boilerplate}
            </p>
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}

/** One format/bucket slice of a commander's record — tier, deck count,
 * colors, the real Archidekt deck link-back, its full provenance ledger,
 * and the complete top-inclusions list (never truncated to 3 the way the
 * hub table is). */
function FactCard({ row }: { row: CommanderTierRow }) {
  const pips = colorIdentityPips(row.color_identity).replace("C", "");
  return (
    <div className="border border-border rounded-lg p-5">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <MtgTierPlate letter={row.tier} size="lg" />
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-widest text-text-secondary">
            {formatLabel(row.format)} · {BUCKET_LABEL[row.bucket]}
          </p>
          <p className="text-sm font-semibold tabular-nums">
            {row.deck_count.toLocaleString("en-US")} decks
          </p>
        </div>
        <ManaDots letters={pips} size="md" />
        <a
          href={row.deck_url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-sm text-brass hover:text-brass-bright transition-colors"
        >
          Representative deck
          <ExternalLink size={12} />
        </a>
      </div>

      <MtgProvenance
        status={commanderRowStatus(row)}
        computedAt={row.computed_at}
        note={`n=${row.sample_size} · ${CONFIDENCE_LABEL[row.confidence]}`}
        attribution={row.sources}
      />

      <div className="mt-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-secondary mb-2">
          Top inclusions
        </p>
        <p className="text-sm text-text-secondary leading-relaxed">
          {row.top_inclusions.length > 0
            ? row.top_inclusions.join(" · ")
            : "—"}
        </p>
      </div>
    </div>
  );
}
