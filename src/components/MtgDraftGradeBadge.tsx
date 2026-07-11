import type { DraftGrade } from "@/lib/mtgDraftView";

const GRADE_STYLE: Record<Exclude<DraftGrade, "unrated">, string> = {
  S: "bg-tier-s/15 text-tier-s border-tier-s/40",
  A: "bg-tier-a/15 text-tier-a border-tier-a/40",
  B: "bg-tier-b/15 text-tier-b border-tier-b/40",
  C: "bg-tier-c/15 text-tier-c border-tier-c/40",
  D: "bg-tier-d/15 text-tier-d border-tier-d/40",
  F: "bg-tier-f/30 text-text-secondary border-tier-f",
};

/**
 * BuildKit Draft Score grade chip — extends the site's existing S–D tier
 * scale (TierBadge) with an F band and an explicit "unrated" state for cards
 * 17lands has no GIH data for. Never a guessed letter: unrated renders as a
 * neutral N/A chip, matching the MtgLimitedTierTable convention.
 */
export function MtgDraftGradeBadge({
  grade,
  size = "md",
}: {
  grade: DraftGrade;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg"
      ? "w-11 h-11 text-xl"
      : size === "sm"
        ? "w-6 h-6 text-[11px]"
        : "w-8 h-8 text-base";

  if (grade === "unrated") {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-lg border border-border text-text-secondary font-mono uppercase font-bold ${dim} ${
          size === "sm" ? "text-[9px]" : "text-[10px]"
        }`}
        title="No GIH data recorded for this card yet"
      >
        N/A
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg border font-bold ${dim} ${GRADE_STYLE[grade]}`}
    >
      {grade}
    </span>
  );
}
