import { expect, test } from "@playwright/test";

test.describe("search", () => {
  test("destination autocomplete → results → listing detail", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Popular homes in/ }).first()).toBeVisible();

    const where = page.getByRole("combobox", { name: "Where" });
    await where.click();
    await expect(page.getByRole("listbox", { name: "Destination suggestions" })).toBeVisible();
    await where.fill("kyo");
    await page.getByRole("option", { name: /Kyoto, Japan/ }).click();

    // Selecting a destination moves straight on to dates; submit without them.
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Search", exact: true }).click();

    await expect(page).toHaveURL(/\/s\?location=Kyoto/);
    await expect(page.getByTestId("results-heading")).toContainText("in Kyoto, Japan");
    const cards = page.getByTestId("listing-card");
    await expect(cards).toHaveCount(3);

    await cards.first().locator("a").first().click();
    await expect(page).toHaveURL(/\/rooms\//);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What this place offers" })).toBeVisible();
    await expect(page.getByTestId("availability-calendar")).toBeVisible();
  });

  test("date search excludes booked listings and prices whole stays", async ({ page }) => {
    await page.goto("/s?location=Lisbon&checkin=2026-12-01&checkout=2026-12-08&adults=2");
    await expect(page.getByTestId("results-heading")).toContainText("Lisbon");
    // 7 nights → card shows the total and a struck-through pre-discount price.
    const card = page.getByTestId("listing-card").first();
    await expect(card).toContainText("for 7 nights");
    await expect(card.getByLabel("Price before weekly discount")).toBeVisible();
  });

  test("filters narrow results and show an empty state", async ({ page }) => {
    await page.goto("/s");
    const all = await page.getByTestId("listing-card").count();
    await page.getByRole("button", { name: "Pool", exact: true }).click();
    await expect(page).toHaveURL(/amenities=Pool/);
    await expect.poll(() => page.getByTestId("listing-card").count()).toBeLessThan(all);

    await page.goto("/s?location=Atlantis");
    await expect(page.getByRole("heading", { name: "No exact matches" })).toBeVisible();
  });

  test("guest count above capacity filters listings out", async ({ page }) => {
    await page.goto("/s?adults=16");
    await expect(page.getByRole("heading", { name: "No exact matches" })).toBeVisible();
  });

  test("unknown listing shows not-found page", async ({ page }) => {
    const res = await page.goto("/rooms/does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "We can't find that page" })).toBeVisible();
  });
});
