import { expect, test } from "@playwright/test";
import { createListing, signUp } from "./helpers";

test.describe("messaging", () => {
  test.skip(({ isMobile }) => isMobile, "desktop flow");

  test("guest messages a host, host sees it unread and replies, strangers get a 404", async ({ browser }) => {
    const hostPage = await browser.newPage();
    await signUp(hostPage, "Hana Host");
    const listingId = await createListing(hostPage, { title: `E2E Message Loft ${Date.now()}`, city: `Msgtown${Date.now().toString(36)}` });

    const guest = await browser.newPage();
    await signUp(guest, "Gus Guest");
    await guest.goto(`/rooms/${listingId}`);
    await guest.getByRole("link", { name: "Message host" }).click();
    await expect(guest.getByRole("heading", { name: "Contact Hana" })).toBeVisible();
    const send = guest.getByRole("button", { name: "Send message" });
    await expect(send).toBeDisabled();
    await guest.getByLabel("Message Hana").fill("Hi Hana, is there parking nearby?");
    await send.click();
    await expect(guest).toHaveURL(/\/messages\/[^/]+$/);
    const thread = guest.getByTestId("thread");
    await expect(thread).toContainText("Hi Hana, is there parking nearby?");
    const conversationUrl = guest.url();

    // Asking again about the same listing continues the same conversation.
    await guest.goto(`/messages/new?listing=${listingId}`);
    await expect(guest).toHaveURL(conversationUrl);

    // The host sees an unread conversation, opens it (which marks it read) and replies with Enter.
    await hostPage.goto("/");
    await expect(hostPage.getByRole("button", { name: /1 unread message/ })).toBeVisible();
    await hostPage.goto("/messages");
    await expect(hostPage.getByTestId("inbox").getByTestId("unread-dot")).toHaveCount(1);
    await hostPage.getByTestId("inbox").getByRole("link").first().click();
    await hostPage.getByLabel("Message Gus Guest").fill("Yes, free street parking right outside.");
    await hostPage.keyboard.press("Enter");
    await expect(hostPage.getByTestId("thread")).toContainText("free street parking");
    await hostPage.goto("/messages");
    await expect(hostPage.getByTestId("inbox").getByTestId("unread-dot")).toHaveCount(0);

    await guest.reload();
    await expect(guest.getByTestId("thread")).toContainText("Yes, free street parking right outside.");

    const stranger = await browser.newPage();
    await signUp(stranger, "Sly Stranger");
    const res = await stranger.goto(conversationUrl);
    expect(res?.status()).toBe(404);

    await Promise.all([hostPage.close(), guest.close(), stranger.close()]);
  });

  test("hosts can't message themselves and logged-out visitors are asked to log in", async ({ page }) => {
    await page.goto("/s?location=Lisbon");
    const href = await page.getByTestId("listing-card").first().locator("a").first().getAttribute("href");
    const listingId = href!.split("?")[0].split("/").pop();
    await page.goto(`/messages/new?listing=${listingId}`);
    await expect(page).toHaveURL(/\/login\?next=/);

    await signUp(page, "Solo Host");
    const own = await createListing(page, { title: `E2E Own Place ${Date.now()}`, city: "Selfton" });
    await page.goto(`/rooms/${own}`);
    await expect(page.getByRole("link", { name: "Message host" })).toHaveCount(0);
    const res = await page.goto(`/messages/new?listing=${own}`);
    expect(res?.status()).toBe(404);
  });
});
