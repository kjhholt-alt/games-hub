import type { Metadata } from "next";
import Link from "next/link";
import { Swords, BookOpen } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Hoi4TierBands } from "@/components/Hoi4TierBands";
import { Provenance } from "@/components/Provenance";
import { formatDate } from "@/lib/format";
import { networkDisplay } from "@/lib/fonts";
import { groupByTier, countByPath } from "@/lib/hoi4";
import { HOI4_NATIONS, HOI4_PATCH, HOI4_REVIEWED } from "@/data/hoi4-nations";

export const metadata: Metadata = {
  title: "HOI4 Nation Tier List & Focus Paths — Best Majors This Patch",
  description:
    "Hearts of Iron IV major-nation strategy meta: every major ranked S to C with its strongest focus path, signature picks, key research, and the one mistake that ends the run. Current-patch, single-player.",
  alternates: { canonical: "https://play.buildkit.store/hoi4" },
};

// Curated dataset (no live API) — revalidate daily so a data refresh ships.
export const revalidate = 86400;

export default function Hoi4Page() {
  const nations = HOI4_NATIONS;
  const groups = groupByTier(nations);
  const paths = countByPath(nations);
  const sTier = nations.filter((n) => n.tier === "S");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Hearts of Iron IV Major Nation Tier List",
    itemListElement: nations.map((n, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${n.name} (${n.tier}-Tier)`,
    })),
  };

  return (
    <main className={`min-h-screen ${networkDisplay.variable}`}>
      <SiteHeader />

      <section className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
        <div className="flex items-center gap-2 text-cyan text-xs font-mono mb-3">
          <Swords size={14} />
          MAJOR NATIONS · FOCUS PATHS · STRATEGY
        </div>
        <h1 className="network-display text-3xl sm:text-4xl tracking-tight mb-3">
          Hearts of Iron IV — Nation Meta
        </h1>
        <p className="text-text-secondary max-w-2xl mb-4">
          Every major power ranked S to C for the current single-player meta —
          with the strongest focus path, the signature pick the whole build is
          built around, the key research priority, and the one mistake that ends
          the run. Built from a hand-verified, current-patch playbook.
        </p>

        <div className="mb-10">
          <Provenance
            status="curated"
            freshness={`reviewed ${formatDate(HOI4_REVIEWED)}`}
            note={`${nations.length} majors · ${HOI4_PATCH}`}
            attribution={`Focus paths: ${paths.map((p) => `${p.count} ${p.label}`).join(", ")}`}
          />
        </div>

        {/* S-tier highlight */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {sTier.map((nation) => (
            <div
              key={nation.tag}
              className="bg-surface border border-border rounded-lg p-5"
            >
              <p className="text-xs font-mono text-text-secondary mb-1">
                S-TIER
              </p>
              <p className="text-lg font-bold">{nation.name}</p>
              <p className="text-sm font-medium leading-snug mt-1">
                {nation.focusPathName}
              </p>
            </div>
          ))}
        </div>

        <Hoi4TierBands nations={nations} />

        {/* Methodology / source */}
        <div className="bg-surface border border-border rounded-lg p-6 mt-12">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} className="text-cyan" />
            <h2 className="network-display text-lg">
              How this is ranked &amp; sourced
            </h2>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            Focus paths, signature picks, key research, pitfalls, and milestone
            targets are ported from a hand-maintained <strong>BuildKit HOI4
            playbook</strong> that web-verifies the live single-player meta and
            reads real focus ids straight from the game files for{" "}
            {HOI4_PATCH}. The <strong>S–C tier</strong> is an editorial strength
            rating — how forgiving and how strong a major is to take to a win in
            single-player — not a win-rate cut (HOI4 has no open win-rate API the
            way our Deadlock tier list does). Treat the tiers as a curated read
            and the build data as the real value. Multiplayer and modded metas
            differ; this is base-game, historical-AI single-player.
          </p>
        </div>

        <p className="text-sm text-text-secondary mt-4">
          {groups.length} tiers · {nations.length} major nations · base game,
          historical focus paths.
        </p>

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
