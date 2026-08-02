# MTG parity Day 3 — performance pass (gl-0602)

Lighthouse audit + payload report for `/mtg`, `/mtg/cube`, `/mtg/league`, plus
a lazy-loading verification pass across the `/mtg` family. Base commit
`e3b400f`. Additive-only: no visual regressions, no payload/data schema
changes.

## Method

- `npm run build` (Turbopack production build) + `npm run start -p 4173`
  (real `next start` prod server, not `next dev`).
- `lighthouse <url> --preset=desktop --chrome-flags="--headless=new
  --no-sandbox --disable-gpu"` (Lighthouse 13.4.1, headless Chrome 150) run
  twice: once against the unmodified base commit ("before"), once against
  the working tree after the fixes below ("after").
- Full JSON reports retained for this run under `/tmp/lhbefore` and
  `/tmp/lhafter` (not committed — regenerate with the command above against
  either commit if a fresh diff is needed).

## Lighthouse scores (desktop preset, 0–100)

| Route | Perf (before→after) | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| `/mtg` | 100 → 100 | 89 → 89 | 96 → 96 | 100 → 100 |
| `/mtg/cube` | 100 → 100 | 96 → 96 | 96 → 96 | 100 → 100 |
| `/mtg/league` | 100 → 100 | 96 → 96 | 96 → 96 | 100 → 100 |

Performance was already perfect on all three routes at the base commit and
stayed perfect — this pass did not regress it. Accessibility/Best
Practices/SEO scores are unchanged (pre-existing, out of scope for a perf
pass; the 89 on `/mtg` a11y predates this work).

## Core Web Vitals (desktop preset)

| Route | LCP | FCP | TBT | CLS | Speed Index |
|---|---|---|---|---|---|
| `/mtg` (before) | 0.7s | 0.4s | 0ms | 0 | 0.4s |
| `/mtg` (after) | 0.7s | 0.4s | 0ms | 0 | 0.4s |
| `/mtg/cube` (before) | 0.7s | 0.4s | 0ms | 0 | 0.4s |
| `/mtg/cube` (after) | 0.7s | 0.4s | 0ms | 0 | 0.4s |
| `/mtg/league` (before) | 0.6s | 0.3s | 0ms | 0 | 0.3s |
| `/mtg/league` (after) | 0.6s | 0.3s | 0ms | 0 | 0.3s |

No change — the fixes in this pass are byte-savings/decode-hint additions,
not render-path changes, so the Web Vitals numbers hold flat as expected.

## Payload report

Per-page total transferred bytes (Lighthouse `total-byte-weight`, cold load):

| Route | Before | After | Δ |
|---|---|---|---|
| `/mtg` | 1,742 KiB | 1,725 KiB | −17 KiB |
| `/mtg/cube` | 646 KiB | 629 KiB | −17 KiB |
| `/mtg/league` | 506 KiB | 488 KiB | −18 KiB |
| **Naive sum of the three** | 2,894 KiB (2.83 MiB) | 2,842 KiB (2.78 MiB) | −52 KiB |

Every route is comfortably under the 2MB-per-page rail, before and after.

**Combined (deduplicated) 3-page session total** — the bytes a browser
actually pulls over a real `/mtg` → `/mtg/cube` → `/mtg/league` visit, where
shared `_next/static` JS/CSS/font chunks are fetched once and reused rather
than recounted per page:

| | Before | After |
|---|---|---|
| Unique resources across all 3 routes | 152 | 141 |
| Combined transfer size | 2,289.5 KiB (2.24 MiB) | 2,271.8 KiB (2.22 MiB) |

This sits ~270 KiB over the METAHUB-SPEC 2MB combined rail, essentially flat
from baseline. It is driven almost entirely by one thing: `/mtg`'s Commander
& Brawl leaderboard renders 14 Scryfall `art_crop` thumbnails (44×32 CSS px)
that ship at their full original resolution (up to ~950×677) — ~1,033 KiB,
over a third of the deduplicated total, for artwork displayed at postage-stamp
size. See "Investigated and reverted" below for why this wasn't fixed in
this pass, and the follow-up that would close the gap.

## Lazy-loading audit (`/mtg`, `/mtg/cube`, `/mtg/league`, plus the rest of
the `/mtg` family for consistency)

Every raster `<img>` reachable from the three audited routes was already
`loading="lazy"` at the base commit:

- `MtgCommanderTierTable` — 44×32 `art_crop` thumbnail next to each
  leaderboard row (rendered on `/mtg`). Already `loading="lazy"`.
- `MtgCardHover` — the floating card-preview image used by every tier/cube
  table (`/mtg`, `/mtg/cube`, `/mtg/draft`, `/mtg/check`, …). Already
  `loading="lazy"`, and additionally never exists in the DOM at all until a
  desktop `(hover: hover)` dwell fires — zero load cost on initial render
  regardless of the attribute.
- `MtgCubeTrainer` — revealed-pack card images (`/mtg/cube/trainer`).
  Already `loading="lazy"`.

One gap found and fixed:

- `MtgCalendarTable` — the per-set Scryfall set-icon SVG rendered in `/mtg`'s
  release-calendar module had **no** `loading` attribute. Added
  `loading="lazy"`.

Additive hardening applied to all four (`MtgCommanderTierTable`,
`MtgCubeTrainer`, `MtgCardHover`, `MtgCalendarTable`): added
`decoding="async"` so image decode happens off the main thread instead of
blocking paint. Pure rendering hint — no fetch-timing change, no visual
change.

`/mtg/league` (`MtgLeagueObservatory`) renders no images at all, so it had
nothing to audit.

## Investigated and reverted: next/image resizing for the art_crop thumbnails

The obvious fix for the ~1MB of oversized `art_crop` bytes on `/mtg` is
Next's built-in image optimizer: swap the plain `<img>` for `next/image`
with `width={44} height={32}`, add `cards.scryfall.io` to
`next.config.ts`'s `images.remotePatterns`, and let the (already-resolved)
`sharp` dependency resize + re-encode on the fly.

Implemented it, then verified it against the local prod server before
trusting it: every `/_next/image?url=https://cards.scryfall.io/...` request
came back **400**. Root cause, confirmed directly —

```
$ curl -sI 'https://cards.scryfall.io/art_crop/front/....jpg'
HTTP/1.1 200 OK
...
$ node -e "fetch('https://cards.scryfall.io/art_crop/front/....jpg').then(r=>r.text()).then(console.log)"
<!DOCTYPE html>...400 Bad Request...
Your User-Agent header is currently set to default or generic value.
```

Scryfall's edge CDN rejects requests carrying a default/generic
`User-Agent`. `curl`'s default UA passes; Node's bare `fetch()` (what
Next's built-in image-optimizer route uses server-side, with no per-domain
header override available in `remotePatterns`) does not. Shipping the
next/image swap would have silently turned every commander-leaderboard
thumbnail into a broken-image icon in production — a real visual
regression, and a direct violation of this item's "no visual regressions"
rail.

Reverted both changes (`next.config.ts` remotePattern, the `MtgImage` swap
in `MtgCommanderTierTable.tsx`) back to the plain, working, already-lazy
`<img>`. Kept only the `decoding="async"` addition on that element.

**Follow-up (out of scope for this additive-only pass):** a small
self-hosted route handler that fetches the Scryfall original server-side
with a compliant `User-Agent`, resizes via `sharp` (already a resolved
dependency — confirmed present at `node_modules/sharp`), and serves the
result with cache headers; point `next/image`'s `loader` at that route
instead of the built-in optimizer. Would recover the ~1,033 KiB on `/mtg`
and bring the 3-page combined dedup total from ~2.22MB down to ~1.24MB,
comfortably under the 2MB rail. Not attempted here because it's new
server-side infrastructure (a route, a resize pipeline, its own caching
behavior) rather than an additive attribute/config tweak, and this item is
scoped to additive fixes only.

## Verification

- `npx tsc --noEmit` — clean, both before and after the fixes.
- `npm run build` — clean, both before and after the fixes (Turbopack
  production build, 70/70 static pages generated).
- `PLAYWRIGHT_BASE_URL=http://localhost:4173 npx playwright test` against
  `next start -p 4173` (an exact prod build of this commit, not `next dev`
  and not the live site the config defaults to) — **67/67 green** (66
  passed outright, 1 passed on its configured retry: a pre-existing
  URL-timing flake in `mtg-cube.spec.ts`'s tier-filter test, unrelated to
  any file touched in this pass).
- No payload/data JSON files were modified — only `.tsx` attribute
  additions on the client-rendered `<img>` elements listed above. Every
  `public/*.json` payload is byte-identical to the base commit.
