// ─── Shared BuildKit navigation ──────────────────────────────────────────────
//
// One source of truth for the cross-property nav so the hardware blog, game
// guides, game tier lists, and news all read as a single BuildKit property.

export interface NavLink {
  label: string;
  href: string;
  /** External links (other BuildKit subdomains) open in a new tab. */
  external?: boolean;
}

/** Internal links within games-hub. */
export const INTERNAL_NAV: NavLink[] = [
  { label: "Deadlock", href: "/tier-lists" },
  { label: "PoE1", href: "/poe1" },
  { label: "StS2", href: "/sts2" },
  { label: "HOI4", href: "/hoi4" },
  { label: "News", href: "/news" },
];

/** The wider BuildKit network of sibling properties. */
export const NETWORK_NAV: NavLink[] = [
  {
    label: "PC Bottleneck",
    href: "https://pcbottleneck.buildkit.store",
    external: true,
  },
  {
    label: "Game Guides",
    href: "https://007.buildkit.store",
    external: true,
  },
];
