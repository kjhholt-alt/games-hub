const PIP_STYLE: Record<string, string> = {
  W: "text-amber",
  U: "text-cyan",
  B: "text-foreground",
  R: "text-red",
  G: "text-green",
};

/**
 * Renders a card's color string ("U", "WB", "URG", "" for colorless) as
 * individual WUBRG pip letters so multicolor cards read at a glance instead
 * of as an opaque code. The payload already carries colors in wheel order.
 */
export function MtgDraftColorPips({ color }: { color: string }) {
  if (color === "") {
    return (
      <span className="font-mono text-xs text-text-secondary" title="Colorless">
        C
      </span>
    );
  }
  return (
    <span className="font-mono text-xs font-semibold tracking-wide" title={color}>
      {color.split("").map((c, i) => (
        <span key={`${c}-${i}`} className={PIP_STYLE[c] ?? "text-text-secondary"}>
          {c}
        </span>
      ))}
    </span>
  );
}
