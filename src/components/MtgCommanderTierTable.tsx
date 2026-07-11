import { ExternalLink } from "lucide-react";
import { MtgTierPlate } from "@/components/MtgTierPlate";
import { ManaDots } from "@/components/MtgManaPips";
import { MtgCardHover } from "@/components/MtgCardHover";
import {
  BUCKET_LABEL,
  colorIdentityPips,
  formatLabel,
  groupByBucket,
  isFadedConfidence,
  type CommanderTierRow,
} from "@/lib/mtg";

/** Leaderboard depth per bucket. The full 500+ rows live in the raw payload
 * (linked from the page chrome) — rendering them all buried the signal and
 * quadrupled the page weight. Top-of-board IS the product; the count line
 * below each table says exactly how much is held back. */
const TOP_N = 20;

/**
 * Commander/Brawl leaderboards — one dense table per engine bucket
 * (trending = newest decks, established = most-viewed decks), ranked by
 * deck count. Rank number + tier plate carry the hierarchy; mana dots carry
 * color identity; the commander name links to the representative Archidekt
 * deck (the real attribution link). Sources are cited once at module level,
 * not stamped on every row — per-row honesty is the fade + the deck count.
 */
export function MtgCommanderTierTable({ rows }: { rows: CommanderTierRow[] }) {
  const buckets = groupByBucket(rows);

  return (
    <div className="space-y-10">
      {buckets.map((b) => (
        <BucketBoard key={b.bucket} bucket={b.bucket} rows={b.rows} />
      ))}
      <p className="text-xs text-text-secondary max-w-3xl">
        Tier = deck-count rank-percentile within the bucket — a popularity
        measure, not a win rate. Top inclusions = the non-land cards most
        often played alongside that commander across the scanned decks.
      </p>
    </div>
  );
}

function BucketBoard({
  bucket,
  rows,
}: {
  bucket: CommanderTierRow["bucket"];
  rows: CommanderTierRow[];
}) {
  const sorted = [...rows].sort((a, b) => b.deck_count - a.deck_count);
  const top = sorted.slice(0, TOP_N);

  return (
    <div>
      <h3 className="font-mono text-[11px] uppercase tracking-widest text-text-secondary mb-3">
        {BUCKET_LABEL[bucket]}
      </h3>
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left">
              <Th className="w-10 text-right">#</Th>
              <Th className="w-12">Tier</Th>
              <Th wide>Commander</Th>
              <Th>Colors</Th>
              <Th>Format</Th>
              <Th className="text-right">Decks</Th>
              <Th wide className="hidden lg:table-cell">
                Top inclusions
              </Th>
            </tr>
          </thead>
          <tbody>
            {top.map((row, i) => (
              <tr
                key={`${row.commander}-${row.format}`}
                className={`border-b border-border last:border-0 hover:bg-brass/5 transition-colors ${
                  isFadedConfidence(row.confidence) ? "opacity-60" : ""
                }`}
              >
                <td className="px-3 py-2 text-right font-mono tabular-nums text-text-secondary">
                  {i + 1}
                </td>
                <td className="px-3 py-2">
                  <MtgTierPlate letter={row.tier} />
                </td>
                <td className="px-4 py-2 font-medium">
                  <a
                    href={row.deck_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brass transition-colors"
                  >
                    <MtgCardHover
                      cardName={row.commander}
                      imageUrl={row.image_normal}
                      className="inline-flex items-center gap-2"
                    >
                      {row.art_crop && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.art_crop}
                          alt=""
                          loading="lazy"
                          className="w-11 h-8 rounded object-cover border border-border shrink-0"
                        />
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        {row.commander}
                        <ExternalLink
                          size={11}
                          className="text-text-secondary shrink-0"
                        />
                      </span>
                    </MtgCardHover>
                  </a>
                </td>
                <td className="px-3 py-2">
                  {/* colorIdentityPips returns "C" for colorless; ManaDots
                      takes "" for its hollow colorless ring. */}
                  <ManaDots
                    letters={colorIdentityPips(row.color_identity).replace(
                      "C",
                      ""
                    )}
                  />
                </td>
                <td className="px-3 py-2 text-text-secondary whitespace-nowrap">
                  {formatLabel(row.format)}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {row.deck_count}
                </td>
                <td className="px-4 py-2 text-text-secondary hidden lg:table-cell max-w-md truncate">
                  {row.top_inclusions.length > 0
                    ? row.top_inclusions.slice(0, 3).join(" · ")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary mt-2">
        Top {top.length} of {rows.length} commanders by deck count · faded
        rows = small samples
      </p>
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
