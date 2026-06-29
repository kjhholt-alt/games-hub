// ─── HOI4 major-nation strategy dataset ──────────────────────────────────────
//
// Curated, current-patch (Operation Postern, 1.19.x) single-player strategy data
// for the eight historical major nations. The build paths, signature research
// priorities, run-ender pitfalls, and milestone targets here are ported verbatim
// from the hoi4-playbook project, which web-verifies the live meta and reads real
// focus ids out of the game files:
//
//   C:\Users\Kruz\Desktop\Projects\hoi4-playbook\data\<nation>_focus.json   (focus path)
//   C:\Users\Kruz\Desktop\Projects\hoi4-playbook\data\<nation>_now.json     (rules: signature / pitfall)
//   C:\Users\Kruz\Desktop\Projects\hoi4-playbook\data\<nation>_tracker.json (milestone targets)
//
// The per-nation `tier` (S/A/B/C) is an editorial strength rating for the current
// single-player meta — how forgiving and how strong a country is to take a game
// to a win on. It is NOT machine-derived from a win-rate API the way the Deadlock
// tier list is (no such public dataset exists for HOI4); it is a curated read of
// the playbook's own difficulty notes and the community consensus. Clearly marked
// as such on the page. Everything else (paths, picks, pitfalls) is sourced data.
//
// To later wire this to live hoi4-playbook output, regenerate from the JSON above
// rather than hand-editing the strings here.

export type Hoi4Tier = "S" | "A" | "B" | "C";

export type Hoi4Path = "axis" | "allies" | "comintern" | "resistance";

export interface Hoi4Milestone {
  /** Short label, e.g. "100 Civilian Factories". */
  label: string;
  /** Optional on-pace target date, e.g. "1939". */
  by?: string;
}

export interface Hoi4Nation {
  /** 3-letter HOI4 country tag. */
  tag: string;
  name: string;
  /** Editorial single-player strength tier (see file header). */
  tier: Hoi4Tier;
  /** Which faction / win condition the historical build commits to. */
  path: Hoi4Path;
  /** One-line read on what playing this nation feels like. */
  identity: string;
  /** The name of the strongest historical focus path (the spine). */
  focusPathName: string;
  /** The mandatory opening focus + why (from <nation>_focus.json phase 1). */
  opener: { title: string; why: string };
  /** The decisive / signature focus the whole build is built around. */
  signatureFocus: { title: string; why: string };
  /** The signature military-research priority (from <nation>_now.json). */
  keyResearch: { title: string; why: string };
  /** The single run-ending mistake to avoid (the playbook "landmine"). */
  pitfall: { title: string; why: string };
  /** 3-4 ordered milestone targets that pace the build. */
  milestones: Hoi4Milestone[];
}

/**
 * Eight historical majors, ordered roughly strongest-first within the file; the
 * page regroups them by tier. Strings are the playbook's curated current-patch
 * guidance.
 */
export const HOI4_NATIONS: Hoi4Nation[] = [
  {
    tag: "GER",
    name: "Germany",
    tier: "S",
    path: "axis",
    identity:
      "The benchmark power. Free expansions snowball a giant economy, then armor and CAS blitz west before the Allies finish rearming.",
    focusPathName: "Four-Year Plan economy → free expansions → Danzig",
    opener: {
      title: "Remilitarize the Rhineland",
      why: "Mandatory opener — free territory with no world tension. The first thing every game.",
    },
    signatureFocus: {
      title: "The Four-Year Plan",
      why: "Commit to the Four-Year-Plan economy branch — factory output, construction, and rubber to fuel the whole war.",
    },
    keyResearch: {
      title: "Medium tanks → Close Air Support",
      why: "The Basic Medium chassis is the backbone of your Panzers, and a wing of Stukas over them shreds divisions in the encirclement. Have both before the western campaign.",
    },
    pitfall: {
      title: "Don't stall — the war clock is ticking",
      why: "Germany's cardinal mistake is waiting too long. By mid-1940 you should be fighting France; every peaceful month lets the Allies arm. Take Poland, then strike west.",
    },
    milestones: [
      { label: "Anschluss + Sudetenland + Czechoslovakia (free)", by: "1939" },
      { label: "100 Civilian Factories", by: "1939" },
      { label: "War Economy", by: "1938" },
      { label: "Danzig or War — open WW2", by: "Sep 1939" },
    ],
  },
  {
    tag: "SOV",
    name: "Soviet Union",
    tier: "S",
    path: "comintern",
    identity:
      "Industrial mass and infinite depth. End the purge, out-build everyone, trade space for time, then drown the Wehrmacht in medium tanks.",
    focusPathName: "End the Great Purge → Five-Year Plan → hold Barbarossa",
    opener: {
      title: "Behead the Snake → End the Great Purge",
      why: "Stop the purge at the Bloc of Rights show trial — pushing past it bleeds army XP and your best leaders for good.",
    },
    signatureFocus: {
      title: "Finish the Five-Year Plan",
      why: "The industrialisation chain is the spine of the Soviet game — bank the focus time so the factories actually finish.",
    },
    keyResearch: {
      title: "Mass-produce medium tanks",
      why: "The USSR's edge is industrial mass — a flood of medium tanks overwhelms the Wehrmacht once you out-produce them. Get the chassis and never stop building.",
    },
    pitfall: {
      title: "Hold and out-build — don't counterattack early",
      why: "The USSR wins by trading space and out-producing Germany, not by early counterattacks. Fall back to defensible lines, build mils deep, and only push once you clearly outscale them.",
    },
    milestones: [
      { label: "100 Civilian Factories", by: "1939" },
      { label: "Extensive Conscription", by: "1940" },
      { label: "Survive to Barbarossa", by: "~May 1941" },
      { label: "Glory of the Red Army — go offensive", by: "1943" },
    ],
  },
  {
    tag: "USA",
    name: "United States",
    tier: "S",
    path: "allies",
    identity:
      "Safe behind two oceans with the biggest economy in the game. Lift the neutrality laws, build a monstrous industry, then overwhelm both theatres.",
    focusPathName: "Lift the laws → research slots → arsenal of democracy",
    opener: {
      title: "Continue the New Deal → War Department",
      why: "Start unwinding the Great Depression, then crack the conscription cap — the law-lifting focus chain IS your early game.",
    },
    signatureFocus: {
      title: "National Employment Strategy",
      why: "THE economy-law lift — swaps out Undisturbed Isolation so your enormous industry finally counts.",
    },
    keyResearch: {
      title: "Equip the mass army (Improved Infantry)",
      why: "America fields huge infantry armies; Improved Infantry Equipment keeps them combat-effective as you scale up. Research it alongside your industry.",
    },
    pitfall: {
      title: "Don't rush — build, then overwhelm",
      why: "America's edge is industry and time. Don't feed early divisions into the Pacific piecemeal; lift the laws, build a two-ocean navy and air force, then crush with overwhelming force.",
    },
    milestones: [
      { label: "Four Research Slots", by: "1938" },
      { label: "150 Civilian Factories", by: "1941" },
      { label: "Two-Ocean Navy", by: "1940" },
      { label: "Enter the War", by: "1942" },
    ],
  },
  {
    tag: "JAP",
    name: "Japan",
    tier: "A",
    path: "axis",
    identity:
      "Carrier supremacy and a long land grind. Purge toward the Navy, win the China war methodically, then strike south for oil — but don't wake America early.",
    focusPathName: "Purge the Kodoha → carriers → strike south",
    opener: {
      title: "Okada's Speech → Purge the Kodoha Faction",
      why: "Tilts the interservice rivalry toward the carrier-and-air Navy and unlocks the China-war and southern branches.",
    },
    signatureFocus: {
      title: "Form the Kido Butai",
      why: "The carrier strike force is the heart of the Japanese Navy — commit to carriers and build toward four fleet carriers.",
    },
    keyResearch: {
      title: "Research the Zero (carrier fighter)",
      why: "Carrier air is Japan's knockout punch — the A6M Zero outranges and outturns everything early. Get CV Fighter I before you commit the Kido Butai.",
    },
    pitfall: {
      title: "Don't wake the USA early",
      why: "Secure China and the southern resource islands before war with America. The US industrial clock is brutal once it starts — every month you delay their entry is a lead you keep.",
    },
    milestones: [
      { label: "60 Civilian Factories", by: "1939" },
      { label: "Open the China war", by: "late 1937" },
      { label: "50 Military Factories", by: "1940" },
      { label: "Strike South for oil", by: "1941" },
    ],
  },
  {
    tag: "ITA",
    name: "Italy",
    tier: "A",
    path: "axis",
    identity:
      "Master of the Mediterranean — strong navy and air, weak army. Wrap up Ethiopia, fix the army before fighting Britain, then take Africa and the Balkans.",
    focusPathName: "Triumph in Africa → Pact of Steel → Mare Nostrum",
    opener: {
      title: "Italian Highways → Steel Industry in Terni",
      why: "Free infrastructure for faster builds, then early civ factories, slots, and steel in Rome.",
    },
    signatureFocus: {
      title: "Mare Nostrum",
      why: "The endgame — form the Italian Empire faction and rule the Mediterranean. Own the Med: win Africa and Greece, keep air over the convoys.",
    },
    keyResearch: {
      title: "Get medium tanks for the desert",
      why: "Italian infantry stalls in Africa. A core of medium tanks gives you the breakthrough to take Egypt and the Balkans — research the chassis early.",
    },
    pitfall: {
      title: "Fix your army before fighting Britain",
      why: "Italy's starting divisions and equipment are weak. Don't open the desert war until you've built military factories and updated your templates, or you'll stall and bleed in Africa.",
    },
    milestones: [
      { label: "60 Civilian Factories", by: "1939" },
      { label: "Lock in the Pact of Steel", by: "1939" },
      { label: "War Economy", by: "1938" },
      { label: "Mare Nostrum — own the Med", by: "1940" },
    ],
  },
  {
    tag: "ENG",
    name: "United Kingdom",
    tier: "A",
    path: "allies",
    identity:
      "Industry behind the Channel and the Royal Navy. Win the Battle of Britain with radar and Spitfires, escort the convoys, then return to the continent.",
    focusPathName: "War industry → radar & navy → Battle of Britain",
    opener: {
      title: "Kickstart the War Industry",
      why: "Free arms factories and building slots — start the buildup behind the Channel, safe from the Luftwaffe.",
    },
    signatureFocus: {
      title: "Secure the Imperial Shipping Routes",
      why: "The economy lives or dies on the sea lanes — cruiser/convoy research plus the escort idea keep lend-lease and supply arriving.",
    },
    keyResearch: {
      title: "Radar → the Spitfire (Fighter II)",
      why: "Radar plus Spitfires win the Battle of Britain. Get radio detection up by mid-1939 and Fighter II as war nears, or the Luftwaffe grinds you down.",
    },
    pitfall: {
      title: "Get radar up for the air war",
      why: "Don't fight the Battle of Britain blind. Radar multiplies your RAF's efficiency — without it the Luftwaffe wears you down. Rush it the moment war with Germany looks close.",
    },
    milestones: [
      { label: "80 Civilian Factories", by: "1940" },
      { label: "Radar (radio detection)", by: "mid-1939" },
      { label: "Escort the convoys (ASW)", by: "1939" },
      { label: "Win the Battle of Britain", by: "1940" },
    ],
  },
  {
    tag: "FRA",
    name: "France",
    tier: "B",
    path: "allies",
    identity:
      "A defensive puzzle. Dig out of political chaos, fortify in depth where Germany attacks, hold the 1940 offensive, then counter with the colonies.",
    focusPathName: "Stabilise the government → Maginot → hold 1940",
    opener: {
      title: "Revive the National Bloc → Laissez-Faire",
      why: "Take the historical political root, then remove France's crippling starting economic debuffs so factories run efficiently.",
    },
    signatureFocus: {
      title: "Strengthen Government → Defensive Stratagems",
      why: "The pivotal political chain — the long road that finally removes Disjointed Government, so France is no longer politically crippled before the war starts.",
    },
    keyResearch: {
      title: "Strengthen your forts (Land Fort tech)",
      why: "France lives behind fortifications. Land Fort tech makes the Maginot and your border lines far harder to crack — research it well before the 1940 assault.",
    },
    pitfall: {
      title: "Stabilize before anything else",
      why: "France starts in political chaos, and low stability throttles construction and compliance. Clear the instability through the political focuses first — a stable France can actually hold the 1940 line.",
    },
    milestones: [
      { label: "Fix political instability", by: "1939" },
      { label: "60 Civilian Factories", by: "1939" },
      { label: "Extend the Maginot Line", by: "1940" },
      { label: "Hold the 1940 offensive", by: "1940" },
    ],
  },
  {
    tag: "CHI",
    name: "Nationalist China",
    tier: "C",
    path: "resistance",
    identity:
      "Survival on hard mode. Your edge is manpower and depth, not factories. Unify the warlords, dig in on the river lines, and out-last the Japanese invasion.",
    focusPathName: "Unify the warlords → protracted war → out-last Japan",
    opener: {
      title: "Dang Guo → One Nation, Undivided",
      why: "Take the one-party tutelage root, then bring the provinces under one authority — the core warlord-integration focus that mobilises China's manpower.",
    },
    signatureFocus: {
      title: "Protracted Warfare → Defense in Depth",
      why: "Take the defensive/entrenchment line over Decisive Battles — the stacking army-defence bonus that lets you trade space for time against Japan.",
    },
    keyResearch: {
      title: "Keep your infantry equipped (Improved Infantry)",
      why: "China fights with mass infantry. Improved Infantry Equipment keeps your divisions able to hold against Japan — the cheapest force multiplier you have.",
    },
    pitfall: {
      title: "Hold the line — don't counterattack",
      why: "China survives by trading space for time on the river lines, not by attacking. Lost divisions and equipment don't come back — let Japan overextend, then make them bleed for every province.",
    },
    milestones: [
      { label: "20 Civilian Factories", by: "1937" },
      { label: "War Economy", by: "1937" },
      { label: "Hold the Japanese invasion", by: "late 1937" },
      { label: "Unify the army (From Many to One)", by: "1939" },
    ],
  },
];

/** The current game patch the dataset reflects (kept in one place for the page). */
export const HOI4_PATCH = "Operation Postern (1.19)";

/** When this curated dataset was last reviewed against the live meta. */
export const HOI4_REVIEWED = "2026-06-29";
