// ─── BuildKit Brief editions reader ──────────────────────────────────────────
//
// The buildkit-brief engine writes grounded, auto-written report editions to
// public/editions.json. Each edition is "newsletter-shaped": a title, a set of
// per-world sections, and items that each trace to a PRIMARY source with a
// freshness stamp. The PUBLIC edition is confirmed-only (no personal data).
//
// The gate: only editions with status === "published" are ever shown. A draft
// sits in editions.json invisibly until it is approved (status flipped) and
// pushed — see buildkit-brief's `publish` command.

import fs from "fs";
import path from "path";

export interface EditionSource {
  name: string;
  url: string;
  stamp: string;
  freshness: string;
}

export interface EditionItem {
  headline: string;
  summary: string;
  bullets: string[];
  kind: string; // patch | event | news | price | meta
  confidence: string; // confirmed | rumor
  published: string | null;
  source: EditionSource;
  crosslink: string | null;
}

export interface EditionSection {
  world_key: string;
  world_name: string;
  emoji: string;
  blurb: string;
  items: EditionItem[];
  rumors: EditionItem[];
  buzz: { title: string; url: string; momentum: number; subreddits: string[] } | null;
  character: string | null;
  character_note: string;
  crosslink: string | null;
}

export interface Edition {
  schema: string;
  slug: string;
  edition: string; // "public" | "personal"
  status: string; // "draft" | "published"
  date: string;
  title: string;
  subtitle: string;
  generated_utc: string;
  sources_count: number;
  total_items: number;
  newsletter: { subject: string; preview: string; from_name: string };
  sections: EditionSection[];
  grounding_note: string;
}

interface EditionsFile {
  schema?: string;
  items?: Edition[];
}

const EDITIONS_FILE = path.join(process.cwd(), "public", "editions.json");

function readFile(): EditionsFile | null {
  try {
    return JSON.parse(fs.readFileSync(EDITIONS_FILE, "utf-8")) as EditionsFile;
  } catch {
    return null;
  }
}

/** Published editions, newest first. Drafts are never returned. */
export function getEditions(): Edition[] {
  const data = readFile();
  if (!data?.items) return [];
  return data.items
    .filter((e) => e.status === "published" && e.edition === "public")
    .sort((a, b) => (b.generated_utc ?? "").localeCompare(a.generated_utc ?? ""));
}

export function getEdition(slug: string): Edition | null {
  return getEditions().find((e) => e.slug === slug) ?? null;
}

export function getPublishedSlugs(): string[] {
  return getEditions().map((e) => e.slug);
}
