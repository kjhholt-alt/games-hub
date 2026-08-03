import { expect, test } from "@playwright/test";

test.describe("/mtg/league — MTG Proving Grounds", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mtg/league");
  });

  test("renders the evidence rail and real admission queue", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: "Proving Grounds" })).toBeVisible();
    await expect(page.getByText("sample", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ugin defeats Light-Paws, 2–1" })).toBeVisible();
    await expect(page.getByText("rules engine verified", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Brawl admission queue" })).toBeVisible();
    // The count grows as the Forge queue executes more of the round robin, so
    // assert the shape here and check the exact value against the published
    // receipt in the standings test below.
    await expect(page.getByText(/Match-proven decks \d+\/18/)).toBeVisible();
    await expect(page.getByText("Legality verified", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("legality verified", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("rejected legality", { exact: true }).first()).toBeVisible();
  });

  test("rules-engine standings match the published receipt", async ({ page, request }) => {
    const response = await request.get("/mtg-proving-grounds-forge-standings.json");
    expect(response.ok()).toBeTruthy();
    const standings = await response.json();

    // The shard is only evidence if it is actually rules-engine evidence.
    expect(standings.status).toBe("provisional");
    expect(standings.evidence_class).toBe("rules_engine");
    expect(standings.promoted_match_count).toBeGreaterThan(0);
    expect(standings.table.length).toBeGreaterThan(0);

    // Nothing may be credited without traceable provenance.
    for (const match of standings.match_receipts) {
      expect(match.engine.jar_sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(match.deck_files).toHaveLength(2);
      for (const deck of match.deck_files) {
        expect(deck.sha256).toMatch(/^[0-9a-f]{64}$/);
      }
      if (match.credited) {
        expect(match.normalized_repeat).toBe(true);
        expect(match.winner_deck_id).toBeTruthy();
      }
    }

    await expect(
      page.getByRole("heading", {
        name: `${standings.promoted_match_count} of ${standings.planned_match_count} queued matches executed`,
      })
    ).toBeVisible();

    // The page's own evidence claim must equal the receipt's deck count.
    await expect(
      page.getByText(`Match-proven decks ${standings.table.length}/18`)
    ).toBeVisible();

    // Coverage must be disclosed either way, and the claim must match reality:
    // an unfinished queue says "shard", a finished one must stop saying it while
    // still refusing to be read as a win rate.
    expect(standings.coverage_complete).toBe(
      standings.promoted_match_count === standings.planned_match_count
    );
    if (standings.coverage_complete) {
      await expect(page.getByText(/not a metagame win rate/)).toBeVisible();
      await expect(page.getByText(/partial shard, not a completed league/)).toHaveCount(0);
      // A complete round robin means every deck played every other exactly once.
      const expected = standings.table.length - 1;
      for (const row of standings.table) {
        expect(row.matches).toBe(expected);
      }
    } else {
      await expect(page.getByText(/partial shard, not a completed league/)).toBeVisible();
    }

    // Every ranked deck is rendered with its record.
    const section = page.locator("section[aria-labelledby='forge-standings-title']");
    for (const row of standings.table) {
      await expect(section.getByText(row.deck_id, { exact: true })).toBeVisible();
    }
  });

  test("reproducibility across seeds is reported, not implied", async ({ page, request }) => {
    const response = await request.get("/mtg-proving-grounds-forge-agreement.json");
    test.skip(!response.ok(), "only one seed set has run so far");
    const agreement = await response.json();

    expect(agreement.seed_set_count).toBeGreaterThan(1);
    expect(agreement.evidence_class).toBe("rules_engine");
    expect(agreement.evidence_identity.engine_jar_sha256).toMatch(
      /^[0-9a-f]{64}$/
    );
    expect(
      Object.keys(agreement.evidence_identity.deck_sha256_by_id)
    ).toHaveLength(10);
    for (const deckHash of Object.values(
      agreement.evidence_identity.deck_sha256_by_id as Record<string, string>
    )) {
      expect(deckHash).toMatch(/^[0-9a-f]{64}$/);
    }

    // A pairing may only be called reproducible if every seed set agreed, and
    // every seed set's plan must be distinct — otherwise this is one run counted
    // several times.
    const planHashes = new Set(
      agreement.seed_sets.map((s: { plan_receipt_hash: string }) => s.plan_receipt_hash)
    );
    expect(planHashes.size).toBe(agreement.seed_set_count);
    for (const pairing of agreement.pairings) {
      if (pairing.reproducible) {
        expect(pairing.fully_observed).toBe(true);
        expect(pairing.observations).toBe(agreement.seed_set_count);
        expect(Object.keys(pairing.winners)).toHaveLength(1);
      }
    }
    expect(
      agreement.reproducible_pairing_count + agreement.split_pairing_count
    ).toBe(agreement.fully_observed_pairing_count);

    const section = page.locator("section[aria-labelledby='forge-agreement-title']");

    // Split shapes must account for exactly the fully observed pairings, and a
    // reproducible pairing's shape is the seed-set count with no second entry.
    const shapeTotal = Object.values(
      agreement.split_shapes as Record<string, number>
    ).reduce((n: number, c: number) => n + c, 0);
    expect(shapeTotal).toBe(agreement.fully_observed_pairing_count);
    for (const pairing of agreement.pairings) {
      if (!pairing.fully_observed) continue;
      const parts = pairing.split_shape.split("-").map(Number);
      expect(parts.reduce((a: number, b: number) => a + b, 0)).toBe(
        agreement.seed_set_count
      );
      if (pairing.reproducible) {
        expect(parts).toHaveLength(1);
        expect(pairing.dominant_fraction).toBe(1);
      } else {
        expect(parts.length).toBeGreaterThan(1);
        expect(pairing.dominant_fraction).toBeLessThan(1);
      }
      // A coin flip must never carry a majority winner.
      if (pairing.dominant_fraction <= 0.5) {
        expect(pairing.majority_winner).toBeNull();
      }
    }
    // A coin-flip claim requires enough seed sets to distinguish 3-3 from 5-1.
    if (agreement.coin_flip_threshold_met) {
      expect(agreement.seed_set_count).toBeGreaterThanOrEqual(4);
      expect(agreement.coin_flip_pairing_count).toBe(
        agreement.pairings.filter(
          (p: { fully_observed: boolean; dominant_fraction: number }) =>
            p.fully_observed && p.dominant_fraction <= 0.5
        ).length
      );
    } else {
      expect(agreement.coin_flip_pairing_count).toBeNull();
      await expect(section.getByText("Coin flips")).toHaveCount(0);
    }

    await expect(
      page.getByRole("heading", {
        name: `${agreement.reproducible_pairing_count} of ${agreement.fully_observed_pairing_count} pairings gave the same winner every time`,
      })
    ).toBeVisible();

    // "Played" and "reproduced" must read as different claims.
    await expect(section.getByText(/what reproduced/)).toBeVisible();
    await expect(section.getByText("Seed wins", { exact: true })).toBeVisible();
    await expect(section.getByText("Win rate", { exact: true })).toHaveCount(0);

    // Every seed-sensitive pairing is named on the page with its shape, never
    // just counted in a total.
    const splits = agreement.pairings.filter(
      (p: { fully_observed: boolean; reproducible: boolean }) =>
        p.fully_observed && !p.reproducible
    );
    const splitList = section.locator("ul li");
    await expect(splitList).toHaveCount(splits.length);
    if (splits.length > 0) {
      const rendered = (await splitList.allTextContents()).join("\n");
      for (const pairing of splits) {
        expect(rendered).toContain(pairing.split_shape);
      }
    }

    // A small seed sample must never be presented as a win rate.
    await expect(section.getByText(/tiny sample/)).toBeVisible();
    await expect(section.getByText(/never .this deck is stronger/)).toBeVisible();
  });

  test("six-seed combined standings match the published receipt", async ({ page, request }) => {
    const response = await request.get("/mtg-proving-grounds-forge-combined.json");
    expect(response.ok()).toBeTruthy();
    const combined = await response.json();

    // This is the one payload on the page allowed to say "receipted" instead
    // of "sample" or "provisional" -- only because coverage is complete.
    expect(combined.status).toBe("receipted");
    expect(combined.evidence_class).toBe("rules_engine");
    expect(combined.coverage_complete).toBe(true);
    expect(combined.held_match_count).toBe(0);
    expect(combined.unattributed_match_count).toBe(0);
    expect(combined.promoted_match_count).toBe(combined.planned_match_count);
    expect(combined.shard_count).toBeGreaterThanOrEqual(2);
    expect(combined.seed_sets).toHaveLength(combined.shard_count);
    expect(combined.matches).toHaveLength(combined.promoted_match_count);
    expect(combined.table.length).toBeGreaterThan(0);

    // Every deck played every other deck exactly once per shard -- an even,
    // complete round robin repeated across every seed.
    const expectedMatchesPerDeck = (combined.table.length - 1) * combined.shard_count;
    for (const row of combined.table) {
      expect(row.matches).toBe(expectedMatchesPerDeck);
      expect(row.match_wins + row.match_losses).toBe(row.matches);
    }

    // Every match receipt traces to a real hash, and its two decks are two of
    // the ranked decks in the table.
    const rankedIds = new Set(combined.table.map((row: { deck_id: string }) => row.deck_id));
    for (const match of combined.matches) {
      expect(match.receipt_hash).toMatch(/^[0-9a-f]{64}$/);
      expect(match.normalized_repeat).toBe(true);
      expect(rankedIds.has(match.deck_a_id)).toBe(true);
      expect(rankedIds.has(match.deck_b_id)).toBe(true);
      expect([match.deck_a_id, match.deck_b_id]).toContain(match.winner_deck_id);
    }

    await expect(
      page.getByRole("heading", {
        name: `${combined.promoted_match_count} of ${combined.planned_match_count} matches receipted across ${combined.shard_count} seeds`,
      })
    ).toBeVisible();

    const section = page.locator("section[aria-labelledby='forge-combined-title']");
    for (const row of combined.table) {
      await expect(section.locator(`a[href="/mtg/league/receipts/${row.deck_id}"]`).first()).toBeVisible();
    }
  });

  test("every combined standings score links to a receipt drill-down", async ({ page, request }) => {
    const response = await request.get("/mtg-proving-grounds-forge-combined.json");
    const combined = await response.json();
    const firstDeckId = combined.table[0].deck_id;

    const section = page.locator("section[aria-labelledby='forge-combined-title']");
    const link = section.locator(`a[href="/mtg/league/receipts/${firstDeckId}"]`).first();
    await expect(link).toBeVisible();
    await link.click();

    await expect(page).toHaveURL(`/mtg/league/receipts/${firstDeckId}`);
    const row = combined.table.find((r: { deck_id: string }) => r.deck_id === firstDeckId);
    await expect(
      page.getByText(`${row.match_wins}-${row.match_losses}`, { exact: true }).first()
    ).toBeVisible();
    const matchesForDeck = combined.matches.filter(
      (m: { deck_a_id: string; deck_b_id: string }) =>
        m.deck_a_id === firstDeckId || m.deck_b_id === firstDeckId
    );
    expect(matchesForDeck).toHaveLength(row.matches);
    // Every row on the drill-down page carries a real receipt hash prefix.
    await expect(page.getByText(matchesForDeck[0].receipt_hash.slice(0, 12))).toBeVisible();
  });

  test("why these numbers are different explains the three evidence tiers", async ({ page }) => {
    const section = page.locator("section[aria-labelledby='numbers-differ-title']");
    await expect(section.getByText("Engine-receipted", { exact: false })).toBeVisible();
    await expect(section.getByText("Crowd telemetry", { exact: false })).toBeVisible();
    await expect(section.getByText("Externals (cite-only)", { exact: false })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Three kinds of evidence on this page, never mixed" })
    ).toBeVisible();
  });

  test("Cube Sealed standings match the published receipt", async ({ page, request }) => {
    const response = await request.get("/mtg-proving-grounds-cube-standings.json");
    expect(response.ok()).toBeTruthy();
    const standings = await response.json();

    expect(standings.evidence_class).toBe("rules_engine");
    expect(standings.promoted_match_count).toBe(45);
    expect(standings.held_match_count).toBe(0);
    expect(standings.unattributed_match_count).toBe(0);
    expect(standings.coverage_complete).toBe(true);
    expect(standings.table).toHaveLength(10);

    const section = page.locator("section[aria-labelledby='cube-standings-title']");
    await expect(section.getByText("45 of 45 Cube matches promoted")).toBeVisible();
    await expect(section.getByText("Golgari Cube")).toBeVisible();
    await expect(section.getByText("7-2")).toBeVisible();
    await expect(section.getByText("not an Arena Cube tier list")).toBeVisible();
  });

  test("Cube Sealed six-seed combined standings match the published receipt", async ({ page, request }) => {
    const response = await request.get("/mtg-proving-grounds-cube-sealed-combined.json");
    expect(response.ok()).toBeTruthy();
    const combined = await response.json();

    // This is the one Cube payload allowed to say "receipted" instead of
    // "sample" or "provisional" -- only because coverage is complete.
    expect(combined.status).toBe("receipted");
    expect(combined.evidence_class).toBe("rules_engine");
    expect(combined.game_format).toBe("Sealed");
    expect(combined.coverage_complete).toBe(true);
    expect(combined.held_match_count).toBe(0);
    expect(combined.unattributed_match_count).toBe(0);
    expect(combined.promoted_match_count).toBe(combined.planned_match_count);
    expect(combined.shard_count).toBeGreaterThanOrEqual(2);
    expect(combined.seed_sets).toHaveLength(combined.shard_count);
    expect(combined.matches).toHaveLength(combined.promoted_match_count);
    expect(combined.table).toHaveLength(10);

    // Every guild shell played every other shell exactly once per shard -- an
    // even, complete round robin repeated across every seed.
    const expectedMatchesPerDeck = (combined.table.length - 1) * combined.shard_count;
    for (const row of combined.table) {
      expect(row.matches).toBe(expectedMatchesPerDeck);
      expect(row.match_wins + row.match_losses).toBe(row.matches);
    }

    // Every match receipt traces to a real hash, and its two decks are two of
    // the ranked decks in the table.
    const rankedIds = new Set(combined.table.map((row: { deck_id: string }) => row.deck_id));
    for (const match of combined.matches) {
      expect(match.receipt_hash).toMatch(/^[0-9a-f]{64}$/);
      expect(match.normalized_repeat).toBe(true);
      expect(rankedIds.has(match.deck_a_id)).toBe(true);
      expect(rankedIds.has(match.deck_b_id)).toBe(true);
      expect([match.deck_a_id, match.deck_b_id]).toContain(match.winner_deck_id);
    }

    await expect(
      page.getByRole("heading", {
        name: `${combined.promoted_match_count} of ${combined.planned_match_count} Cube matches receipted across ${combined.shard_count} seeds`,
      })
    ).toBeVisible();

    const section = page.locator("section[aria-labelledby='cube-combined-title']");
    for (const row of combined.table) {
      await expect(section.locator(`a[href="/mtg/league/receipts/${row.deck_id}"]`).first()).toBeVisible();
    }
  });

  test("every Cube combined standings score links to a receipt drill-down", async ({ page, request }) => {
    const response = await request.get("/mtg-proving-grounds-cube-sealed-combined.json");
    const combined = await response.json();
    const firstDeckId = combined.table[0].deck_id;

    const section = page.locator("section[aria-labelledby='cube-combined-title']");
    const link = section.locator(`a[href="/mtg/league/receipts/${firstDeckId}"]`).first();
    await expect(link).toBeVisible();
    await link.click();

    await expect(page).toHaveURL(`/mtg/league/receipts/${firstDeckId}`);
    const row = combined.table.find((r: { deck_id: string }) => r.deck_id === firstDeckId);
    await expect(
      page.getByText(`${row.match_wins}-${row.match_losses}`, { exact: true }).first()
    ).toBeVisible();
    const matchesForDeck = combined.matches.filter(
      (m: { deck_a_id: string; deck_b_id: string }) =>
        m.deck_a_id === firstDeckId || m.deck_b_id === firstDeckId
    );
    expect(matchesForDeck).toHaveLength(row.matches);
    // Every row on the drill-down page carries a real receipt hash prefix.
    await expect(page.getByText(matchesForDeck[0].receipt_hash.slice(0, 12))).toBeVisible();
    // A Cube deck id must never resolve to the Brawl drill-down's payload.
    await expect(page.getByText("Cube Sealed", { exact: false }).first()).toBeVisible();
  });

  test("selecting a standing updates the deck inspector", async ({ page }) => {
    await page.getByRole("button", { name: /Grixis Reanimator/ }).click();
    await expect(
      page.locator("aside").getByRole("heading", { name: "Grixis Reanimator" })
    ).toBeVisible();
  });

  test("has no horizontal overflow at mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });
});
