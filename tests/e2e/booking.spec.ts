import { expect, test } from "@playwright/test";
import { firstListingId, futureWindow, signUp } from "./helpers";

test.describe("booking journey", () => {
  test("quote → reserve (mock payment) → trip → conflict → cancel", async ({ page, browser }) => {
    const listingId = await firstListingId(page, "?location=Banff");
    const { checkin, checkout } = futureWindow(3, 1);
    const stay = `checkin=${checkin}&checkout=${checkout}&adults=2`;

    await signUp(page, "Blake Booker");

    // Detail page: the booking widget fetches a server-side quote for the pre-filled dates.
    await page.goto(`/rooms/${listingId}?${stay}`);
    const widget = page.getByTestId("booking-widget");
    await expect(widget.getByTestId("price-breakdown")).toBeVisible();
    const widgetTotal = await widget.getByTestId("price-total").textContent();
    await widget.getByRole("link", { name: "Reserve" }).click();

    // Checkout shows the same server-computed total and a labelled mock payment.
    await expect(page).toHaveURL(new RegExp(`/book/${listingId}`));
    await expect(page.getByRole("heading", { name: "Confirm and pay" })).toBeVisible();
    await expect(page.getByText("Development mock payment")).toBeVisible();
    await expect(page.getByTestId("price-total")).toHaveText(widgetTotal!);

    // The acknowledgement is required (the server re-checks it too).
    const ack = page.getByLabel(/simulated payment/);
    await expect(ack).toHaveAttribute("required", "");
    await ack.check();
    await page.getByRole("button", { name: "Confirm and pay (mock)" }).click();

    await expect(page).toHaveURL(/\/trips\/.+\?confirmed=1/);
    await expect(page.getByText("Your reservation is confirmed")).toBeVisible();
    await expect(page.getByText(/mock_/).first()).toBeVisible();

    await page.goto("/trips");
    await expect(page.getByTestId("trip-card")).toHaveCount(1);

    // A second guest can't book overlapping nights, even via a direct checkout URL.
    const other = await browser.newPage();
    await signUp(other, "Casey Conflict");
    await other.goto(`/book/${listingId}?${stay}`);
    await expect(other.getByRole("alert").filter({ hasText: "no longer available" })).toBeVisible();
    // …and the dates disappear from date-filtered search.
    await other.goto(`/s?location=Banff&${stay}`);
    await expect(other.locator(`a[href^="/rooms/${listingId}"]`)).toHaveCount(0);

    // Cancelling releases the dates.
    await page.goto("/trips");
    await page.getByTestId("trip-card").first().click();
    await page.getByRole("button", { name: "Cancel reservation" }).click();
    await page.getByRole("button", { name: "Yes, cancel" }).click();
    await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();

    await other.goto(`/book/${listingId}?${stay}`);
    await expect(other.getByRole("heading", { name: "Confirm and pay" })).toBeVisible();
    await other.close();
  });

  test("server rejects invalid stays", async ({ page }) => {
    const listingId = await firstListingId(page, "?location=Lake%20Tahoe&sort=price_desc");
    await signUp(page, "Rule Tester");

    // Emerald Bay Lake House: 3-night minimum, 8 guests max, no pets.
    const { checkin } = futureWindow(1, 2);
    const next = new Date(`${checkin}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    const oneNight = next.toISOString().slice(0, 10);

    await page.goto(`/book/${listingId}?checkin=${checkin}&checkout=${oneNight}&adults=2`);
    await expect(page.getByRole("alert").filter({ hasText: "minimum stay" })).toBeVisible();

    await page.goto(`/book/${listingId}?checkin=2020-01-01&checkout=2020-01-05&adults=2`);
    await expect(page.getByRole("alert").filter({ hasText: "past" })).toBeVisible();

    const q = await page.request.get(`/api/quote?listingId=${listingId}&checkin=${checkin}&checkout=2099-01-01&adults=2`);
    expect((await q.json()).ok).toBe(false);
  });
});
