const MANA_BG: Record<string, string> = {
  W: "bg-mana-w",
  U: "bg-mana-u",
  B: "bg-mana-b",
  R: "bg-mana-r",
  G: "bg-mana-g",
};

const MANA_NAME: Record<string, string> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
};

/**
 * Magic's own five-color vernacular as flat dots — the hub's one shared
 * visual signature. Used functionally in every table (color identity reads
 * at a glance, faster than letter codes) and once decoratively as the
 * ManaStrip under the hub heading. Flat fills, no glow, per the site's
 * terminal-dense design law. Colorless renders as a hollow ring, never a
 * fake color.
 */
export function ManaDots({
  letters,
  size = "sm",
}: {
  letters: string;
  size?: "sm" | "md";
}) {
  const dim = size === "md" ? "w-2.5 h-2.5" : "w-2 h-2";
  if (!letters) {
    return (
      <span className="inline-flex items-center" title="Colorless">
        <span className={`${dim} rounded-full border border-mana-c`} />
        <span className="sr-only">Colorless</span>
      </span>
    );
  }
  const names = letters
    .split("")
    .map((c) => MANA_NAME[c] ?? c)
    .join(" / ");
  return (
    <span className="inline-flex items-center gap-1" title={names}>
      {letters.split("").map((c, i) => (
        <span
          key={`${c}-${i}`}
          className={`${dim} rounded-full ${MANA_BG[c] ?? "bg-mana-c"}`}
        />
      ))}
      <span className="sr-only">{names}</span>
    </span>
  );
}

/** The hub's identity mark: one quiet WUBRG strip. Used exactly once per
 * page, under the heading — everywhere else the dots are functional data. */
export function ManaStrip({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} aria-hidden="true">
      {(["W", "U", "B", "R", "G"] as const).map((c) => (
        <span key={c} className={`w-2.5 h-2.5 rounded-full ${MANA_BG[c]}`} />
      ))}
      <span className="h-px flex-1 max-w-[10rem] bg-border" />
    </div>
  );
}
