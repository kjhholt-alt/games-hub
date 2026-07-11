export type MtgTierLetter = "S" | "A" | "B" | "C" | "D" | "F";

/** The hub's tier/grade heat ramp: S burns mythic copper, A wears rare gold,
 * then the scale cools through sage and steel to cold slate — Magic's own
 * metallurgy as a ranking scale. Flat plates, no glow. */
const PLATE_STYLE: Record<MtgTierLetter, string> = {
  S: "bg-mtier-s/15 text-mtier-s border-mtier-s/50",
  A: "bg-mtier-a/12 text-mtier-a border-mtier-a/45",
  B: "bg-mtier-b/12 text-mtier-b border-mtier-b/40",
  C: "bg-mtier-c/12 text-mtier-c border-mtier-c/40",
  D: "bg-mtier-d/15 text-mtier-d border-mtier-d/45",
  F: "bg-mtier-f/25 text-text-secondary border-mtier-f",
};

const SIZE = {
  sm: "w-6 h-6 text-[11px]",
  md: "w-7 h-7 text-sm",
  lg: "w-11 h-11 text-xl",
} as const;

/**
 * MTG-hub tier/grade plate — square, flat, dense. Replaces the network-wide
 * TierBadge inside /mtg only (the deadlock/PoE pages keep their own scale).
 * "unrated" renders an explicit em-dash plate, never a guessed letter.
 */
export function MtgTierPlate({
  letter,
  size = "md",
  title,
}: {
  letter: MtgTierLetter | "unrated";
  size?: keyof typeof SIZE;
  /** Optional hover rubric, e.g. the grade blurb. */
  title?: string;
}) {
  if (letter === "unrated") {
    return (
      <span
        className={`inline-flex items-center justify-center rounded border border-dashed border-border text-text-secondary font-mono ${SIZE[size]}`}
        title={title ?? "No recorded games yet — never a guessed grade"}
      >
        —
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center rounded border font-semibold ${SIZE[size]} ${PLATE_STYLE[letter]}`}
      title={title}
    >
      {letter}
    </span>
  );
}
