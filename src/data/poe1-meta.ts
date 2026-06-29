// ─── PoE1 "Return of the Ancestors" event meta — curated dataset ──────────────
//
// PATH OF EXILE 1 ONLY. This file contains NO PoE2 data and never surfaces
// minion DPS numbers (Kruz's PoE doctrine).
//
// SOURCE OF TRUTH
// ----------------
// This is a *curated, sourced* snapshot — not a live ladder scrape. It is ported
// verbatim from our own purpose-built planner `poe1-startforge`
// (C:\Users\Kruz\Desktop\Projects\poe1-startforge), which carries an "honesty
// contract": every claim traces to a source id, community opinion is marked as
// such, and nothing is asserted as an official GGG number unless GGG said it.
//
// Why curated and not poe.ninja-live: the active league ("Return of the
// Ancestors") is a 3-WEEK EVENT on the Mirage (3.28) base with the 19 *Phrecian*
// alternate ascendancies. poe.ninja's public build-overview REST endpoints now
// 404 (their data moved behind a private Next.js layer), and event-league ladder
// data is far too sparse this early to rank meaningfully. Our startforge dataset
// is the most accurate source available for THIS league and is built to be
// re-pointed at a live source later (see `META.dataSource`).
//
// The `tier` on each row reflects current community consensus (AoEAH / PoeCurrency
// event tier lists, cross-checked) — explicitly an opinion-derived ranking for a
// brand-new event, NOT a win-rate ladder. The UI says so plainly.
//
// Provenance + dates: poe1-startforge/startforge/{event,builds,ascendancies,
// sources}.py, last read 2026-06-24/25. Active league confirmed live via the
// official GGG leagues API on 2026-06-29.

export type TierLetter = "S" | "A" | "B" | "C" | "D";
export type MetaCategory = "ascendancy" | "build" | "skill";

/** A citation source (id -> human title + url + kind). */
export interface Poe1Source {
  id: string;
  title: string;
  url: string;
  /** "official" (GGG) | "community" | "tool". */
  kind: "official" | "community" | "tool";
}

/** One ranked meta entry — an ascendancy, a build archetype, or a skill. */
export interface Poe1MetaEntry {
  /** Stable slug, unique across the whole dataset. */
  id: string;
  category: MetaCategory;
  name: string;
  /** Phrecian ascendancy this entry uses (ascendancies list themselves). */
  ascendancy: string;
  /** PoE base class (Marauder, Ranger, Shadow, ...). */
  baseClass: string;
  /** Tank | Ranged | Caster | Minion | Degen | Totem ... — a one-word playstyle tag. */
  playstyle: string;
  tier: TierLetter;
  /** One-line pitch. */
  oneLiner: string;
  /** Source ids backing this entry (must exist in POE1_SOURCES). */
  sources: string[];
}

export interface Poe1Meta {
  /** League this meta describes. */
  league: string;
  /** Base game version the league runs on. */
  baseLeague: string;
  /** Event window (ISO dates). */
  startsAt: string;
  endsAt: string;
  /** ISO timestamp this dataset was last curated. */
  curatedAt: string;
  /**
   * Where the data comes from + how to wire it live later. Rendered in the UI so
   * the ranking is never mistaken for a live win-rate ladder.
   */
  dataSource: {
    kind: "curated";
    label: string;
    note: string;
  };
  entries: Poe1MetaEntry[];
}

// ── Sources (ported from poe1-startforge/startforge/sources.py) ───────────────
export const POE1_SOURCES: Record<string, Poe1Source> = {
  "ggg-announce": {
    id: "ggg-announce",
    title: "Return of the Ancestors — official event announcement",
    url: "https://www.pathofexile.com/forum/view-thread/3968867",
    kind: "official",
  },
  "poewiki-phrecia": {
    id: "poewiki-phrecia",
    title: "Legacy of Phrecia — PoE Wiki",
    url: "https://www.poewiki.net/wiki/Legacy_of_Phrecia",
    kind: "community",
  },
  "poevault-phrecia": {
    id: "poevault-phrecia",
    title: "Legacy of Phrecia ascendancy overview — PoE Vault",
    url: "https://www.poe-vault.com/guides/legacy-of-phrecia-ascendancy-overview",
    kind: "community",
  },
  "odealo-phrecia": {
    id: "odealo-phrecia",
    title: "The 19 Phrecia ascendancy classes — Odealo",
    url: "https://odealo.com/articles/new-19-ascendency-classes-in-legacy-of-phrecia",
    kind: "community",
  },
  "aoeah-tier": {
    id: "aoeah-tier",
    title: "3.28 best ToTA builds & Phrecia class tier list — AoEAH",
    url: "https://www.aoeah.com/news/4638--poe-328-best-tota-builds--phrecia-class-tier-list-return-of-the-ancestors-event",
    kind: "community",
  },
  "poecurrency-starters": {
    id: "poecurrency-starters",
    title: "3.28 Return of the Ancestors top-tier starter builds — PoeCurrency",
    url: "https://www.poecurrency.com/news/poe-patch-3-28-return-of-the-ancestors-top-tier-starter-builds-to-dominate",
    kind: "community",
  },
  "maxroll-phrecia-starters": {
    id: "maxroll-phrecia-starters",
    title: "Legacy of Phrecia league-starter compilation — Maxroll",
    url: "https://maxroll.gg/poe/news/legacy-of-phrecia-league-starter-compilation",
    kind: "community",
  },
  "ezg-tota": {
    id: "ezg-tota",
    title: "Return of the Ancestors — ToTA mechanics & troops — EZG",
    url: "https://www.ezg.com/blog/poe-return-of-the-ancestors-guide-tota-mechanics-favor-troops-and-rewards",
    kind: "community",
  },
  "pob-community": {
    id: "pob-community",
    title: "Path of Building Community (PoE1 build math)",
    url: "https://github.com/PathOfBuildingCommunity/PathOfBuilding",
    kind: "tool",
  },
};

// ── The meta (ported from poe1-startforge ascendancies.py + builds.py) ─────────
//
// Tiers are community consensus for a new event, NOT a win-rate ladder.
// Ascendancies cross-confirmed by PoE Vault + Odealo (they agree on every base
// class). Build picks are startforge's ranked starters. Skill rankings track the
// main skill of each consensus starter / honourable mention.

const ASCENDANCIES: Poe1MetaEntry[] = [
  {
    id: "asc-servant-of-arakaali",
    category: "ascendancy",
    name: "Servant of Arakaali",
    ascendancy: "Servant of Arakaali",
    baseClass: "Shadow",
    playstyle: "Minion",
    tier: "S",
    oneLiner:
      "Top minion enabler of the event — free Aspect of the Spider + raise-spiders-on-kill hands a minion army its whole defensive layer for free.",
    sources: ["odealo-phrecia", "aoeah-tier", "poevault-phrecia"],
  },
  {
    id: "asc-ancestral-commander",
    category: "ascendancy",
    name: "Ancestral Commander",
    ascendancy: "Ancestral Commander",
    baseClass: "Marauder",
    playstyle: "Tank",
    tier: "S",
    oneLiner:
      "Karui ancestor spirits guard and strike; endurance-charge heavy (reported +3 max) — a cheap, massive mitigation base behind any ranged build.",
    sources: ["odealo-phrecia", "poevault-phrecia"],
  },
  {
    id: "asc-scavenger",
    category: "ascendancy",
    name: "Scavenger",
    ascendancy: "Scavenger",
    baseClass: "Scion",
    playstyle: "Flexible",
    tier: "A",
    oneLiner:
      "The most flexible class: heavy recoup/sustain plus a new 'Tabula Rasa' notable built to host tattoos — graft regular-ascendancy power onto any body.",
    sources: ["aoeah-tier", "odealo-phrecia"],
  },
  {
    id: "asc-whisperer",
    category: "ascendancy",
    name: "Whisperer",
    ascendancy: "Whisperer",
    baseClass: "Ranger",
    playstyle: "Ranged",
    tier: "A",
    oneLiner:
      "Mana funds her power — the highest projectile/ballista damage ceiling in the event (community reports far beyond a few-divine setup).",
    sources: ["aoeah-tier", "odealo-phrecia"],
  },
  {
    id: "asc-paladin",
    category: "ascendancy",
    name: "Paladin",
    ascendancy: "Paladin",
    baseClass: "Duelist",
    playstyle: "Aura-tank",
    tier: "B",
    oneLiner:
      "Aura/link/taunt support-tank: reportedly auto-summons elemental relics for near-permanent Anger/Hatred/Wrath — a smooth, sturdy mapper.",
    sources: ["poecurrency-starters", "aoeah-tier"],
  },
  {
    id: "asc-wildspeaker",
    category: "ascendancy",
    name: "Wildspeaker",
    ascendancy: "Wildspeaker",
    baseClass: "Ranger",
    playstyle: "Charge",
    tier: "B",
    oneLiner:
      "Aspect-of-the-Cat / charge specialist (Farrul or Saqawal) — fast, frenzy-stacking clear for confident pilots.",
    sources: ["odealo-phrecia", "poevault-phrecia"],
  },
  {
    id: "asc-architect-of-chaos",
    category: "ascendancy",
    name: "Architect of Chaos",
    ascendancy: "Architect of Chaos",
    baseClass: "Templar",
    playstyle: "Caster",
    tier: "B",
    oneLiner:
      "Chaos/elemental conversion zealot — strong penetration and conversion tools for a flexible caster shell.",
    sources: ["odealo-phrecia", "poevault-phrecia"],
  },
  {
    id: "asc-polytheist",
    category: "ascendancy",
    name: "Polytheist",
    ascendancy: "Polytheist",
    baseClass: "Templar",
    playstyle: "Totem",
    tier: "C",
    oneLiner:
      "Totem/brand many-gods caster — comfy, hands-off totem playstyle but a lower ceiling than the event's top picks.",
    sources: ["odealo-phrecia", "poevault-phrecia"],
  },
  {
    id: "asc-surfcaster",
    category: "ascendancy",
    name: "Surfcaster",
    ascendancy: "Surfcaster",
    baseClass: "Shadow",
    playstyle: "Caster",
    tier: "D",
    oneLiner:
      "Lightning→cold conversion oddball with a fishing-rod crit gimmick — joke-flavoured and unproven; for the brave only.",
    sources: ["odealo-phrecia", "poevault-phrecia"],
  },
];

const BUILDS: Poe1MetaEntry[] = [
  {
    id: "build-animate-weapon-ranged",
    category: "build",
    name: "Animate Weapon of Ranged Arms",
    ascendancy: "Servant of Arakaali",
    baseClass: "Shadow",
    playstyle: "Minion",
    tier: "S",
    oneLiner:
      "Best all-rounder starter: a minion army with free spider defences that scales from near-zero budget to Mageblood and clears every tier of content.",
    sources: ["aoeah-tier", "poecurrency-starters", "maxroll-phrecia-starters"],
  },
  {
    id: "build-explosive-arrow-ballista",
    category: "build",
    name: "Explosive Arrow Ballista",
    ascendancy: "Ancestral Commander",
    baseClass: "Marauder",
    playstyle: "Ranged",
    tier: "S",
    oneLiner:
      "Tankiest & cheapest: plant ignite ballistas behind an ancestor wall and burn packs from safe range — an ideal first event character.",
    sources: ["aoeah-tier", "odealo-phrecia"],
  },
  {
    id: "build-kinetic-fusillade-ballista",
    category: "build",
    name: "Kinetic Fusillade Ballista",
    ascendancy: "Whisperer",
    baseClass: "Ranger",
    playstyle: "Ranged",
    tier: "A",
    oneLiner:
      "Highest damage ceiling in the event — mana funds the power; a ballista-totem setup that scales far past a few-divine budget.",
    sources: ["aoeah-tier"],
  },
  {
    id: "build-righteous-fire",
    category: "build",
    name: "Righteous Fire",
    ascendancy: "Scavenger",
    baseClass: "Scion",
    playstyle: "Degen",
    tier: "A",
    oneLiner:
      "The classic braindead-safe starter on the event's most flexible class: facetank the ToTA arena, ultra-cheap, and the best tattoo host.",
    sources: ["aoeah-tier", "poecurrency-starters"],
  },
  {
    id: "build-cyclone-of-tumult",
    category: "build",
    name: "Cyclone of Tumult",
    ascendancy: "Paladin",
    baseClass: "Duelist",
    playstyle: "Melee",
    tier: "B",
    oneLiner:
      "Smooth melee mapper: high hit-rate keeps near-100% aura uptime from the Paladin's auto-summoned elemental relics.",
    sources: ["poecurrency-starters", "aoeah-tier"],
  },
];

const SKILLS: Poe1MetaEntry[] = [
  {
    id: "skill-animate-weapon",
    category: "skill",
    name: "Animate Weapon of Ranged Arms",
    ascendancy: "Servant of Arakaali",
    baseClass: "Shadow",
    playstyle: "Minion",
    tier: "S",
    oneLiner:
      "The event's standout minion skill — a self-sustaining ranged army; level it to 15-16 AFTER the campaign (a level-1 gem is a trap).",
    sources: ["aoeah-tier", "maxroll-phrecia-starters"],
  },
  {
    id: "skill-explosive-arrow",
    category: "skill",
    name: "Explosive Arrow",
    ascendancy: "Ancestral Commander",
    baseClass: "Marauder",
    playstyle: "Ranged",
    tier: "S",
    oneLiner:
      "Proven SSF league-start ignite skill: stack fuses on packs and detonate from range — perfect for the stun-heavy ToTA arena.",
    sources: ["aoeah-tier", "ezg-tota"],
  },
  {
    id: "skill-righteous-fire",
    category: "skill",
    name: "Righteous Fire",
    ascendancy: "Scavenger",
    baseClass: "Scion",
    playstyle: "Degen",
    tier: "A",
    oneLiner:
      "A degen aura — walk through packs and they burn; ignores the arena's direct-hit stun better than any attack skill.",
    sources: ["aoeah-tier", "ezg-tota"],
  },
  {
    id: "skill-kinetic-fusillade",
    category: "skill",
    name: "Kinetic Fusillade",
    ascendancy: "Whisperer",
    baseClass: "Ranger",
    playstyle: "Ranged",
    tier: "A",
    oneLiner:
      "The event's top damage-ceiling skill on a ballista totem — mana-scaled projectiles that keep climbing with investment.",
    sources: ["aoeah-tier"],
  },
  {
    id: "skill-caustic-arrow",
    category: "skill",
    name: "Caustic Arrow",
    ascendancy: "Whisperer",
    baseClass: "Ranger",
    playstyle: "Ranged",
    tier: "B",
    oneLiner:
      "The default smooth-and-cheap Acts 1-4 leveling skill for every bow start; carries you to your endgame ballista setup.",
    sources: ["poecurrency-starters"],
  },
  {
    id: "skill-holy-flame-totem",
    category: "skill",
    name: "Holy Flame Totem",
    ascendancy: "Scavenger",
    baseClass: "Scion",
    playstyle: "Totem",
    tier: "C",
    oneLiner:
      "A no-gear leveling crutch for RF and caster starts — plant totems through Acts 1-3 until your main degen comes online.",
    sources: ["poecurrency-starters"],
  },
];

export const POE1_META: Poe1Meta = {
  league: "Return of the Ancestors",
  baseLeague: "Mirage (3.28)",
  startsAt: "2026-06-25T22:00:00Z",
  endsAt: "2026-07-16T22:00:00Z",
  curatedAt: "2026-06-29T00:00:00Z",
  dataSource: {
    kind: "curated",
    label: "Curated from our PoE1 startforge planner",
    note: "Community consensus for a 3-week event — not a live win-rate ladder. Ready to re-point at a live source once the event ladder matures.",
  },
  entries: [...ASCENDANCIES, ...BUILDS, ...SKILLS],
};
