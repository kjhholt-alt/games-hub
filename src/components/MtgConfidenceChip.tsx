import type { Confidence } from "@/lib/mtg";

const STYLE: Record<Confidence, string> = {
  high: "text-green border-green/30",
  medium: "text-brass border-brass/30",
  low: "text-amber border-amber/30",
  sample: "text-purple border-purple/30",
};

const LABEL: Record<Confidence, string> = {
  high: "high",
  medium: "medium",
  low: "low",
  sample: "sample",
};

/**
 * Small confidence + sample-size stamp shown where a full provenance ledger
 * would be too heavy (per-card cards, banlist tiles). The row-level half of
 * the honesty rail — a low/sample confidence row pairs this with a faded row.
 */
export function MtgConfidenceChip({
  confidence,
  sampleSize,
}: {
  confidence: Confidence;
  sampleSize: number;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wide border shrink-0 ${STYLE[confidence]}`}
      title={`${LABEL[confidence]} confidence, n=${sampleSize.toLocaleString("en-US")}`}
    >
      {LABEL[confidence]}
      <span className="tabular-nums opacity-80 normal-case">
        n={sampleSize.toLocaleString("en-US")}
      </span>
    </span>
  );
}
