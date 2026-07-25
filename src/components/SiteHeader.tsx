import Link from "next/link";
import { Gamepad2, ExternalLink } from "lucide-react";
import { INTERNAL_NAV, NETWORK_NAV } from "@/lib/nav";

/**
 * Shared BuildKit header. The wordmark + the internal/network nav are what make
 * the hardware blog, game guides, tier lists, and news read as one property.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Gamepad2 className="w-5 h-5 text-cyan" />
          <span className="font-semibold tracking-tight">
            BuildKit <span className="text-text-secondary">Play</span>
          </span>
        </Link>

        {/*
          Measured 464px wide inside a 369px viewport on a 375px phone, so the
          whole PAGE scrolled sideways and the last two links (MTG Meta, News)
          sat off-screen with no way to reach them -- on the device most of the
          audience arrives from.

          overflow-x-auto keeps the horizontal scroll INSIDE the nav rather
          than on the document; shrink lets it give way to the wordmark instead
          of shoving it. min-w-0 is the load-bearing part: a flex child
          defaults to min-width:auto and refuses to shrink below its content,
          which is exactly what pushed the page wide. Same containment pattern
          the tier tables and MtgMetaLens already use.
        */}
        <nav className="flex items-center gap-5 sm:gap-6 text-xs font-mono min-w-0 shrink overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {INTERNAL_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-text-secondary hover:text-cyan transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <span className="hidden sm:inline h-4 w-px bg-border" aria-hidden />
          {NETWORK_NAV.slice(0, 1).map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 text-text-secondary hover:text-cyan transition-colors"
            >
              {link.label}
              <ExternalLink size={11} />
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
