import Link from "next/link";
import { INTERNAL_NAV, NETWORK_NAV } from "@/lib/nav";

/** Shared BuildKit footer with the full cross-property link set. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="font-semibold tracking-tight">
              BuildKit <span className="text-text-secondary">Play</span>
            </p>
            <p className="text-xs text-text-secondary mt-1 max-w-sm">
              Game tier lists, guides, and gaming news — auto-updated from real
              data. Part of the BuildKit network.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono">
            {INTERNAL_NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-text-secondary hover:text-cyan transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {NETWORK_NAV.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-secondary hover:text-cyan transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <p className="text-xs text-text-secondary mt-8 pt-6 border-t border-border">
          Data from the open deadlock-api.com (MIT). Not affiliated with Valve.
          Built with Next.js &middot; AI by Claude.
        </p>
      </div>
    </footer>
  );
}
