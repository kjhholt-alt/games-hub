import { Marcellus } from "next/font/google";

/**
 * The MTG hub's display face — an inscriptional roman (single weight) that
 * evokes Magic's engraved card-frame lettering without cosplaying it. Loaded
 * only on /mtg routes (each page applies `mtgDisplay.variable` to its <main>),
 * so the rest of the network never pays for it. Headings opt in via the
 * `.mtg-display` utility in globals.css.
 */
export const mtgDisplay = Marcellus({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-mtg-display",
  display: "swap",
});
