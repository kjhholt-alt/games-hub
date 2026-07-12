import { Space_Grotesk } from "next/font/google";

/**
 * The network's display face — a geometric, technical grotesk used for the
 * network's page titles and section headings. Deliberately distinct from the
 * MTG hub's inscriptional Marcellus serif (lib/mtgFonts.ts): where the hub
 * reads as an engraved ledger, the network reads as an instrument readout —
 * "game meta, decided by data" as a typographic stance, not decoration.
 *
 * Loaded route-scoped, same pattern as lib/mtgFonts.ts: each network page
 * applies `networkDisplay.variable` to its <main>, and the `.network-display`
 * utility (globals.css) opts specific headings in. /mtg pages never load or
 * render this face.
 */
export const networkDisplay = Space_Grotesk({
  weight: "700",
  subsets: ["latin"],
  variable: "--font-network-display",
  display: "swap",
});
