// ─── Arena Wildcard Calculator — client-safe parsing + Scryfall resolution ──
//
// Zero Node dependencies (no `fs`) — safe to import from the "use client"
// components under /mtg/wildcards. Everything here runs in the browser:
// decklist parsing, Scryfall /cards/collection batching, localStorage
// caching, and the wildcard-math helpers. See src/app/mtg/wildcards/page.tsx
// for the page shell and METAHUB-SPEC.md's out-of-scope note (the wildcard
// calculator was explicitly out of scope for v1 but added by later
// directive) for the honesty rails this follows: card data ONLY from
// Scryfall, never guessed, unmatched cards always listed explicitly.

export type Rarity = "common" | "uncommon" | "rare" | "mythic";
export const RARITIES: Rarity[] = ["common", "uncommon", "rare", "mythic"];

export type WildcardCounts = Record<Rarity, number>;
export const EMPTY_WILDCARD_COUNTS: WildcardCounts = {
  common: 0,
  uncommon: 0,
  rare: 0,
  mythic: 0,
};

// ─── Decklist parsing ────────────────────────────────────────────────────────

export interface ParsedLine {
  rawName: string;
  /** Lowercase set code, when the line carried one, e.g. "mh2". */
  set?: string;
  collectorNumber?: string;
  count: number;
}

export interface CardEntry {
  name: string;
  count: number;
  set?: string;
  collectorNumber?: string;
}

/** Arena export section headers we tolerate and skip — never treated as a
 * card line, never an error. */
const HEADER_LINES = new Set([
  "deck",
  "sideboard",
  "commander",
  "companion",
  "maybeboard",
]);

/** "4 Card Name" or "4 Card Name (SET) 123" — the count is required, the
 * (SET) collector-number suffix is optional. Lines that don't match this
 * shape (blank lines, headers, anything unrecognized) are silently skipped
 * — tolerant parsing, never a thrown error over a pasted export. */
const LINE_RE = /^(\d+)\s+(.+)$/;
const SET_SUFFIX_RE = /^(.*\S)\s+\(([A-Za-z0-9]{2,5})\)\s+([A-Za-z0-9]+)$/;

export function parseArenaDecklist(text: string): ParsedLine[] {
  const lines: ParsedLine[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (HEADER_LINES.has(line.toLowerCase())) continue;
    const m = LINE_RE.exec(line);
    if (!m) continue;
    const count = parseInt(m[1], 10);
    if (!Number.isFinite(count) || count <= 0) continue;
    const rest = m[2].trim();
    const withSet = SET_SUFFIX_RE.exec(rest);
    if (withSet) {
      lines.push({
        rawName: withSet[1].trim(),
        set: withSet[2].toLowerCase(),
        collectorNumber: withSet[3],
        count,
      });
    } else {
      lines.push({ rawName: rest, count });
    }
  }
  return lines;
}

/** Every basic land name (including snow-covered) — these cost zero
 * wildcards in Arena and are excluded from the resolved/unmatched lists
 * entirely rather than shown as "unrated". */
const BASIC_LAND_NAMES = new Set([
  "plains",
  "island",
  "swamp",
  "mountain",
  "forest",
  "wastes",
  "snow-covered plains",
  "snow-covered island",
  "snow-covered swamp",
  "snow-covered mountain",
  "snow-covered forest",
  "snow-covered wastes",
]);

export function isBasicLand(name: string): boolean {
  return BASIC_LAND_NAMES.has(name.trim().toLowerCase());
}

/** Merge parsed lines into one entry per card name (main deck + sideboard
 * combined — wildcards are spent per card name, not per printing/zone).
 * Basic lands are dropped here (free, never counted). When the same card
 * name appears more than once with different (SET) codes across the
 * pasted list, the FIRST exact printing seen wins — stated on the page as
 * the multi-printing rule. */
export function mergeByName(lines: ParsedLine[]): CardEntry[] {
  const byKey = new Map<string, CardEntry>();
  for (const line of lines) {
    if (isBasicLand(line.rawName)) continue;
    const key = line.rawName.toLowerCase();
    const existing = byKey.get(key);
    if (existing) {
      existing.count += line.count;
      if (!existing.set && line.set) {
        existing.set = line.set;
        existing.collectorNumber = line.collectorNumber;
      }
    } else {
      byKey.set(key, {
        name: line.rawName,
        count: line.count,
        set: line.set,
        collectorNumber: line.collectorNumber,
      });
    }
  }
  return [...byKey.values()];
}

export function countBasicLands(lines: ParsedLine[]): number {
  return lines.reduce((sum, l) => (isBasicLand(l.rawName) ? sum + l.count : sum), 0);
}

// ─── Rarity resolution (Scryfall) ────────────────────────────────────────────

export interface ResolvedCard {
  name: string;
  count: number;
  rarity: Rarity;
  /** "exact-printing" when a (SET)/collector number pinned one printing,
   * "lowest-of-printings" when a name-only line fell back to the lowest
   * rarity across every printing Scryfall returns, "cache" when reused from
   * a fresh localStorage entry (either resolution kind). */
  resolution: "exact-printing" | "lowest-of-printings" | "cache";
}

export interface UnmatchedCard {
  name: string;
  count: number;
  set?: string;
}

export interface ResolveResult {
  resolved: ResolvedCard[];
  unmatched: UnmatchedCard[];
}

const KNOWN_RARITIES = new Set<string>(RARITIES);

function isKnownRarity(r: string): r is Rarity {
  return KNOWN_RARITIES.has(r);
}

const SCRYFALL_COLLECTION_URL = "https://api.scryfall.com/cards/collection";
const SCRYFALL_SEARCH_URL = "https://api.scryfall.com/cards/search";

/** Scryfall's own guidance for unauthenticated clients: batch /cards/collection
 * lookups (max 75 identifiers per request) and space every request out —
 * this calculator has no API key, so it's the politest client it can be. */
const BATCH_SIZE = 75;
const REQUEST_SPACING_MS = 120;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

type CollectionIdentifier =
  | { name: string }
  | { name: string; set: string }
  | { set: string; collector_number: string };

/** {set, collector_number} pins one exact printing when both are known
 * (Arena's own export format always includes both); {name, set} is the
 * fallback when only a set code is present; name-only when neither is —
 * see fetchLowestRarityAcrossPrints for how that case resolves. */
function identifierFor(entry: CardEntry): CollectionIdentifier {
  if (entry.set && entry.collectorNumber) {
    return { set: entry.set, collector_number: entry.collectorNumber };
  }
  if (entry.set) return { name: entry.name, set: entry.set };
  return { name: entry.name };
}

interface CollectionResponse {
  data: { name: string; rarity: string; set: string }[];
  not_found: CollectionIdentifier[];
}

async function fetchCollectionBatch(
  identifiers: CollectionIdentifier[]
): Promise<CollectionResponse> {
  const res = await fetch(SCRYFALL_COLLECTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifiers }),
  });
  if (!res.ok) {
    throw new Error(`Scryfall collection lookup failed (${res.status})`);
  }
  return res.json();
}

/** Lowest rarity across every printing Scryfall returns for a name-only
 * card — the first page of `unique=prints` (up to 175 printings, Scryfall's
 * per-page cap). This is the honest fallback stated on the wildcards page:
 * without an exact (SET) code we can't know which printing the player
 * means, so we assume the CHEAPEST one rather than guessing at the most
 * recent — never overcounts wildcards. */
async function fetchLowestRarityAcrossPrints(name: string): Promise<Rarity | null> {
  const q = `!"${name}"`;
  const url = `${SCRYFALL_SEARCH_URL}?q=${encodeURIComponent(q)}&unique=prints&order=released`;
  const res = await fetch(url);
  if (res.status === 404) return null; // Scryfall's "no cards found" response
  if (!res.ok) {
    throw new Error(`Scryfall print search failed (${res.status})`);
  }
  const body: { data?: { rarity: string }[] } = await res.json();
  const rarities = (body.data ?? [])
    .map((c) => c.rarity)
    .filter(isKnownRarity);
  if (rarities.length === 0) return null;
  return rarities.reduce((min, r) =>
    RARITIES.indexOf(r) < RARITIES.indexOf(min) ? r : min
  );
}

// ─── localStorage caching (24h TTL, keyed by name + resolved set) ───────────

const CACHE_KEY = "mtg-wildcards:rarity-cache:v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry {
  rarity: Rarity;
  cachedAt: number;
  resolution: ResolvedCard["resolution"];
}

function cacheKeyFor(entry: CardEntry): string {
  return entry.set ? `${entry.name.toLowerCase()}::${entry.set}` : entry.name.toLowerCase();
}

function loadCache(): Record<string, CacheEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, CacheEntry>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage can throw (quota, private browsing) -- caching is only
    // an optimization, never required for correct results.
  }
}

function isFresh(entry: CacheEntry, now: number): boolean {
  return now - entry.cachedAt < CACHE_TTL_MS;
}

/** The orchestrator: resolves every parsed card entry to a rarity, batching
 * exact-printing lookups through /cards/collection (<=75 identifiers per
 * request) and falling back to the lowest-rarity-across-prints search for
 * name-only lines — both sequential with a polite spacing between every
 * Scryfall request, both cached in localStorage for 24h. Cards Scryfall
 * can't identify land in `unmatched`, never a guessed rarity. */
export async function resolveWildcards(entries: CardEntry[]): Promise<ResolveResult> {
  const now = Date.now();
  const cache = loadCache();
  const resolved: ResolvedCard[] = [];
  const unmatched: UnmatchedCard[] = [];
  const pendingExact: CardEntry[] = [];
  const pendingAmbiguous: CardEntry[] = [];

  for (const entry of entries) {
    const cached = cache[cacheKeyFor(entry)];
    if (cached && isFresh(cached, now)) {
      resolved.push({ name: entry.name, count: entry.count, rarity: cached.rarity, resolution: "cache" });
      continue;
    }
    if (entry.set) pendingExact.push(entry);
    else pendingAmbiguous.push(entry);
  }

  const batches = chunk(pendingExact, BATCH_SIZE);
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const { data } = await fetchCollectionBatch(batch.map(identifierFor));
    // Match responses back by (name, set) rather than assuming positional
    // alignment with the request — Scryfall's not_found entries can shift
    // the index correspondence.
    for (const entry of batch) {
      const match = data.find(
        (c) =>
          c.name.toLowerCase() === entry.name.toLowerCase() &&
          (!entry.set || c.set.toLowerCase() === entry.set.toLowerCase())
      );
      if (match && isKnownRarity(match.rarity)) {
        resolved.push({ name: entry.name, count: entry.count, rarity: match.rarity, resolution: "exact-printing" });
        cache[cacheKeyFor(entry)] = { rarity: match.rarity, cachedAt: now, resolution: "exact-printing" };
      } else {
        unmatched.push({ name: entry.name, count: entry.count, set: entry.set });
      }
    }
    if (i < batches.length - 1) await sleep(REQUEST_SPACING_MS);
  }

  for (let i = 0; i < pendingAmbiguous.length; i++) {
    const entry = pendingAmbiguous[i];
    const rarity = await fetchLowestRarityAcrossPrints(entry.name);
    if (rarity) {
      resolved.push({ name: entry.name, count: entry.count, rarity, resolution: "lowest-of-printings" });
      cache[cacheKeyFor(entry)] = { rarity, cachedAt: now, resolution: "lowest-of-printings" };
    } else {
      unmatched.push({ name: entry.name, count: entry.count });
    }
    if (i < pendingAmbiguous.length - 1) await sleep(REQUEST_SPACING_MS);
  }

  saveCache(cache);
  return { resolved, unmatched };
}

// ─── Wildcard math ───────────────────────────────────────────────────────────

export function computeNeeded(resolved: ResolvedCard[]): WildcardCounts {
  const totals: WildcardCounts = { ...EMPTY_WILDCARD_COUNTS };
  for (const r of resolved) totals[r.rarity] += r.count;
  return totals;
}

/** How many of each rarity the player is still short, clamped at zero —
 * never a negative "you need -3" when they own more than the deck needs. */
export function computeDeficit(needed: WildcardCounts, owned: WildcardCounts): WildcardCounts {
  const out = { ...EMPTY_WILDCARD_COUNTS };
  for (const r of RARITIES) out[r] = Math.max(0, needed[r] - owned[r]);
  return out;
}

// ─── Owned wildcards (localStorage, no TTL — user-entered, not fetched) ─────

const OWNED_KEY = "mtg-wildcards:owned:v1";

export function loadOwnedWildcards(): WildcardCounts {
  if (typeof window === "undefined") return { ...EMPTY_WILDCARD_COUNTS };
  try {
    const raw = window.localStorage.getItem(OWNED_KEY);
    if (!raw) return { ...EMPTY_WILDCARD_COUNTS };
    const parsed = JSON.parse(raw);
    return {
      common: Math.max(0, Number(parsed.common) || 0),
      uncommon: Math.max(0, Number(parsed.uncommon) || 0),
      rare: Math.max(0, Number(parsed.rare) || 0),
      mythic: Math.max(0, Number(parsed.mythic) || 0),
    };
  } catch {
    return { ...EMPTY_WILDCARD_COUNTS };
  }
}

export function saveOwnedWildcards(owned: WildcardCounts): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OWNED_KEY, JSON.stringify(owned));
  } catch {
    // best-effort only -- never required for correctness
  }
}
