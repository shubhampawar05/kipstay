import { expect, test } from "@playwright/test";
import { signUp, TEST_PASSWORD, uniqueEmail } from "./helpers";

test.describe("wishlist", () => {
  test("logged-out heart opens log in over the page, then saves", async ({ page }) => {
    await page.goto("/s?location=Reykjavik");
    const heart = page.getByTestId("listing-card").first().getByTestId("wishlist-button");
    await heart.click();
    const dialog = page.getByRole("dialog", { name: "Log in or sign up" });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/s\?location=Reykjavik$/);

    // Escape closes it without saving.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(heart).toHaveAttribute("aria-pressed", "false");

    await heart.click();
    await dialog.getByRole("button", { name: "Sign up" }).click();
    await dialog.getByLabel("Full name").fill("Dana Dialog");
    await dialog.getByLabel("Email").fill(uniqueEmail("dialog"));
    await dialog.getByLabel("Password").fill(TEST_PASSWORD);
    await dialog.getByRole("button", { name: "Create account" }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText(/^Saved /)).toBeVisible();
    await expect(page).toHaveURL(/\/s\?location=Reykjavik$/);
    await page.goto("/wishlists");
    await expect(page.getByTestId("listing-card")).toHaveCount(1);
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
