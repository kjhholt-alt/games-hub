import type { Confidence } from "@/lib/mtg";

const STYLE: Record<Confidence, string> = {
  high: "text-green bg-green-dim border-green/30",
  medium: "text-cyan bg-cyan-dim border-cyan/30",
  low: "text-amber bg-amber-dim border-amber/30",
  sample: "text-purple bg-purple-dim border-purple/30",
};

const LABEL: Record<Confidence, string> = {
  high: "high",
  medium: "medium",
  low: "low",
  sample: "sample",
};

/**
 * Small confidence + sample-size badge shown on every row. This is the row-
 * level half of the honesty rail (the page-wide half is MtgSampleBanner) — a
 * low/sample confidence row pairs this with a faded row background.
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
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono uppercase border shrink-0 ${STYLE[confidence]}`}
      title={`${LABEL[confidence]} confidence, n=${sampleSize.toLocaleString("en-US")}`}
    >
      {LABEL[confidence]}
      <span className="tabular-nums opacity-80">
        n={sampleSize.toLocaleString("en-US")}
      </span>
    </span>
  );
}
