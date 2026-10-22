import { expect, type Locator, type Page } from "@playwright/test";

export const TEST_PASSWORD = "e2e-Password-2026";

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.kipstay.test`;
}

export async function signUp(page: Page, name = "E2E Tester") {
  const email = uniqueEmail(name.toLowerCase().replace(/\W+/g, "-"));
  await page.goto("/signup");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/signup"));
  return email;
}

export async function logIn(page: Page, email: string, password = TEST_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/** A future [checkin, checkout) window unlikely to collide with other runs or seed data. */
export function futureWindow(nights = 3, salt = 0) {
  const offset = 120 + ((Math.floor(Date.now() / 1000) + salt * 37) % 200);
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() + offset);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + nights);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { checkin: iso(start), checkout: iso(end) };
}

export async function firstListingId(page: Page, query = "") {
  await page.goto(`/s${query}`);
  const href = await page.getByTestId("listing-card").first().locator("a").first().getAttribute("href");
  expect(href).toBeTruthy();
  return href!.split("?")[0].split("/").pop()!;
}

/** Creates a published listing through the host form as the logged-in user; returns its id. */
export async function createListing(page: Page, { title, city }: { title: string; city: string }) {
  await page.goto("/host/listings/new");
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Description").fill("A bright test home with a big kitchen, fast wifi and a quiet garden for slow mornings.");
  await page.getByLabel("City").fill(city);
  await page.getByLabel("Region / state").fill("Test Region");
  await page.getByLabel("Country").fill("Testland");
  await page.getByLabel("Nightly price (USD)").fill("140");
  await page.getByRole("button", { name: "Create listing" }).click();
  await expect(page).toHaveURL(/\/host\?created=/);
  return new URL(page.url()).searchParams.get("created")!;
}

/** ISO date `days` from today (UTC), and the same day as the calendars key it. */
export function isoInDays(days: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Opens a listing card by tapping its title, which sits under the card-wide link on every device. */
export async function openCard(card: Locator) {
  await card.getByRole("heading").click({ force: true });
}
