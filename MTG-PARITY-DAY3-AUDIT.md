# MTG parity Day 3 — basis-first design pass (gl-0601)

Audit of every `/mtg` route against the assayer's-ledger design language
`/mtg/cube` established: (1) every rendered number carries a visible basis
chip/label, (2) confidence fading is consistent, (3) methodology/receipt
links are reachable from every page showing a graded number, (4) mobile at
390px is usable with no horizontal page overflow.

Scope: `/mtg`, `/mtg/cube`, `/mtg/cube/trainer`, `/mtg/check`, `/mtg/draft`,
`/mtg/league`, `/mtg/methodology`. No payload/data files or generation
scripts were touched — findings below are UI-only, additive fixes.

## Per-page findings

### /mtg (Meta Hub)
No violations found. `MtgModuleHeader`/`MtgProvenance` carry the
status/freshness/attribution ledger on every module; `MtgConfidenceChip` and
`isFadedConfidence` → `opacity-60` row fade are applied consistently across
`MtgCommanderTierTable`, `MtgConstructedTierTable`, `MtgLimitedTierTable`,
`MtgBanlistTable`, `MtgFormatCards`; every honest-empty state routes through
`MtgHonestPanel`. Methodology link present at the bottom of the page.

### /mtg/cube
Reference implementation for the rest of the hub — no violations. Priors
callout, prior-source scoreboard (`Stat` chips), engine-stats disclosure,
and `MtgCubeTierTable`'s basis column + confidence chip + row fade are all
present. Methodology accordion + full methodology link present.

### /mtg/cube/trainer
No violations. Revealed cards show tier + a basis-tinted caption
(`priorSourceBasisColor`); methodology link present.

### /mtg/check
No violations. `MtgDeckCheckTable` carries a basis column
(`deckCheckBasisColor`), a confidence chip per covered row, and fades both
uncovered and low/sample-confidence rows identically to every other table.
Methodology link present.

### /mtg/draft
**Finding (fixed):** the Ranker table (`MtgDraftTable`) is fully consistent
with the hub's basis/fade language, but the same page's **Cheat Sheet**
view (`MtgDraftCheatSheet`, one of the page's three view tabs) rendered only
a card name, a bare win-rate percentage, and a tier badge — no basis label
and no confidence fade. A cross-set-prior or heuristic-graded card in the
cheat sheet read with identical visual weight to a real 17lands-backed
card, on the very same page where the Ranker tab shows the distinction.
Fix: added `isFadedConfidence` row fade and a `priorSourceBasisColor`-tinted
win-rate (with the human `basis` string as its tooltip), matching the
caption treatment `MtgCubeTrainer` already uses for its revealed cards.
Additive only — no change to the ranker table, synergy view, or any payload
field.

`MtgColorPairSynergy` (the page's third tab) was already correct: basis-
consistent fade + confidence chip per tile.

### /mtg/league
**Finding (fixed):** Proving Grounds runs its own — arguably stricter —
honesty system (an `evidence_class` chip, a JSON receipt link next to every
graded section, per-section `ShieldAlert` caveats, and a standing "What
this run proves" disclosure), so no bare numbers were found. However it was
the only page in scope with **no link back to `/mtg/methodology`** — every
other audited page ends with a "Read the full MTG Meta Hub methodology &
attribution" link, and this one didn't, breaking the pattern that
methodology should be reachable from every page carrying a graded number.
Fix: added the same link/copy/icon convention near the page's closing
Wizards boilerplate.

### /mtg/methodology
No violations — this is the ledger the other pages link back to.

## Mobile audit (390px, Playwright)

See `e2e/mtg-mobile-390.spec.ts` (added this pass). Every table on the
audited pages renders inside an `overflow-x-auto` wrapper (a pre-existing,
consistent pattern across `MtgCubeTierTable`, `MtgDraftTable`,
`MtgCommanderTierTable`, `MtgConstructedTierTable`, `MtgDeckCheckTable`,
etc.), so a wide table scrolls within its own box rather than blowing out
page width. The check asserts `document.documentElement.scrollWidth <=
window.innerWidth` (no page-level horizontal overflow) at 390×844 on every
audited route, screenshots each route before interaction, and re-checks
after the interactive affordance each page offers (cube filter bar /
trainer pick-reveal / deck-checker paste+check / draft ranker cheat-sheet
tab / league standings row select) to catch layout shift.
