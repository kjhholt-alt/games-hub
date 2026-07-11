import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getMtgMeta } from "@/lib/mtg";

export const metadata: Metadata = {
  title: "MTG Meta Hub Methodology",
  description:
    "How BuildKit's MTG Meta Hub computes Commander tiers, Limited ratings, and ban-list tracking — formulas, confidence thresholds, and full source attribution.",
  alternates: { canonical: "https://play.buildkit.store/mtg/methodology" },
};

export const revalidate = 3600;

const MODULE_TITLE: Record<string, string> = {
  commander_tiers: "Commander & Brawl Tiers",
  limited_tiers: "Limited Tier List",
  banlist: "Ban List & Legality Tracker",
  calendar: "Rotation & Set Calendar",
  formats: "Format Snapshots",
};

const MODULE_ORDER = [
  "commander_tiers",
  "limited_tiers",
  "banlist",
  "calendar",
  "formats",
];

const ATTRIBUTION = [
  {
    name: "Scryfall",
    detail:
      "Card data, color identity, legalities, and set/rotation dates — pulled from Scryfall's public bulk data with a custom User-Agent, cached at least 24 hours per Scryfall's guidance to add value rather than mirror the API.",
    url: "https://scryfall.com/docs/api",
  },
  {
    name: "17lands",
    detail:
      "Limited card win rates and sample counts, from 17lands' public PremierDraft card-ratings export. Licensed CC BY 4.0 — attributed here and on every Limited row.",
    url: "https://www.17lands.com/about",
  },
  {
    name: "Archidekt",
    detail:
      "Commander/Competitive Brawl decklist search, used at low volume with paging and aggressive caching out of courtesy to their API — \"Decklists via Archidekt\" on every commander-tier row, each linking straight to the real decklist it was computed from.",
    url: "https://archidekt.com",
  },
  {
    name: "topdeck.gg",
    detail:
      "Real tournament results for constructed formats. The client is built but disabled until an API key is provisioned — Standard/Pioneer/Modern currently render an honest \"tiers pending tournament key\" coverage state instead of a number. Full credit and a link-back will show on every row once it's live.",
    url: "https://topdeck.gg",
  },
];

export default function MtgMethodologyPage() {
  const payload = getMtgMeta();
  const modules = payload?.modules;

  return (
    <main className="min-h-screen">
      <SiteHeader />

      <section className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
        <div className="flex items-center gap-2 text-cyan text-xs font-mono mb-3">
          <ShieldCheck size={14} />
          THE HONESTY RAIL
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          MTG Meta Hub Methodology
        </h1>
        <p className="text-text-secondary max-w-2xl mb-10">
          What each module actually measures, straight from the engine that
          computed it — not a paraphrase. If we can&rsquo;t measure something
          honestly yet, the module says so instead of guessing.
        </p>

        {modules ? (
          <div className="space-y-6 mb-14">
            {MODULE_ORDER.map((key) => {
              const mod = modules[key as keyof typeof modules];
              return (
                <div
                  key={key}
                  className="bg-surface border border-border rounded-2xl p-6"
                >
                  <h2 className="text-lg font-semibold mb-2">
                    {MODULE_TITLE[key] ?? key}
                  </h2>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {mod.methodology}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-text-secondary mt-3">
                    {mod.attribution.map((a) => (
                      <span
                        key={a}
                        className="rounded px-1.5 py-0.5 border border-border"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-text-secondary mb-14">
            MTG meta data is unavailable right now — check back shortly.
          </p>
        )}

        <div className="mb-14">
          <h2 className="text-xl font-bold mb-4">Attribution</h2>
          <div className="space-y-4">
            {ATTRIBUTION.map((a) => (
              <div
                key={a.name}
                className="border-b border-border last:border-0 pb-4 last:pb-0"
              >
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-cyan hover:underline"
                >
                  {a.name}
                </a>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                  {a.detail}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-secondary mt-4">
            Card images via Scryfall.
          </p>
        </div>

        <div className="bg-cyan-dim border border-cyan/30 rounded-2xl p-6 mb-14">
          <h2 className="text-lg font-semibold mb-2">The honesty promise</h2>
          <ul className="text-sm text-text-secondary space-y-2 leading-relaxed list-disc list-inside">
            <li>
              Every row carries its sources, sample size, computed-at
              timestamp, and a confidence badge — high, medium, low, or
              sample.
            </li>
            <li>
              Low-sample rows render visibly faded, with the count shown
              rather than hidden.
            </li>
            <li>
              We never imply a win rate we don&rsquo;t have. Limited cards
              17lands hasn&rsquo;t recorded games for render{" "}
              <code className="text-cyan">unrated</code>, never a guessed
              tier. Where a tracker (untapped.gg, MTGGoldfish) has real
              telemetry we don&rsquo;t, we link to them by name instead of
              guessing at a number.
            </li>
            <li>
              A dead data source ships its module with the last good data and
              an honest stale stamp — it never invents a fresh-looking
              number.
            </li>
            <li>
              Nothing from untapped.gg, MTGGoldfish, AetherHub, Moxfield,
              EDHREC, or MTGA Zone is fetched, re-hosted, or re-published as
              ours. We cite and link, never ingest.
            </li>
            {payload && (
              <li>
                This payload&rsquo;s status is currently{" "}
                <code className="text-cyan">{payload.status}</code> — the
                page shows a SAMPLE DATA banner whenever it isn&rsquo;t{" "}
                <code className="text-cyan">published</code>.
              </li>
            )}
          </ul>
        </div>

        <p className="text-sm text-text-secondary mb-4">
          <Link
            href="/mtg"
            className="inline-flex items-center gap-1 text-cyan hover:underline"
          >
            <ArrowLeft size={13} />
            Back to the MTG Meta Hub
          </Link>
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
