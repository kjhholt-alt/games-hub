# BuildKit Play — games-hub

A standalone Next.js site that aggregates Kruz's gaming content as one property:
auto-updated game tier lists, game guides, and a gaming/AI news radar. Brand:
**BuildKit Play**, intended domain **play.buildkit.store**.

Kept **separate from pc-bottleneck-analyzer** on purpose, so game-meta content
doesn't dilute that site's hardware SEO (topical authority / Google E-E-A-T).

## What's here

| Route | What it does |
|---|---|
| `/` | Landing page — live tier-list preview, news preview, BuildKit network links |
| `/tier-lists` | **Centerpiece.** Live Deadlock hero tier list (S–D) from real win-rate data |
| `/news` | Gaming + AI trending topics, read from content-radar's feed |

## The Deadlock tier list (live, not mocked)

- Data source: the open, free, MIT-licensed **deadlock-api.com**
  (`GET https://api.deadlock-api.com/v1/analytics/hero-stats`) — the same
  post-match data shown in-game. No auth/key.
- Hero `id → name + icon` mapping comes from `deadlock-highlights/fixtures/heroes.json`
  (generated into `src/data/heroes.ts`).
- The page fetches live stats with **ISR** (`revalidate = 3600`) and ranks every
  hero by win rate into S/A/B/C/D. The ranking logic lives in `src/lib/deadlock.ts`
  (pure, testable). Tier cuts: S ≥ 53%, A ≥ 51%, B ≥ 49.5%, C ≥ 48%, else D;
  heroes under 5,000 matches are dropped.
- If the API is unreachable at build/revalidate time, the page falls back to a
  vendored snapshot (`src/data/deadlock-snapshot.json`) so it never ships empty.

## The news radar (content-radar bridge)

`/news` gives content-radar a **web** publishing target (it otherwise only feeds
clipforge video). It reads `content-radar/feed/latest.json`, vendored into
`public/news-feed.json` for deployment. Items are unverified Reddit signals —
the page says so prominently.

## Regenerating data

```bash
npm run gen:heroes      # rebuild src/data/heroes.ts from the hero fixture
npm run gen:tierlist    # refresh the live tier-list snapshot fallback
```

To refresh the news feed, re-copy `content-radar/feed/latest.json` to
`public/news-feed.json` (a scheduled task / content-radar publish step can do
this later).

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
```

## Deploy

Vercel (zero-config). Domain `play.buildkit.store` is **not** wired yet —
launching the public branded property is Kruz's call.
