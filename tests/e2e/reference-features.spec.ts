import { expect, test } from "@playwright/test";
import { firstListingId, logIn, signUp, TEST_PASSWORD } from "./helpers";

test.describe("round-2 reference features", () => {
  test("account settings: edit profile and change password", async ({ page, browser }) => {
    const email = await signUp(page, "Robin Account");
    await page.goto("/account");
    await page.getByLabel("Name", { exact: true }).fill("Robin Renamed");
    await page.getByLabel("About you").fill("Coffee, trains and long walks.");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Profile saved")).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Robin Renamed");

    // A second session is signed out when the password changes.
    const other = await browser.newPage();
    await logIn(other, email);

    await page.getByLabel("Current password").fill("wrong-password-1");
    await page.getByLabel("New password", { exact: true }).fill("brand-New-pass-42");
    await page.getByLabel("Confirm new password").fill("brand-New-pass-42");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("That isn't your current password.")).toBeVisible();

    await page.getByLabel("Current password").fill(TEST_PASSWORD);
    await page.getByLabel("New password", { exact: true }).fill("brand-New-pass-42");
    await page.getByLabel("Confirm new password").fill("brand-New-pass-42");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText(/Password updated/)).toBeVisible();

    await other.goto("/trips");
    await expect(other).toHaveURL(/\/login/);
    await logIn(other, email, "brand-New-pass-42");
    await expect(other).toHaveURL(/\/$/);
    await other.close();
  });

  test("listing page: reviews dialog, photo tour, host profile", async ({ page }) => {
    const id = await firstListingId(page, "?sort=rating");
    await page.goto(`/rooms/${id}`);

    const showAll = page.getByRole("button", { name: /Show all \d+ reviews/ });
    if (await showAll.count()) {
      await showAll.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog.getByRole("heading", { name: /reviews/ })).toBeVisible();
      await expect(dialog.locator("li").first()).toBeVisible();
      await page.keyboard.press("Escape");
    }

    await page.getByRole("button", { name: "Show all photos" }).click();
    await expect(page.getByRole("heading", { name: "Photo tour" })).toBeVisible();
    await page.getByRole("button", { name: /View .* photo 1 full screen/ }).first().click();
    const viewer = page.getByRole("dialog").last();
    await expect(viewer.getByText(/^1 \/ \d+$/)).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(viewer.getByText(/^2 \/ \d+$/)).toBeVisible();
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.getByRole("button", { name: "Close photo tour" }).click();

    await page.getByRole("link", { name: "View host profile" }).click();
    await expect(page).toHaveURL(/\/users\//);
    await expect(page.getByRole("heading", { name: /^About / })).toBeVisible();
    await expect(page.getByTestId("listing-card").first()).toBeVisible();
  });

  test("results: filters dialog shows a live count and applies", async ({ page }) => {
    await page.goto("/s");
    await page.getByRole("button", { name: /^Filters/ }).click();
    const show = page.getByRole("button", { name: /^Show \d+ place/ });
    await expect(show).toBeVisible();
    const before = Number((await show.textContent())!.match(/\d+/)![0]);
    await page.getByRole("button", { name: "Pool", exact: true }).first().click();
    await expect.poll(async () => Number(((await show.textContent()) ?? "").match(/\d+/)?.[0] ?? before)).toBeLessThan(before);
    await show.click();
    await expect(page).toHaveURL(/amenities=Pool/);
  });

  test("results map renders price pins", async ({ page }) => {
    await page.goto("/s?location=Lisbon");
    await expect(page.getByRole("region", { name: "Map of search results" })).toBeVisible();
    await expect(page.locator(".kip-pin").first()).toBeVisible();
  });

  test("header collapses to the compact pill on scroll", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /^When/ })).toBeVisible();
    await page.mouse.wheel(0, 800);
    await expect(page.getByRole("button", { name: "Any week" })).toBeVisible();
    await page.getByRole("button", { name: "Any week" }).click();
    await expect(page.getByRole("button", { name: /^When/ })).toHaveAttribute("aria-expanded", "true");
  });
});
