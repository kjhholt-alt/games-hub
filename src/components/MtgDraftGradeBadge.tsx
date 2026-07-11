import { MtgTierPlate } from "@/components/MtgTierPlate";
import { GRADE_BLURB, type DraftGrade } from "@/lib/mtgDraftView";

/**
 * BuildKit Draft Score grade plate — the hub-wide MtgTierPlate heat ramp
 * (S copper → F slate) applied to the ranker's S–F bands, with the grade
 * rubric as a hover tooltip. Never a guessed letter: unrated renders the
 * explicit em-dash plate.
 */
export function MtgDraftGradeBadge({
  grade,
  size = "md",
}: {
  grade: DraftGrade;
  size?: "sm" | "md" | "lg";
}) {
  return <MtgTierPlate letter={grade} size={size} title={GRADE_BLURB[grade]} />;
}
