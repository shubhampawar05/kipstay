import { expect, test } from "@playwright/test";
import { openCard } from "./helpers";

test.describe("mobile layout", () => {
  test.skip(({ isMobile }) => !isMobile, "phone-only checks");

  test("bottom tab bar and search sheet", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "Explore" })).toHaveAttribute("aria-current", "page");

    await page.getByRole("button", { name: "Open search" }).click();
    await expect(page.getByRole("heading", { name: "Find a stay" })).toBeVisible();
    await page.getByRole("combobox", { name: "Where" }).fill("Goa");
    await page.getByRole("option", { name: /^Goa, India/ }).click();
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(/location=Goa/);
    await expect(page.getByTestId("listing-card").first()).toBeVisible();
  });

  test("listing page shows a sticky reserve bar", async ({ page }) => {
    await page.goto("/s?location=Goa");
    await openCard(page.getByTestId("listing-card").first());
    await expect(page.getByRole("link", { name: "Check availability" })).toBeVisible();
  });

  test("listing page: edge-to-edge photos with a back button that returns to the search", async ({ page }) => {
    await page.goto("/s?location=Goa");
    await openCard(page.getByTestId("listing-card").first());
    await expect(page).toHaveURL(/\/rooms\//);
    // The tab bar gives way to the reserve bar on listing pages.
    await expect(page.getByRole("navigation", { name: "Primary" })).not.toBeInViewport();
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/s\?location=Goa/);
  });

  test("card photos are swipeable: the photo track is the touch target", async ({ page }) => {
    await page.goto("/s?location=Kyoto");
    const card = page.getByTestId("listing-card").first();
    const track = card.getByRole("group", { name: /photos$/ });
    const box = (await track.boundingBox())!;
    const hitsTrack = await page.evaluate(
      ([x, y]) => !!document.elementFromPoint(x, y)?.closest('[role="group"]'),
      [box.x + box.width / 2, box.y + box.height / 2],
    );
    expect(hitsTrack).toBe(true);
    await track.evaluate((el) => el.scrollTo({ left: el.clientWidth }));
    await expect(card.locator('img[alt*="photo 2 of"]')).toBeAttached();
  });
});
