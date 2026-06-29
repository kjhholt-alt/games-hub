// ─── News feed reader (content-radar bridge) ─────────────────────────────────
//
// games-hub gives content-radar a WEB publishing target. content-radar already
// writes a daily signal feed (feed/latest.json) that today only feeds clipforge
// video. We read that same file at build time and render it as a news page.
//
// IMPORTANT: content-radar items are UNVERIFIED Reddit signals, not facts — the
// feed itself says so. The page surfaces that caveat prominently.

import fs from "fs";
import path from "path";

/** One aggregated topic in the content-radar feed. */
export interface NewsItem {
  entity: string | null;
  title: string;
  source: string;
  url: string;
  domain: string | null;
  externalUrl: string | null;
  momentum: number;
  postCount: number;
  subCount: number;
  subreddits: string[];
  channelDisplay: string | null;
  ageHours: number | null;
}

export interface NewsFeed {
  generatedUtc: string | null;
  verified: boolean;
  verificationNotice: string | null;
  items: NewsItem[];
}

/**
 * Locations for the content-radar feed, in priority order:
 *  1. A copy vendored into this repo's public/ (what ships to Vercel).
 *  2. The sibling content-radar checkout, on a local dev machine only.
 *
 * The paths are kept statically scoped under process.cwd() so Next's file
 * tracer doesn't conclude the whole project is dynamically required.
 */
const VENDORED_FEED = path.join(process.cwd(), "public", "news-feed.json");
const SIBLING_FEED = path.join(
  process.cwd(),
  "..",
  "content-radar",
  "feed",
  "latest.json"
);

interface RawFeed {
  generated_utc?: string;
  verified?: boolean;
  verification_notice?: string;
  items?: RawItem[];
}

interface RawItem {
  entity?: string | null;
  title?: string;
  source?: string;
  url?: string;
  domain?: string | null;
  external_url?: string | null;
  momentum?: number;
  post_count?: number;
  sub_count?: number;
  subreddits?: string[];
  channel_display?: string | null;
  age_hours?: number | null;
}

/**
 * Read the content-radar feed from disk and normalize it. Returns an empty
 * (but well-formed) feed if no source file is present, so the page can render a
 * graceful empty state instead of crashing the build.
 */
export function getNewsFeed(limit = 24): NewsFeed {
  const raw = readRawFeed();
  if (!raw) {
    return {
      generatedUtc: null,
      verified: false,
      verificationNotice: null,
      items: [],
    };
  }

  const items: NewsItem[] = (raw.items ?? [])
    .map((it) => ({
      entity: it.entity ?? null,
      title: (it.title ?? "").trim(),
      source: it.source ?? "",
      url: it.url ?? "",
      domain: it.domain ?? null,
      externalUrl: it.external_url ?? null,
      momentum: typeof it.momentum === "number" ? it.momentum : 0,
      postCount: it.post_count ?? 0,
      subCount: it.sub_count ?? 0,
      subreddits: Array.isArray(it.subreddits) ? it.subreddits : [],
      channelDisplay: it.channel_display ?? null,
      ageHours: typeof it.age_hours === "number" ? it.age_hours : null,
    }))
    .filter((it) => it.title && it.url)
    .sort((a, b) => b.momentum - a.momentum)
    .slice(0, limit);

  return {
    generatedUtc: raw.generated_utc ?? null,
    verified: raw.verified ?? false,
    verificationNotice: raw.verification_notice ?? null,
    items,
  };
}

function readRawFeed(): RawFeed | null {
  // The vendored copy in public/ is what ships to production.
  const vendored = tryReadFeed(VENDORED_FEED);
  if (vendored) return vendored;
  // Local dev fallback: read straight from a sibling content-radar checkout.
  return tryReadFeed(SIBLING_FEED);
}

function tryReadFeed(file: string): RawFeed | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as RawFeed;
  } catch {
    return null;
  }
}
