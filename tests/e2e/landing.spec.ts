import { expect, test } from "@playwright/test";

test.describe("landing page", () => {
  test("first visit explains all-in prices once", async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.goto("/");

    const notice = page.getByRole("dialog", { name: /One price for your whole stay/ });
    await expect(notice).toBeVisible();
    await notice.getByRole("button", { name: "Got it" }).click();
    await expect(notice).toBeHidden();
    await expect(page.getByRole("status").filter({ hasText: "Prices include all fees" })).toBeVisible();

    // Remembered: no notice on the next visit.
    await page.reload();
    await expect(page.getByRole("heading", { name: /Popular homes in/ }).first()).toBeVisible();
    await page.waitForTimeout(1200);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await context.close();
  });

  test("category tiles open a category search", async ({ page }) => {
    await page.goto("/");
    const tiles = page.getByTestId("category-tile");
    await expect(tiles.first()).toBeVisible();
    expect(await tiles.count()).toBeGreaterThanOrEqual(5);
    await expect(tiles.first()).toContainText(/\d+ stays?/);
    await tiles.filter({ hasText: "Mountains" }).click();
    await expect(page).toHaveURL(/\/s\?category=MOUNTAINS/);
  });

  test("home cards show all-in totals and rows have taglines", async ({ page }) => {
    await page.goto("/");
    const row = page.getByRole("region", { name: "Guest favourites" });
    await expect(row.getByTestId("listing-card").first()).toContainText(/\$[\d,]+ for \d+ nights?/);
    await expect(row.getByRole("status")).toHaveText(/^\d+ of \d+ items showing$/);
    // Destination rows pair the heading with a tagline rather than just the country.
    const cityRow = page.getByRole("region", { name: /^(Popular homes in|Places to stay in|Stay in) / }).first();
    await expect(cityRow.locator("p").first()).not.toHaveText(/^[A-Z][a-z]+$/);
  });

  test("All / Homes / Experiences / Services tabs; the last two are coming soon", async ({ page }) => {
    await page.goto("/");
    const tabs = page.getByRole("navigation", { name: "Browse Kipstay" }).filter({ visible: true });
    await expect(tabs.getByRole("link", { name: "All" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "Coming soon to Kipstay" })).toBeVisible();

    await tabs.getByRole("link", { name: "Homes" }).click();
    await expect(page).toHaveURL(/\/homes$/);
    await expect(tabs.getByRole("link", { name: "Homes" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: /Popular homes in/ }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Coming soon to Kipstay" })).toHaveCount(0);

    for (const [label, path] of [["Experiences", "/experiences"], ["Services", "/services"]] as const) {
      await tabs.getByRole("link", { name: `${label} (coming soon)` }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole("heading", { level: 1, name: `${label} are coming soon` })).toBeVisible();
      await expect(tabs.getByRole("link", { name: `${label} (coming soon)` })).toHaveAttribute("aria-current", "page");
    }
    await page.getByRole("link", { name: "Explore homes" }).click();
    await expect(page).toHaveURL(/\/homes$/);
  });

  test("tabs give way to the compact search pill on scroll without resizing the header", async ({ page }) => {
    await page.goto("/");
    const tabs = page.getByRole("navigation", { name: "Browse Kipstay" }).filter({ visible: true });
    const header = page.locator("header");
    const height = await header.evaluate((el) => (el as HTMLElement).offsetHeight);
    await expect(tabs.getByRole("link", { name: "Homes" })).toBeInViewport();
    await page.mouse.wheel(0, 800);
    await expect(page.getByRole("button", { name: "Any week" })).toBeVisible();
    await expect(page.locator("header [inert] nav[aria-label='Browse Kipstay']")).toHaveCount(1);
    expect(await header.evaluate((el) => (el as HTMLElement).offsetHeight)).toBe(height);
  });

  test("every tab has the big search bar, adapted to the tab", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    // Panels animate in; clicking mid-animation makes Playwright re-scroll, which (by design) collapses the search band.
    await page.emulateMedia({ reducedMotion: "reduce" });

    for (const [path, label] of [["/", "Search stays"], ["/homes", "Search stays"], ["/experiences", "Search experiences"], ["/services", "Search services"]] as const) {
      await page.goto(path);
      await expect(page.getByRole("search", { name: label }).filter({ visible: true }).first()).toBeVisible();
    }

    // Experiences: landmark placeholder, quick dates beside a one-month calendar, no pets row.
    await page.goto("/experiences");
    await expect(page.getByRole("combobox", { name: "Where" }).filter({ visible: true })).toHaveAttribute("placeholder", "Search by city or landmark");
    await page.getByRole("button", { name: "When: Add dates" }).click();
    await page.getByRole("button", { name: /^Today [A-Z][a-z]{2} \d+$/ }).click();
    await expect(page.getByRole("button", { name: /^When: \w{3} \d+$/ })).toBeVisible();
    await page.getByRole("button", { name: /^Who:/ }).click();
    await expect(page.getByRole("group", { name: "Adults" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Pets" })).toHaveCount(0);
    await page.getByRole("button", { name: "Increase Adults" }).click();
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(/\/experiences\?checkin=\d{4}-\d{2}-\d{2}&checkout=\d{4}-\d{2}-\d{2}&adults=1$/);
    await expect(page.getByTestId("search-echo")).toContainText("Experiences · ");
    await expect(page.getByTestId("search-echo")).toContainText("1 guest");

    // Services: "Type of service" chips replace Who, and the search is echoed with a way to homes.
    await page.goto("/services");
    await page.getByRole("button", { name: "Type of service: Add service" }).click();
    await page.getByRole("button", { name: "Photography", exact: true }).click();
    await expect(page.getByRole("button", { name: "Photography", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("combobox", { name: "Where" }).filter({ visible: true }).fill("Kyoto");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(/\/services\?location=Kyoto&service=photography$/);
    await expect(page.getByTestId("search-echo")).toContainText("Photography in Kyoto");
    await expect(page.getByRole("button", { name: "Type of service: Photography" })).toBeVisible();
    await page.getByRole("link", { name: "See homes in Kyoto" }).click();
    await expect(page).toHaveURL(/\/s\?location=Kyoto$/);

    expect(errors).toEqual([]);
  });
});
