import { MtgDraftRarityChip } from "@/components/MtgDraftRarityChip";
import { RARITIES, type ResolvedCard, type WildcardCounts } from "@/lib/mtgWildcards";

/**
 * The per-rarity needed/owned/still-short ledger — the primary output of
 * the calculator — plus a collapsible card-by-card breakdown (same
 * accordion pattern as MtgModuleHeader's methodology disclosure) so the
 * page stays dense by default but nothing is hidden.
 */
export function MtgWildcardResultsTable({
  needed,
  owned,
  deficit,
  resolved,
}: {
  needed: WildcardCounts;
  owned: WildcardCounts;
  deficit: WildcardCounts;
  resolved: ResolvedCard[];
}) {
  const totalNeeded = RARITIES.reduce((s, r) => s + needed[r], 0);
  const totalDeficit = RARITIES.reduce((s, r) => s + deficit[r], 0);
  const sortedResolved = [...resolved].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <div className="overflow-x-auto border border-border rounded-lg mb-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left">
              <Th>Rarity</Th>
              <Th className="text-right">Needed</Th>
              <Th className="text-right">Owned</Th>
              <Th className="text-right">Still short</Th>
            </tr>
          </thead>
          <tbody>
            {RARITIES.map((r) => (
              <tr
                key={r}
                className="border-b border-border last:border-0 hover:bg-brass/5 transition-colors"
              >
                <td className="px-3 py-2">
                  <MtgDraftRarityChip rarity={r} />
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {needed[r]}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-text-secondary">
                  {owned[r]}
                </td>
                <td
                  className={`px-3 py-2 text-right font-mono tabular-nums font-semibold ${
                    deficit[r] > 0 ? "text-amber" : "text-green"
                  }`}
                >
                  {deficit[r]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-mono text-[11px] uppercase tracking-wide text-text-secondary mb-6">
        {totalNeeded.toLocaleString("en-US")} unique-card wildcards needed total ·{" "}
        <span className={totalDeficit > 0 ? "text-amber" : "text-green"}>
          {totalDeficit.toLocaleString("en-US")} still short
        </span>
      </p>

      <details className="max-w-3xl group">
        <summary className="cursor-pointer list-none inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-text-secondary hover:text-brass transition-colors select-none mb-3">
          <span className="inline-block group-open:rotate-90 transition-transform">
            &#9656;
          </span>
          Card-by-card breakdown ({sortedResolved.length})
        </summary>
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left">
                <Th wide>Card</Th>
                <Th>Rarity</Th>
                <Th className="text-right">Count</Th>
              </tr>
            </thead>
            <tbody>
              {sortedResolved.map((r) => (
                <tr
                  key={r.name}
                  className="border-b border-border last:border-0 hover:bg-brass/5 transition-colors"
                >
                  <td className="px-4 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2">
                    <MtgDraftRarityChip rarity={r.rarity} />
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {r.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function Th({
  children,
  className = "",
  wide = false,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <th
      className={`${wide ? "px-4" : "px-3"} py-2.5 font-mono text-[10px] uppercase tracking-widest text-text-secondary font-medium ${className}`}
    >
      {children}
    </th>
  );
}
