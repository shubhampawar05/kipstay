import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { signUp } from "./helpers";

const prisma = new PrismaClient();
test.afterAll(() => prisma.$disconnect());

test.describe("reviews", () => {
  test.skip(({ isMobile }) => isMobile, "desktop flow");

  test("guest rates a finished stay by category; the listing shows the breakdown", async ({ page }) => {
    const email = await signUp(page, "Rhea Reviewer");
    const guest = await prisma.user.findUniqueOrThrow({ where: { email } });
    // A brand-new listing so the breakdown reflects only this review.
    const host = await prisma.user.findFirstOrThrow({ where: { email: "host@kipstay.test" } });
    const template = await prisma.listing.findFirstOrThrow({ where: { hostId: host.id } });
    const pick = [
      "hostId",
      "description",
      "propertyType",
      "category",
      "city",
      "region",
      "country",
      "latitude",
      "longitude",
      "maxGuests",
      "bedrooms",
      "beds",
      "bathrooms",
      "pricePerNight",
      "images",
      "amenities",
    ] as const;
    const fields = Object.fromEntries(pick.map((k) => [k, template[k]])) as Pick<typeof template, (typeof pick)[number]>;
    const listing = await prisma.listing.create({ data: { ...fields, title: `E2E Review Cabin ${Date.now()}` } });
    const day = (n: number) => new Date(Date.UTC(2026, 0, 1 + n));
    const booking = await prisma.booking.create({
      data: {
        listingId: listing.id,
        guestId: guest.id,
        checkIn: day(0),
        checkOut: day(3),
        adults: 2,
        nights: 3,
        nightlyPrice: 10000,
        subtotal: 30000,
        cleaningFee: 0,
        serviceFee: 0,
        taxes: 0,
        total: 30000,
        paymentRef: "mock_e2e_review",
      },
    });

    await page.goto(`/trips/${booking.id}`);
    await page.getByLabel("Your review").fill("Lovely cabin, spotless and quiet. Would stay again.");
    await page.getByRole("button", { name: "Post review" }).click();
    // Category ratings are required; the typed review survives the failed submit.
    await expect(page.getByText("Rate cleanliness")).toBeVisible();
    await expect(page.getByLabel("Your review")).toHaveValue("Lovely cabin, spotless and quiet. Would stay again.");

    for (const [label, n] of [
      ["Cleanliness", 5],
      ["Accuracy", 4],
      ["Check-in", 5],
      ["Communication", 5],
      ["Location", 3],
      ["Value", 4],
    ] as [string, number][]) {
      // Click the star the radio is drawn as.
      const radio = page.getByLabel(`${label}: ${n} star${n === 1 ? "" : "s"}`);
      await page.locator("label", { has: radio }).click();
      await expect(radio).toBeChecked();
    }
    await page.getByRole("button", { name: "Post review" }).click();
    const posted = page.getByTestId("posted-review");
    await expect(posted).toContainText("Location");
    await expect(posted).toContainText("3/5");

    await page.goto(`/rooms/${listing.id}`);
    const breakdown = page.getByTestId("rating-breakdown");
    await expect(breakdown.getByLabel("Location: 3.0 out of 5")).toBeVisible();
    await expect(breakdown.getByLabel("Accuracy: 4.0 out of 5")).toBeVisible();
    await expect(breakdown).toContainText("Check-in");

    await prisma.listing.delete({ where: { id: listing.id } });
  });
});
