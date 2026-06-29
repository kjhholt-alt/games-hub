import type { Hoi4Tier } from "@/lib/hoi4";

// Reuses the shared tier-s..tier-c color tokens (globals.css). HOI4 tops out at
// the C tier, so no D style is needed.
const TIER_STYLE: Record<Hoi4Tier, string> = {
  S: "bg-tier-s/15 text-tier-s border-tier-s/40",
  A: "bg-tier-a/15 text-tier-a border-tier-a/40",
  B: "bg-tier-b/15 text-tier-b border-tier-b/40",
  C: "bg-tier-c/15 text-tier-c border-tier-c/40",
};

export function Hoi4TierBadge({
  letter,
  size = "md",
}: {
  letter: Hoi4Tier;
  size?: "md" | "lg";
}) {
  const dim = size === "lg" ? "w-12 h-12 text-2xl" : "w-8 h-8 text-base";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg border font-bold ${dim} ${TIER_STYLE[letter]}`}
    >
      {letter}
    </span>
  );
}
