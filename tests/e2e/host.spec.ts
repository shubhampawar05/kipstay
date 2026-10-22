import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

test.describe("hosting", () => {
  test("create, publish, edit and unpublish a listing", async ({ page, browser }) => {
    await signUp(page, "Harper Host");
    await page.goto("/host");
    await expect(page.getByRole("heading", { name: "Host your place on Kipstay" })).toBeVisible();
    await page.getByRole("link", { name: "Create your first listing" }).click();

    const title = `E2E Harbour Cabin ${Date.now()}`;
    await page.getByLabel("Title").fill("Hi");
    await page.getByLabel("Description").fill("A bright test cabin on the water with a wood stove, a big deck and quiet mornings.");
    await page.getByLabel("City").fill("Testhaven");
    await page.getByLabel("Region / state").fill("Test Region");
    await page.getByLabel("Country").fill("Testland");
    await page.getByLabel("Nightly price (USD)").fill("150");
    await page.getByLabel("Wifi").check();

    // Server-side validation errors are shown inline (the browser accepts "Hi").
    await page.getByRole("button", { name: "Create listing" }).click();
    await expect(page.getByText("Title needs at least 5 characters")).toBeVisible();
    await page.getByLabel("Title").fill(title);
    await page.getByRole("button", { name: "Create listing" }).click();

    await expect(page).toHaveURL(/\/host\?created=/);
    await expect(page.getByText("Your listing was created.")).toBeVisible();
    const row = page.getByTestId("host-listing-row").filter({ hasText: title });
    await expect(row).toContainText("Published");

    // It's searchable straight away.
    await page.goto("/s?location=Testhaven");
    await expect(page.getByTestId("listing-card").filter({ hasText: title })).toHaveCount(1);
    const href = await page.getByTestId("listing-card").filter({ hasText: title }).locator("a").first().getAttribute("href");

    // Edit the price.
    await page.goto("/host");
    await page.getByTestId("host-listing-row").filter({ hasText: title }).getByRole("link", { name: "Edit" }).click();
    await page.getByLabel("Nightly price (USD)").fill("175");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Your changes were saved.")).toBeVisible();
    await expect(page.getByTestId("host-listing-row").filter({ hasText: title })).toContainText("$175");

    // Other users can't edit it.
    const intruder = await browser.newPage();
    await signUp(intruder, "Ivy Intruder");
    const listingId = href!.split("?")[0].split("/").pop();
    const res = await intruder.goto(`/host/listings/${listingId}/edit`);
    expect(res?.status()).toBe(404);
    await intruder.close();

    // Unpublishing removes it from the public site.
    await page.getByTestId("host-listing-row").filter({ hasText: title }).getByRole("button", { name: "Unpublish" }).click();
    await expect(page.getByTestId("host-listing-row").filter({ hasText: title })).toContainText("Unpublished");
    const gone = await page.goto(href!);
    expect(gone?.status()).toBe(404);
  });
});
