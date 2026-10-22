import { expect, test } from "@playwright/test";
import { signUp, TEST_PASSWORD, uniqueEmail } from "./helpers";

test.describe("wishlist", () => {
  test("logged-out heart opens log in over the page, then the save dialog", async ({ page }) => {
    await page.goto("/s?location=Reykjavik");
    const heart = page.getByTestId("listing-card").first().getByTestId("wishlist-button");
    await heart.click();
    const auth = page.getByRole("dialog", { name: "Log in or sign up" });
    await expect(auth).toBeVisible();
    await expect(page).toHaveURL(/\/s\?location=Reykjavik$/);

    // Escape closes it without saving.
    await page.keyboard.press("Escape");
    await expect(auth).toBeHidden();
    await expect(heart).toHaveAttribute("aria-pressed", "false");

    await heart.click();
    await auth.getByRole("button", { name: "Sign up" }).click();
    await auth.getByLabel("Full name").fill("Dana Dialog");
    await auth.getByLabel("Email").fill(uniqueEmail("dialog"));
    await auth.getByLabel("Password").fill(TEST_PASSWORD);
    await auth.getByRole("button", { name: "Create account" }).click();

    // A brand-new account has no lists, so the dialog opens on "Create wishlist".
    const save = page.getByRole("dialog", { name: "Create wishlist" });
    await expect(save).toBeVisible();
    await save.getByRole("textbox", { name: "Name" }).fill("Iceland 2027");
    await expect(save.getByText("12/50 characters")).toBeVisible();
    await save.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText("Saved to Iceland 2027")).toBeVisible();
    await expect(heart).toHaveAttribute("aria-pressed", "true");
    await expect(page).toHaveURL(/\/s\?location=Reykjavik$/);
  });

  test("named lists: create, save to an existing list, rename, un-heart and delete", async ({ page }) => {
    await signUp(page, "Wren Wishlist");
    await page.goto("/wishlists");
    await expect(page.getByRole("heading", { name: "Create your first wishlist" })).toBeVisible();

    await page.goto("/s?location=Reykjavik");
    const cards = page.getByTestId("listing-card");
    await cards.nth(0).getByTestId("wishlist-button").click();
    const create = page.getByRole("dialog", { name: "Create wishlist" });
    await create.getByRole("textbox", { name: "Name" }).fill("Northern lights");
    await create.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText("Saved to Northern lights")).toBeVisible();

    // The second save offers the existing list.
    await cards.nth(1).getByTestId("wishlist-button").click();
    const pick = page.getByRole("dialog", { name: "Save to wishlist" });
    await pick.getByRole("button", { name: "Save to Northern lights" }).click();
    await expect(pick).toBeHidden();
    await expect(cards.nth(1).getByTestId("wishlist-button")).toHaveAttribute("aria-pressed", "true");

    // Persisted: the list tile shows both stays.
    await page.goto("/wishlists");
    const tile = page.getByTestId("wishlist-tile").filter({ hasText: "Northern lights" });
    await expect(tile).toContainText("2 saved");
    await tile.click();
    await expect(page.getByTestId("listing-card")).toHaveCount(2);

    await page.getByRole("button", { name: "Wishlist settings" }).click();
    await page.getByRole("menuitem", { name: "Rename" }).click();
    const rename = page.getByRole("dialog", { name: "Rename wishlist" });
    await rename.getByLabel("Name").fill("Iceland");
    await rename.getByRole("button", { name: "Save" }).click();
    await expect(page.getByTestId("wishlist-name")).toHaveText("Iceland");

    // A filled heart removes the stay from every list.
    await page.getByTestId("listing-card").first().getByTestId("wishlist-button").click();
    await expect(page.getByText(/from your wishlists$/)).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("listing-card")).toHaveCount(1);

    await page.getByRole("button", { name: "Wishlist settings" }).click();
    await page.getByRole("menuitem", { name: "Delete wishlist" }).click();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page).toHaveURL(/\/wishlists$/);
    await expect(page.getByRole("heading", { name: "Create your first wishlist" })).toBeVisible();
  });

  test("other people's wishlists are not found", async ({ page, browser }) => {
    await signUp(page, "Owner Olive");
    await page.goto("/s?location=Reykjavik");
    await page.getByTestId("listing-card").first().getByTestId("wishlist-button").click();
    await page.getByRole("textbox", { name: "Name" }).fill("Private list");
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText("Saved to Private list")).toBeVisible();
    await page.goto("/wishlists");
    await page.getByTestId("wishlist-tile").first().click();
    await expect(page).toHaveURL(/\/wishlists\/[^/]+$/);
    const url = page.url();

    const other = await browser.newPage();
    await signUp(other, "Nosy Ned");
    const res = await other.goto(url);
    expect(res?.status()).toBe(404);
    await other.close();
  });
});
