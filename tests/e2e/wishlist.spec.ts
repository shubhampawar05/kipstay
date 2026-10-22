import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

test.describe("wishlist", () => {
  test("logged-out heart sends you to log in", async ({ page }) => {
    await page.goto("/s?location=Reykjavik");
    await page.getByTestId("wishlist-button").first().click();
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test("save, persist across reloads, and remove", async ({ page }) => {
    await signUp(page, "Wren Wishlist");
    await page.goto("/wishlists");
    await expect(page.getByRole("heading", { name: "Nothing saved yet" })).toBeVisible();

    await page.goto("/s?location=Reykjavik");
    const firstCard = page.getByTestId("listing-card").first();
    const heart = firstCard.getByTestId("wishlist-button");
    await expect(heart).toHaveAttribute("aria-pressed", "false");
    await heart.click();
    await expect(heart).toHaveAttribute("aria-pressed", "true");
    // The heart flips optimistically; wait for the server to confirm before reloading.
    await expect(page.getByText(/^Saved /)).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("listing-card").first().getByTestId("wishlist-button")).toHaveAttribute("aria-pressed", "true");

    await page.goto("/wishlists");
    await expect(page.getByTestId("listing-card")).toHaveCount(1);
    await page.getByTestId("wishlist-button").click();
    await expect(page.getByText(/from your wishlist$/)).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Nothing saved yet" })).toBeVisible();
  });
});
