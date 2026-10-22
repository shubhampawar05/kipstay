import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

// Integration check against the dev database: the exclusion constraint must stop
// double bookings even when two writes race past the application-level check.
const prisma = new PrismaClient();
test.afterAll(() => prisma.$disconnect());

test("database rejects overlapping bookings for the same listing", async () => {
  const listing = await prisma.listing.findFirstOrThrow({ where: { isPublished: true } });
  const guest = await prisma.user.create({
    data: { name: "Constraint Tester", email: `constraint-${Date.now()}@e2e.kipstay.test`, passwordHash: "x" },
  });
  const base = new Date(Date.UTC(2030, 0, 1 + (Date.now() % 300)));
  const day = (n: number) => new Date(base.getTime() + n * 86_400_000);
  const row = (checkIn: Date, checkOut: Date) => ({
    listingId: listing.id,
    guestId: guest.id,
    checkIn,
    checkOut,
    adults: 1,
    nights: 1,
    nightlyPrice: 1,
    subtotal: 1,
    cleaningFee: 0,
    serviceFee: 0,
    taxes: 0,
    total: 1,
    paymentRef: "mock_constraint_test",
  });

  try {
    const results = await Promise.allSettled([
      prisma.booking.create({ data: row(day(0), day(3)) }),
      prisma.booking.create({ data: row(day(2), day(5)) }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(String(rejected.reason)).toMatch(/Booking_no_overlap|23P01/);

    // Back-to-back stays (checkout day = next check-in day) are allowed.
    await expect(prisma.booking.create({ data: row(day(10), day(12)) })).resolves.toBeTruthy();
    await expect(prisma.booking.create({ data: row(day(12), day(14)) })).resolves.toBeTruthy();

    // Cancelled bookings don't block.
    const first = await prisma.booking.findFirstOrThrow({ where: { guestId: guest.id, checkIn: { lt: day(10) } } });
    await prisma.booking.update({ where: { id: first.id }, data: { status: "CANCELLED" } });
    await expect(prisma.booking.create({ data: row(day(0), day(3)) })).resolves.toBeTruthy();
  } finally {
    await prisma.user.delete({ where: { id: guest.id } });
  }
});
