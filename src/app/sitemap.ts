import type { MetadataRoute } from "next";
import { getAllCommanderSlugs } from "@/lib/mtgCommanderPages";

const BASE = "https://play.buildkit.store";

/** One entry per commander detail page, generated from the payload at build
 * time rather than enumerated by hand — getAllCommanderSlugs() already
 * returns [] whenever the payload is missing or commander_tiers is empty
 * (the mid-repair corpus, 0 rows, today), so this never crashes or ships a
 * stale hard-coded list; a repopulated corpus (100+ rows) makes entries
 * appear on the next build with no code change required. */
function commanderEntries(now: Date): MetadataRoute.Sitemap {
  return getAllCommanderSlugs().map((slug) => ({
    url: `${BASE}/mtg/commander/${slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.5,
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${BASE}/tier-lists`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE}/mtg`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE}/mtg/draft`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${BASE}/mtg/cube`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE}/mtg/hob`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE}/mtg/wildcards`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE}/mtg/methodology`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE}/news`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    ...commanderEntries(now),
  ];
}
