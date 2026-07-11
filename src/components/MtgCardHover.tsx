"use client";

import { useEffect, useRef, useState } from "react";

const HOVER_DELAY_MS = 180;
const PREVIEW_WIDTH = 244;
/** Magic's real card ratio (63:88mm) — used only to keep the floating box's
 * footprint predictable before the image finishes loading; object-cover
 * crops the art to fit, it's never stretched. */
const PREVIEW_HEIGHT = Math.round(PREVIEW_WIDTH * (88 / 63));
const VIEWPORT_MARGIN = 8;
const GAP = 8;

interface MtgCardHoverProps {
  /** For the preview's alt text — never the visible trigger label itself. */
  cardName: string;
  /** Scryfall image_normal URI. Optional and additive: when absent (today's
   * payloads, or any row the pipeline couldn't match to a card), this
   * renders `children` exactly as plain text/links — no hover wiring, no
   * broken frame, byte-identical to the pre-art-lane markup. */
  imageUrl?: string;
  children: React.ReactNode;
  /** Layout classes for the trigger wrapper (e.g. "inline-flex items-center
   * gap-2" when children include a thumbnail). Defaults to "inline-block"
   * for plain name-only wraps. */
  className?: string;
}

/**
 * Card-name hover-preview leaf (METAHUB-SPEC.md ADDENDUM 2). Desktop only —
 * gated on `(hover: hover)` so touch devices never schedule the timer at
 * all. After ~180ms of dwell it floats a lazy-loaded `image_normal` preview
 * near the trigger, positioned with `fixed` (escapes the tables'
 * `overflow-x-auto` clipping) and clamped to the viewport so it never spills
 * off any edge — flips above the trigger when there isn't room below.
 * Fades in via opacity, skipped entirely under `prefers-reduced-motion`. A
 * failed image load (`onError`) permanently disables the trigger for that
 * row rather than ever showing a broken-image icon.
 */
export function MtgCardHover({ cardName, imageUrl, children, className }: MtgCardHoverProps) {
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState(false);
  const [broken, setBroken] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = Boolean(imageUrl) && !broken;

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function hide() {
    clearTimer();
    setVisible(false);
  }

  function handleEnter() {
    if (!active) return;
    // Touch devices report "hover: none" — never schedule a preview there.
    if (typeof window === "undefined" || !window.matchMedia("(hover: hover)").matches) {
      return;
    }
    clearTimer();
    timerRef.current = setTimeout(() => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      let top = rect.bottom + GAP;
      if (top + PREVIEW_HEIGHT > window.innerHeight - VIEWPORT_MARGIN) {
        // No room below — flip above the trigger instead.
        top = rect.top - GAP - PREVIEW_HEIGHT;
      }
      top = Math.max(
        VIEWPORT_MARGIN,
        Math.min(top, window.innerHeight - PREVIEW_HEIGHT - VIEWPORT_MARGIN)
      );
      const left = Math.max(
        VIEWPORT_MARGIN,
        Math.min(rect.left, window.innerWidth - PREVIEW_WIDTH - VIEWPORT_MARGIN)
      );
      setPos({ top, left });
      setVisible(true);
    }, HOVER_DELAY_MS);
  }

  // Fade-in on mount (skipped under prefers-reduced-motion via the CSS
  // class below) + close on scroll/resize so a stale preview never floats
  // disconnected from its trigger.
  useEffect(() => {
    if (!visible) {
      setShown(false);
      return;
    }
    const raf = requestAnimationFrame(() => setShown(true));
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => clearTimer, []);

  return (
    <span
      ref={anchorRef}
      className={`relative ${className ?? "inline-block"}`}
      onMouseEnter={active ? handleEnter : undefined}
      onMouseLeave={active ? hide : undefined}
    >
      {children}
      {active && visible && (
        <span
          role="presentation"
          style={{ top: pos.top, left: pos.left, width: PREVIEW_WIDTH }}
          className={`fixed z-50 pointer-events-none aspect-[63/88] overflow-hidden rounded-lg border border-border bg-surface shadow-xl transition-opacity duration-150 motion-reduce:transition-none ${
            shown ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={cardName}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={() => setBroken(true)}
          />
        </span>
      )}
    </span>
  );
}
