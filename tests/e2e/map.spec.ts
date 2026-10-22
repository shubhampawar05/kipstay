import { expect, test } from "@playwright/test";

test.describe("map search", () => {
  test.skip(({ isMobile }) => isMobile, "desktop map column");
  test.use({ viewport: { width: 1280, height: 800 } });

  test("loading results doesn't search; dragging the map searches its area once", async ({ page }) => {
    await page.goto("/s?location=Kyoto");
    const map = page.getByTestId("results-map");
    await expect(page.locator(".kip-pin")).not.toHaveCount(0);
    await page.waitForTimeout(1200);
    await expect(page).toHaveURL(/\?location=Kyoto$/);

    const box = (await map.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 120, box.y + box.height / 2 - 40, { steps: 12 });
    await page.mouse.up();

    await expect(page).toHaveURL(/bbox=/);
    await expect(page).not.toHaveURL(/location=/);
    await expect(page.getByTestId("results-heading")).toContainText("in the map area");
    // One search per gesture: the URL settles instead of re-searching as results load.
    const settled = page.url();
    await page.waitForTimeout(1500);
    expect(page.url()).toBe(settled);

    // Back returns to the text search.
    await page.goBack();
    await expect(page).toHaveURL(/\?location=Kyoto$/);
  });

  test("with auto-search off, moving shows 'Search this area'; expand map hides the list", async ({ page }) => {
    await page.goto("/s?location=Kyoto");
    await expect(page.locator(".kip-pin")).not.toHaveCount(0);
    await page.getByLabel("Search as I move the map").uncheck();
    const box = (await page.getByTestId("results-map").boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -400);
    const searchArea = page.getByRole("button", { name: "Search this area" });
    await expect(searchArea).toBeVisible();
    await expect(page).toHaveURL(/\?location=Kyoto$/);
    await searchArea.click();
    await expect(page).toHaveURL(/bbox=/);

    await page.getByRole("button", { name: "Expand map" }).click();
    await expect(page.getByRole("button", { name: "Show list" })).toHaveAttribute("aria-pressed", "true");
    await expect.poll(async () => (await page.getByTestId("results-map").boundingBox())!.width).toBeGreaterThan(1000);
    await page.getByRole("button", { name: "Show list" }).click();
    await expect(page.getByTestId("results-heading")).toBeInViewport();
  });
});
