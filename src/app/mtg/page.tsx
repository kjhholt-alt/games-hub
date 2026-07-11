import type { Metadata } from "next";
import Link from "next/link";
import {
  Crown,
  Layers,
  Ban,
  CalendarDays,
  LayoutGrid,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MtgSampleBanner } from "@/components/MtgSampleBanner";
import { MtgModuleHeader } from "@/components/MtgModuleHeader";
import { MtgCommanderTierTable } from "@/components/MtgCommanderTierTable";
import { MtgLimitedTierTable } from "@/components/MtgLimitedTierTable";
import { MtgBanlistTable } from "@/components/MtgBanlistTable";
import { MtgCalendarTable } from "@/components/MtgCalendarTable";
import { MtgFormatCards } from "@/components/MtgFormatCards";
import { getMtgMeta, isSamplePayload, formatFreshness } from "@/lib/mtg";

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

  return (
    <main className="min-h-screen">
      <SiteHeader />

      <section className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
        <div className="flex items-center gap-2 text-cyan text-xs font-mono mb-3">
          <Crown size={14} />
          EVERY ROW STAMPED WITH ITS SOURCE, SAMPLE SIZE &amp; CONFIDENCE
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          MTG Meta Hub
        </h1>
        <p className="text-text-secondary max-w-2xl mb-4">
          Commander &amp; Brawl tiers, real Limited win rates, ban-list
          changes, and the set calendar — each one labeled with what it
          actually measures, computed from data we&rsquo;re allowed to touch.
          No invented win rates, no re-hosted tracker numbers.
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary mb-8">
          <span className="inline-flex items-center gap-1.5 bg-surface border border-border rounded-full px-3 py-1">
            payload updated {formatFreshness(payload.computed_at)}
          </span>
          <span className="inline-flex items-center gap-1.5 bg-surface border border-border rounded-full px-3 py-1">
            {Object.keys(payload.modules).length} modules
          </span>
        </div>

        {sample && <MtgSampleBanner />}

        {/* Commander / Brawl tiers */}
        <div className="mb-14">
          <MtgModuleHeader
            icon={<Layers size={18} className="text-cyan" />}
            title="Commander &amp; Brawl Tiers"
            status={commander_tiers.status}
            computedAt={commander_tiers.computed_at}
            methodology={commander_tiers.methodology}
            attribution={commander_tiers.attribution}
          />
          <MtgCommanderTierTable rows={commander_tiers.rows} />
        </div>

        {/* Limited tiers */}
        <div className="mb-14">
          <MtgModuleHeader
            icon={<Layers size={18} className="text-cyan" />}
            title={`Limited Tier List — ${limitedSetLabel}`}
            status={limited_tiers.status}
            computedAt={limited_tiers.computed_at}
            methodology={limited_tiers.methodology}
            attribution={limited_tiers.attribution}
          />
          <MtgLimitedTierTable rows={limited_tiers.rows} />
        </div>

        {/* Banlist */}
        <div className="mb-14">
          <MtgModuleHeader
            icon={<Ban size={18} className="text-cyan" />}
            title="Ban List &amp; Legality Tracker"
            status={banlist.status}
            computedAt={banlist.computed_at}
            methodology={banlist.methodology}
            attribution={banlist.attribution}
          />
          <MtgBanlistTable rows={banlist.rows} />
        </div>

        {/* Calendar */}
        <div className="mb-14">
          <MtgModuleHeader
            icon={<CalendarDays size={18} className="text-cyan" />}
            title="Rotation &amp; Set Calendar"
            status={calendar.status}
            computedAt={calendar.computed_at}
            methodology={calendar.methodology}
            attribution={calendar.attribution}
          />
          <MtgCalendarTable rows={calendar.rows} />
        </div>

        {/* Format snapshots */}
        <div className="mb-14">
          <MtgModuleHeader
            icon={<LayoutGrid size={18} className="text-cyan" />}
            title="Format Snapshots"
            status={formats.status}
            computedAt={formats.computed_at}
            methodology={formats.methodology}
            attribution={formats.attribution}
          />
          <MtgFormatCards rows={formats.rows} />
        </div>

        {/* Curated external resources — cite-and-link only, never ingested */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-10">
          <h2 className="text-lg font-semibold mb-2">
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
                className="flex flex-col gap-1 bg-surface-raised border border-border rounded-xl p-3 hover:border-cyan/40 transition-colors"
              >
                <span className="inline-flex items-center gap-1 font-medium text-cyan">
                  {r.name}
                  <ExternalLink size={12} />
                </span>
                <span className="text-xs text-text-secondary">{r.note}</span>
              </a>
            ))}
          </div>
        </div>

        <p className="text-sm text-text-secondary mb-10">
          <Link href="/mtg/methodology" className="text-cyan hover:underline">
            <BookOpen size={13} className="inline -mt-0.5 mr-1" />
            Read the full methodology &amp; attribution
          </Link>
        </p>

        <p className="text-sm text-text-secondary mb-12">
          <Link href="/" className="text-cyan hover:underline">
            &larr; Back to BuildKit Play
          </Link>
        </p>

        {/* Wizards Fan Content Policy boilerplate — every /mtg page, never gated */}
        <div className="border-t border-border pt-6">
          <p className="text-xs text-text-secondary leading-relaxed">
            {payload.boilerplate}
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
