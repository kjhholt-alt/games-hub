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

        <nav className="flex items-center gap-5 sm:gap-6 text-xs font-mono">
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
          {NETWORK_NAV.map((link) => (
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
