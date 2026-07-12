import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, ExternalLink, FileJson, Info } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MtgSampleBanner } from "@/components/MtgSampleBanner";
import { MtgModuleHeader } from "@/components/MtgModuleHeader";
import { MtgCommanderTierTable } from "@/components/MtgCommanderTierTable";
import { MtgLimitedTierTable } from "@/components/MtgLimitedTierTable";
import { MtgConstructedTierTable } from "@/components/MtgConstructedTierTable";
import { MtgEdhTournamentTable } from "@/components/MtgEdhTournamentTable";
import { MtgMetaMoversTable } from "@/components/MtgMetaMoversTable";
import { MtgBanlistTable } from "@/components/MtgBanlistTable";
import { MtgCalendarTable } from "@/components/MtgCalendarTable";
import { MtgFormatCards } from "@/components/MtgFormatCards";
import { MtgTierPlate } from "@/components/MtgTierPlate";
import { MtgMetaLens, type MtgMetaLensOption, type MtgMetaLensSection } from "@/components/MtgMetaLens";
import { MtgHonestPanel } from "@/components/MtgHonestPanel";
import {
  daysUntil,
  formatDaysUntil,
  formatFreshness,
  formatLabel,
  getMtgMeta,
  isSamplePayload,
  type CommanderTierRow,
  type MtgMetaPayload,
} from "@/lib/mtg";
import { getMtgDraft } from "@/lib/mtgDraft";
import { scoredRowCount, sortDraftRows } from "@/lib/mtgDraftView";
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

type FormatsModule = MtgMetaPayload["modules"]["formats"];
type BanlistModule = MtgMetaPayload["modules"]["banlist"];
type ConstructedModule = MtgMetaPayload["modules"]["constructed_tiers"];
type CommanderTiersModule = MtgMetaPayload["modules"]["commander_tiers"];

/** A single format's "world" inside the Commander/Brawl axis — the tier
 * table filtered to that one format (or an honest empty panel when this
 * run's corpus has zero rows for it, e.g. Brawl), plus its Format Snapshot
 * and Ban List cards. Never repurposes another format's rows. */
function CommanderFormatWorld({
  formatId,
  formatDisplayName,
  commanderTiersModule,
  formatsModule,
  banlistModule,
  rows,
  emptyNote,
}: {
  formatId: string;
  formatDisplayName: string;
  commanderTiersModule: CommanderTiersModule;
  formatsModule: FormatsModule;
  banlistModule: BanlistModule;
  rows: CommanderTierRow[];
  emptyNote: string;
}) {
  const fRow = formatsModule.rows.find((r) => r.format === formatId);
  const bRow = banlistModule.rows.find((r) => r.format === formatId);

  return (
    <>
      <div className="mb-10">
        <MtgModuleHeader
          title={`${formatDisplayName} Tiers`}
          status={commanderTiersModule.status}
          computedAt={commanderTiersModule.computed_at}
          methodology={commanderTiersModule.methodology}
          attribution={commanderTiersModule.attribution}
          note={rows.length > 0 ? `${rows.length} commanders` : undefined}
        />
        {rows.length > 0 ? (
          <MtgCommanderTierTable rows={rows} />
        ) : (
          <MtgHonestPanel title="No rows this run">{emptyNote}</MtgHonestPanel>
        )}
      </div>
      <div className="mb-10">
        <MtgModuleHeader
          title="Format Snapshot"
          status={formatsModule.status}
          computedAt={formatsModule.computed_at}
          methodology={formatsModule.methodology}
          attribution={formatsModule.attribution}
        />
        <MtgFormatCards rows={fRow ? [fRow] : []} />
      </div>
      <div>
        <MtgModuleHeader
          title="Ban List & Legality"
          status={banlistModule.status}
          computedAt={banlistModule.computed_at}
          methodology={banlistModule.methodology}
          attribution={banlistModule.attribution}
        />
        <MtgBanlistTable rows={bRow ? [bRow] : []} />
      </div>
    </>
  );
}

/** A single Standard/Pioneer/Modern format's world — its Format Snapshot and
 * Ban List cards, plus the Constructed Tiers slice for that format. Renders
 * the honest "pending a topdeck.gg key" ledger panel inline whenever the
 * module is absent OR present-but-empty for this format, so the lens is
 * never silently empty (unlike the page-wide `constructed_tiers &&` guard,
 * which renders nothing at all when the module key is missing entirely). */
function ConstructedFormatWorld({
  formatId,
  formatDisplayName,
  formatsModule,
  banlistModule,
  constructedModule,
}: {
  formatId: string;
  formatDisplayName: string;
  formatsModule: FormatsModule;
  banlistModule: BanlistModule;
  constructedModule: ConstructedModule;
}) {
  const fRow = formatsModule.rows.find((r) => r.format === formatId);
  const bRow = banlistModule.rows.find((r) => r.format === formatId);
  const cRows = constructedModule
    ? constructedModule.rows.filter((r) => r.format === formatId)
    : [];

  return (
    <>
      <div className="mb-10">
        <MtgModuleHeader
          title="Format Snapshot"
          status={formatsModule.status}
          computedAt={formatsModule.computed_at}
          methodology={formatsModule.methodology}
          attribution={formatsModule.attribution}
        />
        <MtgFormatCards rows={fRow ? [fRow] : []} />
      </div>

      <div className="mb-10">
        <MtgModuleHeader
          title="Ban List & Legality"
          status={banlistModule.status}
          computedAt={banlistModule.computed_at}
          methodology={banlistModule.methodology}
          attribution={banlistModule.attribution}
        />
        <MtgBanlistTable rows={bRow ? [bRow] : []} />
      </div>

      <div>
        <MtgModuleHeader
          title="Constructed Tiers"
          status={constructedModule?.status ?? "pending_key"}
          computedAt={constructedModule?.computed_at ?? banlistModule.computed_at}
          methodology={
            constructedModule?.methodology ??
            "Tournament-backed win-rate tiers from topdeck.gg — pending an API key."
          }
          attribution={constructedModule?.attribution ?? []}
          note={cRows.length > 0 ? `${cRows.length} archetypes/decks` : undefined}
        />
        {cRows.length > 0 ? (
          <MtgConstructedTierTable rows={cRows} />
        ) : (
          <MtgHonestPanel
            title={constructedModule ? "No tournament results this run" : "Pending a topdeck.gg key"}
          >
            {constructedModule
              ? `topdeck.gg didn't return usable tournament results for ${formatDisplayName} this run — check back after the next refresh; nothing here is invented while data is unavailable.`
              : `Tournament-backed ${formatDisplayName} tiers are pending a topdeck.gg key (a free 2-minute signup) — real tiers replace this panel automatically the moment it's configured, and this module never ships an invented row in the meantime.`}
          </MtgHonestPanel>
        )}
      </div>
    </>
  );
}

/** A Historic/Timeless format's world — real Format Snapshot + Ban List
 * cards straight from Scryfall legalities (same CommanderFormatWorld/
 * ConstructedFormatWorld-style pattern as every other format above),
 * followed by an honest line that PERFORMANCE tiers (win-rate-backed
 * rankings, distinct from the legality/ban data those cards already show)
 * still need a permitted tournament or telemetry source we don't have yet
 * — we never invent one. */
function HistoricFormatWorld({
  formatId,
  formatDisplayName,
  formatsModule,
  banlistModule,
}: {
  formatId: string;
  formatDisplayName: string;
  formatsModule: FormatsModule;
  banlistModule: BanlistModule;
}) {
  const fRow = formatsModule.rows.find((r) => r.format === formatId);
  const bRow = banlistModule.rows.find((r) => r.format === formatId);

  return (
    <>
      <div className="mb-10">
        <MtgModuleHeader
          title="Format Snapshot"
          status={formatsModule.status}
          computedAt={formatsModule.computed_at}
          methodology={formatsModule.methodology}
          attribution={formatsModule.attribution}
        />
        <MtgFormatCards rows={fRow ? [fRow] : []} />
      </div>
      <div className="mb-10">
        <MtgModuleHeader
          title="Ban List & Legality"
          status={banlistModule.status}
          computedAt={banlistModule.computed_at}
          methodology={banlistModule.methodology}
          attribution={banlistModule.attribution}
        />
        <MtgBanlistTable rows={bRow ? [bRow] : []} />
      </div>
      <MtgHonestPanel title="Performance tiers not covered yet">
        <p className="mb-2">
          Ban/legality tracking for {formatDisplayName} above comes from the
          same Scryfall legalities feed every format on this page reads.
          Win-rate-backed performance tiers would need a permitted
          tournament or telemetry source we don&rsquo;t have yet for{" "}
          {formatDisplayName} — we won&rsquo;t invent one. For today,
          untapped.gg is the cite-only resource we point to; we don&rsquo;t
          ingest or re-host its numbers.
        </p>
        <a
          href="https://mtga.untapped.gg"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-brass hover:text-brass-bright transition-colors"
        >
          untapped.gg
          <ExternalLink size={11} />
        </a>
      </MtgHonestPanel>
    </>
  );
}

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
  const {
    commander_tiers,
    limited_tiers,
    banlist,
    calendar,
    formats,
    constructed_tiers,
    edh_tournaments,
    meta_movers,
  } = payload.modules;

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
    ...(constructed_tiers
      ? [
          {
            label: "Constructed",
            href: "#constructed",
            count:
              constructed_tiers.status === "pending_key"
                ? "pending"
                : `${constructed_tiers.rows.length}`,
          },
        ]
      : []),
    { label: "Bans", href: "#banlist", count: `${banlist.rows.length}` },
    { label: "Calendar", href: "#calendar", count: `${calendar.rows.length}` },
    { label: "Formats", href: "#formats", count: `${formats.rows.length}` },
    { label: "Wildcards", href: "/mtg/wildcards", count: "calc" },
    { label: "Methodology", href: "/mtg/methodology", count: "receipts" },
  ];

  // ── Meta lens — per-format slices reused across the Commander/Brawl axis
  // and the Standard/Pioneer/Modern axis. "premierdraft"/"sealed" aren't
  // module format ids the engine emits at all (Limited isn't format-scoped;
  // Sealed's win rates aren't populated by 17lands yet) — those two lenses
  // are handled as their own standalone sections below. "historic"/
  // "timeless" ARE real format ids on formats/banlist (Scryfall legalities),
  // just without a commander_tiers or constructed_tiers slice — their lens
  // renders the real Format Snapshot + Ban List world via
  // HistoricFormatWorld below rather than a pure honest panel. ────────────
  const commanderRows = commander_tiers.rows.filter((r) => r.format === "commander");
  const competitiveBrawlRows = commander_tiers.rows.filter(
    (r) => r.format === "competitivebrawl"
  );
  const standardBrawlRows = commander_tiers.rows.filter(
    (r) => r.format === "standardbrawl"
  );
  const constructedRowsFor = (id: string) =>
    constructed_tiers ? constructed_tiers.rows.filter((r) => r.format === id) : [];
  // Historic/Timeless chip counts: real legal-set counts from the Format
  // Snapshot module (Scryfall legalities) — omitted entirely when the row
  // isn't there rather than showing an invented/zero count.
  const legalSetCountFor = (id: string) =>
    formats.rows.find((r) => r.format === id)?.legal_sets.length;

  const lenses: MtgMetaLensOption[] = [
    { id: "all", label: "All" },
    {
      id: "standard",
      label: "Standard",
      count: constructedRowsFor("standard").length || undefined,
    },
    { id: "premierdraft", label: "Premier Draft", count: publishedSet?.overall_rows.length },
    { id: "sealed", label: "Sealed" },
    { id: "historic", label: "Historic", count: legalSetCountFor("historic") },
    { id: "timeless", label: "Timeless", count: legalSetCountFor("timeless") },
    {
      id: "standardbrawl",
      label: "Brawl",
      count: standardBrawlRows.length || undefined,
    },
    {
      id: "competitivebrawl",
      label: "Competitive Brawl",
      count: competitiveBrawlRows.length || undefined,
    },
    { id: "commander", label: "Commander", count: commanderRows.length || undefined },
    {
      id: "pioneer",
      label: "Pioneer",
      count: constructedRowsFor("pioneer").length || undefined,
    },
    {
      id: "modern",
      label: "Modern",
      count: constructedRowsFor("modern").length || undefined,
    },
  ];

  // Sealed honest-panel context line, precomputed (not built inline in JSX)
  // so the real per-set numbers never collide with JSX's line-based
  // whitespace collapsing.
  const sealedContextLine = publishedSet
    ? `17lands treats Sealed as a genuine, separate event type — ${publishedSet.set_name} logged ${(publishedSet.sealed_total_games ?? 0).toLocaleString("en-US")} ever-drawn Sealed games this run, against ${publishedSet.total_games.toLocaleString("en-US")} for Premier Draft (the Draft Ranker above), but its public no-auth endpoint currently returns NO per-card win-rate stats for Sealed — even when the game-count total is non-zero.`
    : "17lands treats Sealed as a genuine, separate event type, queried under the same CC BY 4.0 license we already cite for the Draft Ranker above, but its public no-auth endpoint currently returns NO per-card win-rate stats for Sealed — even when the game-count total is non-zero.";

  const sections: MtgMetaLensSection[] = [
    {
      id: "meta-movers",
      label: "What changed since last publish",
      formats: ["all"],
      node: (
        <div className="mb-14">
          <MtgModuleHeader
            title="What Changed"
            status={meta_movers?.status ?? "pending_history"}
            computedAt={meta_movers?.computed_at ?? payload.computed_at}
            methodology={
              meta_movers?.methodology ??
              "Day-over-day diff of this hub's own two most recently published runs — pending a second publish to compare against."
            }
            attribution={meta_movers?.attribution ?? []}
            note={
              meta_movers && meta_movers.status === "published" && meta_movers.rows.length > 0
                ? `${meta_movers.rows.length} changes`
                : undefined
            }
          />
          <MtgMetaMoversTable
            status={meta_movers?.status ?? "pending_history"}
            computedAt={meta_movers?.computed_at ?? payload.computed_at}
            rows={meta_movers?.rows ?? []}
          />
        </div>
      ),
    },
    {
      id: "draft-hero",
      label: "Draft Ranker hero link",
      formats: ["all", "premierdraft"],
      node: (
        // Draft Ranker — the hero module (METAHUB-SPEC.md ADDENDUM, wave 2)
        <Link
          href="/mtg/draft"
          className="group flex items-center justify-between gap-6 border border-brass/40 bg-brass-dim rounded-lg px-6 py-5 mb-14 hover:border-brass/70 transition-colors"
        >
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-widest text-brass mb-1.5">
              The draft ranker
            </p>
            <p className="mtg-display text-xl sm:text-2xl leading-snug mb-1">
              Every card with enough games graded S–F from real 17lands win rates
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
                {publishedSet.overall_rows.length.toLocaleString("en-US")} tracked ·{" "}
                {scoredRowCount(publishedSet.overall_rows).toLocaleString("en-US")} scored
              </span>
            )}
            <ArrowRight
              size={20}
              className="text-brass group-hover:translate-x-1 transition-transform"
            />
          </div>
        </Link>
      ),
    },
    {
      id: "tiers",
      label: "Commander & Brawl Tiers (all formats)",
      formats: ["all"],
      node: (
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
      ),
    },
    {
      id: "tiers-commander",
      label: "Commander world",
      formats: ["commander"],
      node: (
        <div className="mb-16 scroll-mt-24">
          <CommanderFormatWorld
            formatId="commander"
            formatDisplayName={formatLabel("commander")}
            commanderTiersModule={commander_tiers}
            formatsModule={formats}
            banlistModule={banlist}
            rows={commanderRows}
            emptyNote="No Commander rows in the current Archidekt scan window — the corpus refreshes daily."
          />
        </div>
      ),
    },
    {
      id: "edh-tournaments",
      label: "cEDH Tournament Results",
      formats: ["all", "commander"],
      node: (
        <div id="edh-tournaments" className="mb-16 scroll-mt-24">
          <MtgModuleHeader
            title="cEDH Tournament Results"
            status={edh_tournaments?.status ?? "pending_key"}
            computedAt={edh_tournaments?.computed_at ?? banlist.computed_at}
            methodology={
              edh_tournaments?.methodology ??
              "Real Commander/cEDH tournament results from topdeck.gg's public tournament-results API — pending a topdeck.gg key."
            }
            attribution={edh_tournaments?.attribution ?? []}
            note={
              edh_tournaments && edh_tournaments.rows.length > 0
                ? `${edh_tournaments.rows.length} events`
                : undefined
            }
          />
          {edh_tournaments && edh_tournaments.rows.length > 0 ? (
            <MtgEdhTournamentTable rows={edh_tournaments.rows} />
          ) : (
            <MtgHonestPanel
              title={
                edh_tournaments ? "No tournament results this run" : "Pending a topdeck.gg key"
              }
            >
              {edh_tournaments
                ? "topdeck.gg didn't return usable EDH tournament results this run — check back after the next refresh; nothing here is invented while data is unavailable."
                : "Real cEDH tournament results are pending a topdeck.gg key (a free 2-minute signup) — real events replace this panel automatically the moment it's configured, and this module never ships an invented row in the meantime."}
            </MtgHonestPanel>
          )}
        </div>
      ),
    },
    {
      id: "tiers-competitivebrawl",
      label: "Competitive Brawl world",
      formats: ["competitivebrawl"],
      node: (
        <div className="mb-16 scroll-mt-24">
          <CommanderFormatWorld
            formatId="competitivebrawl"
            formatDisplayName={formatLabel("competitivebrawl")}
            commanderTiersModule={commander_tiers}
            formatsModule={formats}
            banlistModule={banlist}
            rows={competitiveBrawlRows}
            emptyNote="No Competitive Brawl rows in the current Archidekt scan window — the corpus refreshes daily."
          />
        </div>
      ),
    },
    {
      id: "tiers-standardbrawl",
      label: "Brawl world",
      formats: ["standardbrawl"],
      node: (
        <div className="mb-16 scroll-mt-24">
          <CommanderFormatWorld
            formatId="standardbrawl"
            formatDisplayName={formatLabel("standardbrawl")}
            commanderTiersModule={commander_tiers}
            formatsModule={formats}
            banlistModule={banlist}
            rows={standardBrawlRows}
            emptyNote="No Brawl rows in the current Archidekt scan window — the corpus refreshes daily."
          />
        </div>
      ),
    },
    {
      id: "limited",
      label: "Limited Tier List",
      formats: ["all", "premierdraft"],
      node: (
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
      ),
    },
    // Constructed tiers (Standard/Pioneer/Modern, topdeck.gg) — additive
    // module absent from every payload published before it shipped; renders
    // nothing at all in the "all" lens when the key is missing (see the
    // `constructed_tiers &&` guard below), never an error. The per-format
    // lenses below render an honest inline panel instead of nothing when
    // it's absent — see ConstructedFormatWorld's doc comment.
    ...(constructed_tiers
      ? [
          {
            id: "constructed",
            label: "Constructed Tiers (all formats)",
            formats: ["all"],
            node: (
              <div id="constructed" className="mb-16 scroll-mt-24">
                <MtgModuleHeader
                  title="Constructed Tiers"
                  status={constructed_tiers.status}
                  computedAt={constructed_tiers.computed_at}
                  methodology={constructed_tiers.methodology}
                  attribution={constructed_tiers.attribution}
                  note={
                    constructed_tiers.status === "pending_key"
                      ? undefined
                      : `${constructed_tiers.rows.length} archetypes/decks`
                  }
                />
                {constructed_tiers.status === "pending_key" ||
                constructed_tiers.rows.length === 0 ? (
                  <div className="flex items-start gap-3 rounded-lg border border-border bg-surface px-5 py-4">
                    <Info size={15} className="text-brass mt-0.5 shrink-0" />
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-wider text-brass mb-1">
                        {constructed_tiers.status === "pending_key"
                          ? "Pending a topdeck.gg key"
                          : "No tournament results this run"}
                      </p>
                      <p className="text-text-secondary text-xs leading-relaxed max-w-2xl">
                        {constructed_tiers.status === "pending_key"
                          ? "Tournament-backed Standard/Pioneer/Modern tiers are pending a topdeck.gg key (a free 2-minute signup) — real tiers replace this panel automatically the moment it's configured, and this module never ships an invented row in the meantime."
                          : "topdeck.gg didn’t return usable tournament results this run — check back after the next refresh; nothing here is invented while data is unavailable."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <MtgConstructedTierTable rows={constructed_tiers.rows} />
                )}
              </div>
            ),
          } satisfies MtgMetaLensSection,
        ]
      : []),
    {
      id: "constructed-standard",
      label: "Standard world",
      formats: ["standard"],
      node: (
        <div className="mb-16 scroll-mt-24">
          <ConstructedFormatWorld
            formatId="standard"
            formatDisplayName={formatLabel("standard")}
            formatsModule={formats}
            banlistModule={banlist}
            constructedModule={constructed_tiers}
          />
        </div>
      ),
    },
    {
      id: "constructed-pioneer",
      label: "Pioneer world",
      formats: ["pioneer"],
      node: (
        <div className="mb-16 scroll-mt-24">
          <ConstructedFormatWorld
            formatId="pioneer"
            formatDisplayName={formatLabel("pioneer")}
            formatsModule={formats}
            banlistModule={banlist}
            constructedModule={constructed_tiers}
          />
        </div>
      ),
    },
    {
      id: "constructed-modern",
      label: "Modern world",
      formats: ["modern"],
      node: (
        <div className="mb-16 scroll-mt-24">
          <ConstructedFormatWorld
            formatId="modern"
            formatDisplayName={formatLabel("modern")}
            formatsModule={formats}
            banlistModule={banlist}
            constructedModule={constructed_tiers}
          />
        </div>
      ),
    },
    {
      id: "banlist",
      label: "Ban List & Legality Tracker (all formats)",
      formats: ["all"],
      node: (
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
      ),
    },
    {
      id: "calendar",
      label: "Rotation & Set Calendar",
      formats: ["all", "premierdraft", "standard"],
      node: (
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
      ),
    },
    {
      id: "formats",
      label: "Format Snapshots (all formats)",
      formats: ["all"],
      node: (
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
      ),
    },
    {
      id: "sealed-roadmap",
      label: "Sealed status",
      formats: ["sealed"],
      node: (
        <div className="mb-16 scroll-mt-24">
          <h2 className="mtg-display text-2xl sm:text-[1.7rem] leading-tight mb-4">
            Sealed
          </h2>
          <MtgHonestPanel title="17lands serves Sealed — win rates aren't live yet">
            <p className="mb-2">
              {sealedContextLine} This module ships honest-absent rather
              than a page of every card graded{" "}
              <code className="text-brass">unrated</code>, and flips on
              automatically the moment 17lands enables real Sealed win
              rates.
            </p>
            <a
              href="https://www.17lands.com/about"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-brass hover:text-brass-bright transition-colors"
            >
              17lands.com
              <ExternalLink size={11} />
            </a>
          </MtgHonestPanel>
        </div>
      ),
    },
    {
      id: "world-historic",
      label: "Historic world",
      formats: ["historic"],
      node: (
        <div className="mb-16 scroll-mt-24">
          <HistoricFormatWorld
            formatId="historic"
            formatDisplayName={formatLabel("historic")}
            formatsModule={formats}
            banlistModule={banlist}
          />
        </div>
      ),
    },
    {
      id: "world-timeless",
      label: "Timeless world",
      formats: ["timeless"],
      node: (
        <div className="mb-16 scroll-mt-24">
          <HistoricFormatWorld
            formatId="timeless"
            formatDisplayName={formatLabel("timeless")}
            formatsModule={formats}
            banlistModule={banlist}
          />
        </div>
      ),
    },
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

        {/* Meta lens — pick a format's world; rail sits above the module
            index nav (METAHUB-SPEC.md's lens directive). */}
        <MtgMetaLens
          lenses={lenses}
          leading={
            <>
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
            </>
          }
          sections={sections}
        />

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
