import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

// Integration check against the dev database for host calendar blocks.
const prisma = new PrismaClient();
test.afterAll(() => prisma.$disconnect());

test("database rejects overlapping or empty host blocks for the same listing", async () => {
  const listing = await prisma.listing.findFirstOrThrow({ where: { isPublished: true } });
  const base = new Date(Date.UTC(2031, 0, 1 + (Date.now() % 300)));
  const day = (n: number) => new Date(base.getTime() + n * 86_400_000);
  const created: string[] = [];
  const block = async (start: number, end: number) => {
    const b = await prisma.availabilityBlock.create({ data: { listingId: listing.id, startDate: day(start), endDate: day(end) } });
    created.push(b.id);
    return b;
  };

  try {
    await block(0, 3);
    await expect(block(2, 5)).rejects.toThrow(/AvailabilityBlock_no_overlap|23P01/);
    // Adjacent blocks share no night.
    await expect(block(3, 4)).resolves.toBeTruthy();
    await expect(block(6, 6)).rejects.toThrow(/AvailabilityBlock_dates_valid|23514/);
  } finally {
    await prisma.availabilityBlock.deleteMany({ where: { id: { in: created } } });
  }
});
