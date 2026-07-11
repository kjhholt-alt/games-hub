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

const MODULES = [
  {
    title: "Commander & Brawl Tiers",
    measures:
      "Decklist popularity and momentum for a commander — how often it appears in the Archidekt decklist corpus and how that share is changing week over week. This is NOT a win rate.",
    formula:
      "Tier = frequency rank within the corpus, weighted by momentum (current-window share vs. the prior window). A commander climbing fast can outrank a more common one that's flat or declining. Color identity and top-inclusion cards are read from the same decklists.",
    thresholds:
      "confidence \"high\" at 500+ decklists in the corpus, \"medium\" at 100-499, \"low\" under 100, \"sample\" under 25 or when the payload itself is a hand-written fixture.",
  },
  {
    title: "Limited Tier List",
    measures:
      "Real card win rates for the current premier set, from actual recorded games — the one module backed by true performance data rather than a popularity proxy.",
    formula:
      "Tier cuts: S at 58%+ win rate, A at 54%+, B at 50%+, C at 46%+, otherwise D. Win rate is games-won divided by games-seen for decks containing the card, taken directly from the public dataset.",
    thresholds:
      "confidence \"high\" at 5,000+ games seen, \"medium\" at 1,000-4,999, \"low\" at 200-999, \"sample\" under 200 games.",
  },
  {
    title: "Ban List & Legality Tracker",
    measures:
      "Per-format banned/suspended cards and the most recent B&R (banned & restricted) change, cross-linked to the Wizards or Commander Rules Committee announcement that explains why.",
    formula:
      "No scoring — this module mirrors Scryfall's machine-readable legalities field directly, which is itself downstream of the official announcements. It's a deterministic fact lookup, not a computed statistic.",
    thresholds:
      "confidence is \"high\" whenever Scryfall's legality and the linked announcement agree; a mismatch (rare, usually a propagation lag right after an announcement) drops it to \"medium\" until the next Scryfall sync confirms it.",
  },
  {
    title: "Rotation & Set Calendar",
    measures:
      "Upcoming paper and Arena set releases plus Standard/Alchemy rotation dates.",
    formula:
      "Pulled straight from Scryfall's sets endpoint — release dates and Standard-legal windows are given, not derived. Near-zero maintenance by design.",
    thresholds:
      "confidence \"high\" for confirmed dates already on Scryfall; \"medium\" for dates that are still provisional (e.g. an announced set without a locked calendar slot yet).",
  },
  {
    title: "Format Snapshots",
    measures:
      "One card per format: which sets are legal, the last B&R change, and our honest coverage state for that format.",
    formula:
      "Editorial, not computed — coverage_state says plainly whether we have live tiers for a format (Commander/Brawl, from the decklist-momentum module) or whether tiers are pending a data source we don't have yet (Standard/Pioneer/Modern, pending the topdeck.gg key).",
    thresholds:
      "N/A — this module states plainly where our own coverage stands rather than being scored.",
  },
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
      "Limited card win rates and sample counts, from 17lands' public game-data exports. Licensed CC BY 4.0 — attributed here and on every Limited row.",
    url: "https://www.17lands.com/about",
  },
  {
    name: "Archidekt",
    detail:
      "Commander/Brawl decklist search, used at low volume with paging and aggressive caching out of courtesy to their API — \"Decklists via Archidekt\" plus a link back to the deck on every row that cites it.",
    url: "https://archidekt.com",
  },
  {
    name: "topdeck.gg",
    detail:
      "Real tournament results for constructed formats. The client is built but disabled until an API key is provisioned — modules that would use it currently render an honest \"tiers pending\" state instead of a number. Full credit and a link-back will show on every row once it's live.",
    url: "https://topdeck.gg",
  },
];

export default function MtgMethodologyPage() {
  const payload = getMtgMeta();

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
          What each module actually measures, in plain language, and exactly
          what it takes for a row to earn each confidence level. If we can&rsquo;t
          measure something honestly yet, the hub says so instead of guessing.
        </p>

        <div className="space-y-8 mb-14">
          {MODULES.map((m) => (
            <div
              key={m.title}
              className="bg-surface border border-border rounded-2xl p-6"
            >
              <h2 className="text-lg font-semibold mb-3">{m.title}</h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-mono uppercase text-text-secondary mb-1">
                    What it measures
                  </dt>
                  <dd className="leading-relaxed">{m.measures}</dd>
                </div>
                <div>
                  <dt className="text-xs font-mono uppercase text-text-secondary mb-1">
                    Formula
                  </dt>
                  <dd className="leading-relaxed text-text-secondary">
                    {m.formula}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-mono uppercase text-text-secondary mb-1">
                    Confidence thresholds
                  </dt>
                  <dd className="leading-relaxed text-text-secondary">
                    {m.thresholds}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

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
              We never imply a win rate we don&rsquo;t have. Where a tracker
              (untapped.gg, MTGGoldfish) has real telemetry we don&rsquo;t,
              we link to them by name instead of guessing at a number.
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
