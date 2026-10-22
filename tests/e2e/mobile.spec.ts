import { expect, test } from "@playwright/test";

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
    await page.getByTestId("listing-card").first().locator("a").first().click();
    await expect(page.getByRole("link", { name: "Check availability" })).toBeVisible();
  });
});
