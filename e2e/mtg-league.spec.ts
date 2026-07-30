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
