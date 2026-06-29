import type { TierLetter } from "@/lib/deadlock";

const TIER_STYLE: Record<TierLetter, string> = {
  S: "bg-tier-s/15 text-tier-s border-tier-s/40",
  A: "bg-tier-a/15 text-tier-a border-tier-a/40",
  B: "bg-tier-b/15 text-tier-b border-tier-b/40",
  C: "bg-tier-c/15 text-tier-c border-tier-c/40",
  D: "bg-tier-d/15 text-tier-d border-tier-d/40",
};

export function TierBadge({
  letter,
  size = "md",
}: {
  letter: TierLetter;
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
