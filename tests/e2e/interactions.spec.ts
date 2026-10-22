import { expect, test } from "@playwright/test";
import { createListing, isoInDays, openCard, signUp } from "./helpers";

test.describe("round-3 interactions", () => {
  test.skip(({ isMobile }) => isMobile, "desktop flows");

  test("host blocks nights on the calendar; guests can't book them; reopening frees them", async ({ page, browser }) => {
    const city = `Blockville${Date.now().toString(36)}`;
    await signUp(page, "Cal Host");
    const id = await createListing(page, { title: `E2E Calendar Loft ${Date.now()}`, city });

    await page.goto("/host");
    await page.getByTestId("host-listing-row").filter({ hasText: "E2E Calendar Loft" }).getByRole("link", { name: "Calendar" }).click();
    await expect(page).toHaveURL(new RegExp(`/host/listings/${id}/calendar`));
    await expect(page.getByRole("heading", { name: "Nothing blocked" })).toBeVisible();

    const [first, last, checkout] = [isoInDays(5), isoInDays(7), isoInDays(8)];
    const calendar = page.getByTestId("host-calendar");
    await calendar.locator(`td[data-day="${first}"] button`).click();
    await calendar.locator(`td[data-day="${last}"] button`).click();
    await expect(page.getByTestId("block-selection")).toContainText("3 nights");
    await page.getByLabel("Note (only you see this)").fill("Painting");
    await page.getByRole("button", { name: "Block nights" }).click();
    await expect(page.getByText(/^Blocked 3 nights/)).toBeVisible();
    await expect(page.getByTestId("block-list")).toContainText("Painting");
    await expect(calendar.locator(`td[data-day="${first}"] button`)).toBeDisabled();

    // A guest sees the nights as unavailable: the quote is refused and date search hides the listing.
    const guest = await browser.newPage();
    const quote = await guest.request.get(`/api/quote?listingId=${id}&checkin=${first}&checkout=${checkout}&adults=1`);
    expect(await quote.json()).toMatchObject({ ok: false, error: "The host has closed some of those nights." });
    await guest.goto(`/s?location=${city}&checkin=${first}&checkout=${checkout}`);
    await expect(guest.getByRole("heading", { name: "No exact matches" })).toBeVisible();

    await page.getByRole("button", { name: /Reopen/ }).click();
    await expect(page.getByText("Nights reopened")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nothing blocked" })).toBeVisible();

    const reopened = await guest.request.get(`/api/quote?listingId=${id}&checkin=${first}&checkout=${checkout}&adults=1`);
    expect((await reopened.json()).ok).toBe(true);
    await guest.goto(`/s?location=${city}&checkin=${first}&checkout=${checkout}`);
    await expect(guest.getByTestId("listing-card")).toHaveCount(1);
    await guest.close();
  });

  test("listing dates and guests live in the URL and survive reload", async ({ page }) => {
    await page.goto("/s?location=Lisbon");
    const href = await page.getByTestId("listing-card").first().locator("a").first().getAttribute("href");
    await page.goto(href!);
    const calendar = page.getByTestId("availability-calendar");
    // Pick the first two free, adjacent-enough days the calendar offers.
    const free = calendar.locator("td:not([data-disabled]) button:not([disabled])");
    await free.nth(10).click();
    await free.nth(13).click();
    await expect(page).toHaveURL(/checkin=\d{4}-\d{2}-\d{2}&checkout=\d{4}-\d{2}-\d{2}/);
    const url = page.url();
    await page.reload();
    await expect(page).toHaveURL(url);
    await expect(page.getByTestId("booking-widget").getByTestId("price-breakdown")).toBeVisible();
    await expect(page.getByTestId("booking-widget").getByRole("link", { name: "Reserve" })).toHaveAttribute("href", /checkin=/);
  });

  test("back and forward restore search results and listing pages", async ({ page }) => {
    await page.goto("/");
    await page.goto("/s?location=Kyoto&sort=price_asc");
    await expect(page.getByTestId("results-heading")).toContainText("Kyoto");
    await openCard(page.getByTestId("listing-card").first());
    await expect(page).toHaveURL(/\/rooms\//);
    await page.goBack();
    await expect(page).toHaveURL(/\/s\?location=Kyoto&sort=price_asc/);
    await expect(page.getByTestId("results-heading")).toContainText("Kyoto");
    await page.goForward();
    await expect(page).toHaveURL(/\/rooms\//);
  });

  test("card photo carousel slides and keeps the card link", async ({ page }) => {
    await page.goto("/s?location=Kyoto");
    const card = page.getByTestId("listing-card").first();
    await card.hover();
    const track = card.getByRole("group", { name: /photos$/ });
    await card.getByRole("button", { name: /^Next photo/ }).click();
    await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    await expect(card.getByRole("button", { name: /^Previous photo/ })).toBeVisible();
    // No horizontal page overflow from the tracks.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("account dropdown closes on Escape and outside click", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Main menu" });
    await trigger.click();
    await expect(page.getByRole("menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.mouse.click(10, 500);
    await expect(page.getByRole("menu")).toBeHidden();
  });

  test("rows below the fold reveal on scroll; reduced motion shows everything at once", async ({ page, browser }) => {
    await page.goto("/");
    const lastRow = page.locator(".kip-reveal-group").last();
    await expect(lastRow).toHaveAttribute("data-reveal", "pending");
    await lastRow.scrollIntoViewIfNeeded();
    await expect(lastRow).toHaveAttribute("data-reveal", "in");

    const reduced = await browser.newContext({ reducedMotion: "reduce" });
    const calm = await reduced.newPage();
    await calm.goto("/");
    await expect(calm.locator(".kip-reveal-group").last()).toBeAttached();
    await expect(calm.locator('[data-reveal="pending"]')).toHaveCount(0);
    await reduced.close();
  });
});
