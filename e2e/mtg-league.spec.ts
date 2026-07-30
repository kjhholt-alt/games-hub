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
