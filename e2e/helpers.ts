import type { Locator, Page } from "@playwright/test";

/**
 * Shared helpers for the MTG Meta Hub smoke suite. Kept deliberately generic
 * — the hub's tables may gain/reorder columns over time, so every helper
 * here resolves a column by its header LABEL rather than a fixed index.
 */

/** The Draft Ranker's card table, located by its own header label rather
 * than DOM position — the page also carries other <table>s (the Color
 * performance leaderboard renders inside a closed <details>, which still
 * exists in the DOM), so `page.locator("table").first()` is not stable. */
export function rankerTable(page: Page): Locator {
  return page
    .locator("table")
    .filter({ has: page.locator('thead th', { hasText: "GIH WR" }) })
    .first();
}

/** Text of every <thead> header button/cell in a table, in DOM order. Works
 * whether the header cell is a plain <th> or (as on the sortable Draft
 * Ranker table) wraps a <button> — `innerText` reads whichever is present. */
export async function headerLabels(table: Locator): Promise<string[]> {
  const cells = table.locator("thead th");
  return (await cells.allInnerTexts()).map((t) => t.trim());
}

/** Index of the first header whose label matches `pattern` (case-insensitive
 * substring), or -1 if none match. */
export function findColumnIndex(labels: string[], pattern: RegExp): number {
  return labels.findIndex((l) => pattern.test(l));
}

/** Trimmed text of the Nth cell (0-based) in a <tbody> row. */
export async function rowCellText(row: Locator, colIndex: number): Promise<string> {
  const text = await row.locator("td").nth(colIndex).innerText();
  return text.trim();
}

/** Parses a rendered stat cell ("63.0%", "unrated", "+10.2pp", "2.30", "—")
 * into a comparable number, or null when the cell is an honest non-value. */
export function parseStat(text: string): number | null {
  const t = text.trim();
  if (!t || t === "—" || /unrated/i.test(t)) return null;
  const n = parseFloat(t.replace(/[%+]/g, "").replace(/pp$/i, ""));
  return Number.isNaN(n) ? null : n;
}
