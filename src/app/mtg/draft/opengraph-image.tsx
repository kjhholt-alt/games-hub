import { ImageResponse } from "next/og";

export const alt =
  "MTG Draft Ranker — cards graded S-F from real 17lands win rates, no paywall";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Assayer's-ledger palette — flat, no gradients, no glow. Mirrors the tokens
// in src/app/globals.css (--background/--foreground/--mtg-brass/etc).
const COLORS = {
  background: "#0a0a0f",
  text: "#e4e4ef",
  textSecondary: "#8888a0",
  brass: "#c9a45c",
};

// The five-color mana spectrum bar, same order used across the hub.
const SPECTRUM = ["#b0a884", "#46759e", "#6d5f80", "#a8543f", "#4d7f5c"];

// Draft grades, same colors as --mtg-tier-* in globals.css.
const GRADES = [
  { label: "S", color: "#e07840" },
  { label: "A", color: "#d4b060" },
  { label: "B", color: "#8fb4a8" },
  { label: "C", color: "#7c8ba0" },
  { label: "D", color: "#5a6474" },
  { label: "F", color: "#454e5c" },
];

// Low-alpha tint of a grade color for the plate background — flat fill, no
// glow/gradient.
function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          backgroundColor: COLORS.background,
          padding: "80px 88px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "monospace",
              fontSize: 22,
              fontWeight: 400,
              color: COLORS.brass,
              letterSpacing: 6,
              textTransform: "uppercase",
              marginBottom: 32,
            }}
          >
            FREE · SAMPLE-SIZE-STAMPED · NO PAYWALL
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 400,
              color: COLORS.text,
              letterSpacing: 2,
            }}
          >
            MTG Draft Ranker
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              width: 360,
              height: 6,
              marginTop: 36,
              marginBottom: 36,
            }}
          >
            {SPECTRUM.map((color) => (
              <div
                key={color}
                style={{
                  display: "flex",
                  width: 72,
                  height: "100%",
                  backgroundColor: color,
                }}
              />
            ))}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 30,
              fontWeight: 400,
              color: COLORS.textSecondary,
              lineHeight: 1.4,
              maxWidth: 920,
              marginBottom: 40,
            }}
          >
            Every card graded S-F from real 17lands win rates, with a
            transparent public formula.
          </div>

          <div style={{ display: "flex", flexDirection: "row" }}>
            {GRADES.map((grade, i) => (
              <div
                key={grade.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 64,
                  height: 64,
                  marginLeft: i === 0 ? 0 : 16,
                  border: `2px solid ${grade.color}`,
                  backgroundColor: hexToRgba(grade.color, 0.14),
                  color: grade.color,
                  fontSize: 30,
                  fontWeight: 400,
                }}
              >
                {grade.label}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 24,
            fontWeight: 400,
            color: COLORS.textSecondary,
            letterSpacing: 1,
          }}
        >
          BuildKit Play
        </div>
      </div>
    ),
    { ...size }
  );
}
