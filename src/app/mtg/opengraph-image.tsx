import { ImageResponse } from "next/og";

export const alt =
  "MTG Meta Hub — Commander tiers, Limited win rates, ban tracker, set calendar";
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
            SOURCE · SAMPLE · FRESHNESS · CONFIDENCE
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
            MTG Meta Hub
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
            }}
          >
            Every row carries its receipts — Commander tiers, real Limited win
            rates, ban tracker, set calendar.
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
