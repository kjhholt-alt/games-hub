import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Set NEXT_PUBLIC_GSC_VERIFICATION in Vercel env to the Google Search Console
// HTML-tag token to verify the property once a domain is mapped.
const gsc = process.env.NEXT_PUBLIC_GSC_VERIFICATION;

export const metadata: Metadata = {
  title: {
    default: "BuildKit Play — Game tier lists, guides & gaming news",
    template: "%s | BuildKit Play",
  },
  description:
    "Auto-updated game tier lists from real win-rate data, hands-on game guides, and gaming + AI news. Part of the BuildKit network.",
  metadataBase: new URL("https://play.buildkit.store"),
  ...(gsc ? { verification: { google: gsc } } : {}),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
