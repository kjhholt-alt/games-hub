import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, ExternalLink, FileJson } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MtgSampleBanner } from "@/components/MtgSampleBanner";
import { MtgModuleHeader } from "@/components/MtgModuleHeader";
import { MtgCommanderTierTable } from "@/components/MtgCommanderTierTable";
import { MtgLimitedTierTable } from "@/components/MtgLimitedTierTable";
import { MtgBanlistTable } from "@/components/MtgBanlistTable";
import { MtgCalendarTable } from "@/components/MtgCalendarTable";
import { MtgFormatCards } from "@/components/MtgFormatCards";
import { MtgTierPlate } from "@/components/MtgTierPlate";
import {
  daysUntil,
  formatDaysUntil,
  formatFreshness,
  getMtgMeta,
  isSamplePayload,
} from "@/lib/mtg";
import { getMtgDraft } from "@/lib/mtgDraft";
import { sortDraftRows } from "@/lib/mtgDraftView";
import { mtgDisplay } from "@/lib/mtgFonts";

export const metadata: Metadata = {
  title: "MTG Meta Hub — Commander Tiers, Limited Ratings & Ban List",
  description:
    "Every Commander/Brawl tier, Limited card rating, and ban-list change stamped with its source, sample size, and confidence — the honesty rail nobody else in Magic: the Gathering meta coverage ships.",
  alternates: { canonical: "https://play.buildkit.store/mtg" },
};

// The pipeline republishes at most a few times a day; an hourly ISR window is
// plenty and keeps this a static-friendly page between refreshes.
export const revalidate = 3600;

/** Curated cite-and-link resources. We never ingest these — no automated
 * fetch, no re-hosted numbers, just a link with the source's name on it. */
const EXTERNAL_RESOURCES = [
  {
    name: "untapped.gg",
    url: "https://mtga.untapped.gg",
    note: "Live tracker win rates (Premium-gated per deck)",
  },
  {
    name: "MTGGoldfish",
    url: "https://www.mtggoldfish.com",
    note: "Constructed metagame breakdowns & price data",
  },
  {
    name: "EDHREC",
    url: "https://edhrec.com",
    note: "The Commander recommendation engine",
  },
];

export default function MtgPage() {
  const payload = getMtgMeta();

  if (!payload) {
    return (
      <main className="min-h-screen">
        <SiteHeader />
        <section className="max-w-5xl mx-auto px-6 py-16">
          <p className="text-text-secondary">
            MTG meta data is unavailable right now — check back shortly.
          </p>
        </section>
        <SiteFooter />
      </main>
    );
  }

  const sample = isSamplePayload(payload);
  const { commander_tiers, limited_tiers, banlist, calendar, formats } =
    payload.modules;

  // The engine ships limited_tiers rows with a per-row `set` code (not a
  // module-level set_name) — cross-reference the calendar module (which
  // does carry Scryfall's full set_name) for a friendlier heading.
  const limitedSetCodes = [...new Set(limited_tiers.rows.map((r) => r.set))];
  const setNameByCode = Object.fromEntries(
    calendar.rows.map((r) => [r.set_code, r.set_name])
  );
  const limitedSetLabel = limitedSetCodes
    .map((code) => `${setNameByCode[code] ?? code} (${code})`)
    .join(", ");

  // ── Today's readings — the hero IS live data with receipts ──────────────
  const trendingTop =
    [...commander_tiers.rows]
      .filter((r) => r.bucket === "trending")
      .sort((a, b) => b.deck_count - a.deck_count)[0] ??
    [...commander_tiers.rows].sort((a, b) => b.deck_count - a.deck_count)[0];

  const draftPayload = getMtgDraft();
  const publishedSet = draftPayload?.sets.find((s) => s.status === "published");
  const topDraft = publishedSet
    ? sortDraftRows(publishedSet.overall_rows, "draft_score", "desc")[0]
    : undefined;

  const nextSet = [...calendar.rows]
    .filter((r) => daysUntil(r.released_at) > 0)
    .sort((a, b) => a.released_at.localeCompare(b.released_at))[0];

  const indexEntries: { label: string; href: string; count: string }[] = [
    {
      label: "Draft ranker",
      href: "/mtg/draft",
      count: publishedSet
        ? `${publishedSet.overall_rows.length}`
        : "—",
    },
    { label: "Tiers", href: "#tiers", count: `${commander_tiers.rows.length}` },
    { label: "Limited", href: "#limited", count: `${limited_tiers.rows.length}` },
    { label: "Bans", href: "#banlist", count: `${banlist.rows.length}` },
    { label: "Calendar", href: "#calendar", count: `${calendar.rows.length}` },
    { label: "Formats", href: "#formats", count: `${formats.rows.length}` },
    { label: "Methodology", href: "/mtg/methodology", count: "receipts" },
  ];

  return (
    <main className={`min-h-screen mtg-scope ${mtgDisplay.variable}`}>
      <SiteHeader />

      <section className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass mb-4">
          Source · sample · freshness · confidence — every row carries its
          receipts
        </p>
        <h1 className="mtg-display text-4xl sm:text-5xl leading-tight mb-3">
          MTG Meta Hub
        </h1>
        <div className="mtg-spectrum w-44 mb-5" aria-hidden />
        <p className="text-text-secondary max-w-2xl mb-6">
          Commander &amp; Brawl tiers, real Limited win rates, ban-list
          changes, and the set calendar — each one labeled with what it
          actually measures, computed from data we&rsquo;re allowed to touch.
          No invented win rates, no re-hosted tracker numbers.
        </p>

        {/* Today's readings — three live facts, each with its stamp */}
        <div className="grid sm:grid-cols-3 border border-border rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-border mb-6 overflow-hidden">
          {trendingTop && (
            <Link
              href="#tiers"
              className="p-4 hover:bg-brass/5 transition-colors min-w-0"
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-brass mb-1.5">
                Trending commander
              </p>
              <p className="text-base font-semibold truncate mb-1">
                {trendingTop.commander}
              </p>
              <p className="font-mono text-[10px] text-text-secondary truncate">
                {trendingTop.deck_count} decks ·{" "}
                {formatFreshness(trendingTop.computed_at)} · via Archidekt
              </p>
            </Link>
          )}
          {topDraft && publishedSet && (
            <Link
              href="/mtg/draft"
              className="p-4 hover:bg-brass/5 transition-colors min-w-0"
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-brass mb-1.5">
                Top draft pick · {publishedSet.set_code}
              </p>
              <p className="text-base font-semibold truncate mb-1 flex items-center gap-2">
                <MtgTierPlate letter={topDraft.grade} size="sm" />
                <span className="truncate">{topDraft.card}</span>
              </p>
              <p className="font-mono text-[10px] text-text-secondary truncate">
                {topDraft.gih_wr !== null
                  ? `${(topDraft.gih_wr * 100).toFixed(1)}% GIH`
                  : "unrated"}{" "}
                · n={topDraft.sample_size.toLocaleString("en-US")} · via
                17lands
              </p>
            </Link>
          )}
          {nextSet && (
            <Link
              href="#calendar"
              className="p-4 hover:bg-brass/5 transition-colors min-w-0"
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-brass mb-1.5">
                Next set release
              </p>
              <p className="text-base font-semibold truncate mb-1">
                {nextSet.set_name}
              </p>
              <p className="font-mono text-[10px] text-text-secondary truncate">
                {formatDaysUntil(nextSet.released_at)} ·{" "}
                {nextSet.set_code.toUpperCase()} · via Scryfall
              </p>
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-secondary border border-border rounded-md px-2.5 py-1">
            payload updated {formatFreshness(payload.computed_at)}
          </span>
          <a
            href="/mtg-meta.json"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-secondary border border-border rounded-md px-2.5 py-1 hover:border-brass/40 hover:text-foreground transition-colors"
            title="The exact JSON this page renders — every number, source, and stamp"
          >
            <FileJson size={11} />
            raw data
          </a>
          <a
            href="/mtg-draft.json"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-secondary border border-border rounded-md px-2.5 py-1 hover:border-brass/40 hover:text-foreground transition-colors"
            title="The Draft Ranker's full dataset as JSON"
          >
            <FileJson size={11} />
            draft data
          </a>
        </div>

        {/* Module index — the almanac's table of contents, with counts */}
        <nav
          aria-label="Sections"
          className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wide mb-10"
        >
          {indexEntries.map((e) => (
            <a
              key={e.href}
              href={e.href}
              className="inline-flex items-center gap-2 border border-border rounded px-2.5 py-1 text-text-secondary hover:text-foreground hover:border-brass/40 transition-colors"
            >
              {e.label}
              <span className="text-brass/80 tabular-nums normal-case">
                {e.count}
              </span>
            </a>
          ))}
        </nav>

        {sample && <MtgSampleBanner />}

        {/* Draft Ranker — the hero module (METAHUB-SPEC.md ADDENDUM, wave 2) */}
        <Link
          href="/mtg/draft"
          className="group flex items-center justify-between gap-6 border border-brass/40 bg-brass-dim rounded-lg px-6 py-5 mb-14 hover:border-brass/70 transition-colors"
        >
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-widest text-brass mb-1.5">
              The draft ranker
            </p>
            <p className="mtg-display text-xl sm:text-2xl leading-snug mb-1">
              Every draft card graded S–F from real 17lands win rates
            </p>
            <p className="text-sm text-text-secondary max-w-xl">
              Sortable, filterable, sample-size-honest — free, unlike the
              paywalled pick overlays. Plus a print-friendly cheat sheet for
              your second screen.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {publishedSet && (
              <span className="font-mono text-[10px] uppercase tracking-wide text-text-secondary hidden sm:block">
                {publishedSet.overall_rows.length} cards graded
              </span>
            )}
            <ArrowRight
              size={20}
              className="text-brass group-hover:translate-x-1 transition-transform"
            />
          </div>
        </Link>

        {/* Commander / Brawl tiers */}
        <div id="tiers" className="mb-16 scroll-mt-24">
          <MtgModuleHeader
            title="Commander & Brawl Tiers"
            status={commander_tiers.status}
            computedAt={commander_tiers.computed_at}
            methodology={commander_tiers.methodology}
            attribution={commander_tiers.attribution}
            note={`${commander_tiers.rows.length} commanders`}
          />
          <MtgCommanderTierTable rows={commander_tiers.rows} />
        </div>

        {/* Limited tiers */}
        <div id="limited" className="mb-16 scroll-mt-24">
          <MtgModuleHeader
            title={`Limited Tier List — ${limitedSetLabel}`}
            status={limited_tiers.status}
            computedAt={limited_tiers.computed_at}
            methodology={limited_tiers.methodology}
            attribution={limited_tiers.attribution}
            note={`${limited_tiers.rows.length} cards`}
          />
          <MtgLimitedTierTable rows={limited_tiers.rows} />
        </div>

        {/* Banlist */}
        <div id="banlist" className="mb-16 scroll-mt-24">
          <MtgModuleHeader
            title="Ban List & Legality Tracker"
            status={banlist.status}
            computedAt={banlist.computed_at}
            methodology={banlist.methodology}
            attribution={banlist.attribution}
            note={`${banlist.rows.length} formats`}
          />
          <MtgBanlistTable rows={banlist.rows} />
        </div>

        {/* Calendar */}
        <div id="calendar" className="mb-16 scroll-mt-24">
          <MtgModuleHeader
            title="Rotation & Set Calendar"
            status={calendar.status}
            computedAt={calendar.computed_at}
            methodology={calendar.methodology}
            attribution={calendar.attribution}
            note={`${calendar.rows.length} sets`}
          />
          <MtgCalendarTable rows={calendar.rows} />
        </div>

        {/* Format snapshots */}
        <div id="formats" className="mb-16 scroll-mt-24">
          <MtgModuleHeader
            title="Format Snapshots"
            status={formats.status}
            computedAt={formats.computed_at}
            methodology={formats.methodology}
            attribution={formats.attribution}
            note={`${formats.rows.length} formats`}
          />
          <MtgFormatCards rows={formats.rows} />
        </div>

        {/* Curated external resources — cite-and-link only, never ingested */}
        <div className="border border-border rounded-lg p-6 mb-10">
          <h2 className="mtg-display text-xl mb-2">
            More meta coverage worth your time
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            These sites run trackers and telemetry we don&rsquo;t have
            permission to ingest. We link to them rather than scrape or
            re-host their numbers — go to the source for win rates our
            modules above honestly label as pending.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {EXTERNAL_RESOURCES.map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-1 bg-surface border border-border rounded-lg p-3 hover:border-brass/40 transition-colors"
              >
                <span className="inline-flex items-center gap-1 font-medium text-brass">
                  {r.name}
                  <ExternalLink size={12} />
                </span>
                <span className="text-xs text-text-secondary">{r.note}</span>
              </a>
            ))}
          </div>
        </div>

        <p className="text-sm text-text-secondary mb-3">
          <Link
            href="/mtg/methodology"
            className="text-brass hover:text-brass-bright transition-colors"
          >
            <BookOpen size={13} className="inline -mt-0.5 mr-1" />
            Read the full methodology &amp; attribution
          </Link>
        </p>

        <p className="text-sm text-text-secondary mb-12">
          <Link
            href="/"
            className="text-brass hover:text-brass-bright transition-colors"
          >
            &larr; Back to BuildKit Play
          </Link>
        </p>

        {/* Wizards Fan Content Policy boilerplate — every /mtg page, never gated */}
        <div>
          <div className="mtg-spectrum w-full opacity-50 mb-5" aria-hidden />
          <p className="text-xs text-text-secondary leading-relaxed">
            {payload.boilerplate}
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
