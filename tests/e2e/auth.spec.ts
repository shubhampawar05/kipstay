import { expect, test } from "@playwright/test";
import { logIn, signUp, TEST_PASSWORD } from "./helpers";

test.describe("authentication", () => {
  test("sign up, log out, and log back in", async ({ page }) => {
    const email = await signUp(page, "Avery Auth");
    await expect(page.getByRole("button", { name: "Account menu for Avery Auth" })).toBeVisible();

    await page.getByRole("button", { name: "Account menu for Avery Auth" }).click();
    await page.getByRole("menuitem", { name: "Log out" }).click();
    await expect(page.getByRole("button", { name: "Main menu" })).toBeVisible();

    await logIn(page, email);
    await expect(page.getByRole("button", { name: "Account menu for Avery Auth" })).toBeVisible();
  });

  test("rejects bad credentials and weak passwords", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nobody@e2e.kipstay.test");
    await page.getByLabel("Password").fill("wrong-password-1");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "don't match" })).toBeVisible();

    await page.goto("/signup");
    await page.getByLabel("Full name").fill("Weak Password");
    await page.getByLabel("Email").fill("weak@e2e.kipstay.test");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Use at least 10 characters")).toBeVisible();
  });

  test("duplicate emails are refused", async ({ page, browser }) => {
    const email = await signUp(page, "First Owner");
    const other = await browser.newPage();
    await other.goto("/signup");
    await other.getByLabel("Full name").fill("Second Owner");
    await other.getByLabel("Email").fill(email);
    await other.getByLabel("Password").fill(TEST_PASSWORD);
    await other.getByRole("button", { name: "Create account" }).click();
    await expect(other.getByText("already exists")).toBeVisible();
    await other.close();
  });

  test("protected pages redirect to login and back", async ({ page }) => {
    await page.goto("/trips");
    await expect(page).toHaveURL(/\/login\?next=%2Ftrips/);
    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL(/\/signup\?next=%2Ftrips/);
    await page.getByLabel("Full name").fill("Redirect Tester");
    await page.getByLabel("Email").fill(`redirect-${Date.now()}@e2e.kipstay.test`);
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/trips$/);
    await expect(page.getByRole("heading", { name: "No trips booked… yet!" })).toBeVisible();
  });
});
