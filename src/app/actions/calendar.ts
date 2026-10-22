"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { lockListing } from "@/lib/bookings";
import { overlappingBlocks, overlappingBookings } from "@/lib/listings";
import { formatStayRange, nightsBetween, todayUTC } from "@/lib/dates";
import { blockSchema } from "@/lib/validation";

export type CalendarActionResult = { ok: true; message: string } | { ok: false; error: string };

const MAX_BLOCK_NIGHTS = 365;

function revalidateListing(listingId: string) {
  revalidatePath(`/host/listings/${listingId}/calendar`);
  revalidatePath(`/rooms/${listingId}`);
  revalidatePath("/s");
}

/** Closes nights on a listing the current user owns. Never overlaps a live booking or another block. */
export async function blockDatesAction(input: { listingId: string; start: string; end: string; note?: string }): Promise<CalendarActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in again to manage your calendar." };
  const parsed = blockSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid dates." };
  const { listingId, startDate, endDate, note } = parsed.data;

  if (startDate < todayUTC()) return { ok: false, error: "You can't block nights in the past." };
  if (nightsBetween(startDate, endDate) > MAX_BLOCK_NIGHTS) return { ok: false, error: `Block at most ${MAX_BLOCK_NIGHTS} nights at a time.` };

  const result = await prisma.$transaction(async (tx): Promise<CalendarActionResult> => {
    // Ownership is checked in the same query that loads the listing; other hosts get "not found".
    const listing = await tx.listing.findFirst({ where: { id: listingId, hostId: user.id }, select: { id: true } });
    if (!listing) return { ok: false, error: "Listing not found." };
    await lockListing(tx, listing.id);

    const booking = await tx.booking.findFirst({
      where: { listingId, ...overlappingBookings(startDate, endDate) },
      select: { checkIn: true, checkOut: true },
      orderBy: { checkIn: "asc" },
    });
    if (booking)
      return { ok: false, error: `A guest is booked ${formatStayRange(booking.checkIn, booking.checkOut)}. Cancel that reservation first.` };
    const block = await tx.availabilityBlock.findFirst({ where: { listingId, ...overlappingBlocks(startDate, endDate) }, select: { id: true } });
    if (block) return { ok: false, error: "Some of those nights are already blocked." };

    await tx.availabilityBlock.create({ data: { listingId, startDate, endDate, note } });
    const nights = nightsBetween(startDate, endDate);
    return { ok: true, message: `Blocked ${nights} night${nights === 1 ? "" : "s"}: ${formatStayRange(startDate, endDate)}` };
  });
  // After commit, so a re-render can't read the pre-transaction calendar.
  if (result.ok) revalidateListing(listingId);
  return result;
}

/** Re-opens a block. Scoped to blocks on the current user's listings. */
export async function unblockDatesAction(blockId: string): Promise<CalendarActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in again to manage your calendar." };
  if (typeof blockId !== "string" || blockId.length > 40) return { ok: false, error: "Block not found." };
  const block = await prisma.availabilityBlock.findFirst({
    where: { id: blockId, listing: { hostId: user.id } },
    select: { id: true, listingId: true },
  });
  if (!block) return { ok: false, error: "Block not found." };
  await prisma.availabilityBlock.delete({ where: { id: block.id } });
  revalidateListing(block.listingId);
  return { ok: true, message: "Nights reopened" };
}
