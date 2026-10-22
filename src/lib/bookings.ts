import "server-only";
import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { nightsBetween, todayUTC } from "./dates";
import { overlappingBookings } from "./listings";
import { calculateQuote, MAX_NIGHTS, type Quote } from "./pricing";
import type { BookingRequest } from "./validation";

export type StayCheck =
  | { ok: true; quote: Quote; listing: { id: string; title: string; hostId: string } }
  | { ok: false; error: string };

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * Validates a stay against the listing's rules and current bookings, and prices it.
 * Used for quotes, the checkout page, and (inside a transaction) booking creation.
 */
export async function checkStay(req: BookingRequest, userId: string | null, db: Db = prisma): Promise<StayCheck> {
  const listing = await db.listing.findFirst({ where: { id: req.listingId, isPublished: true } });
  if (!listing) return { ok: false, error: "This listing is not available." };
  if (userId && listing.hostId === userId) return { ok: false, error: "You can't book your own listing." };

  const nights = nightsBetween(req.checkIn, req.checkOut);
  if (req.checkIn < todayUTC()) return { ok: false, error: "Check-in can't be in the past." };
  if (nights < 1) return { ok: false, error: "Check-out must be after check-in." };
  if (nights > MAX_NIGHTS) return { ok: false, error: `Stays are limited to ${MAX_NIGHTS} nights.` };
  if (nights < listing.minNights)
    return { ok: false, error: `This place has a ${listing.minNights}-night minimum stay.` };

  const guests = req.adults + req.children;
  if (guests > listing.maxGuests)
    return { ok: false, error: `This place allows up to ${listing.maxGuests} guests (infants don't count).` };
  if (req.pets > 0 && !listing.allowsPets) return { ok: false, error: "This place doesn't allow pets." };

  const clash = await db.booking.findFirst({
    where: { listingId: listing.id, ...overlappingBookings(req.checkIn, req.checkOut) },
    select: { id: true },
  });
  if (clash) return { ok: false, error: "Those dates are no longer available." };

  return { ok: true, quote: calculateQuote(listing, req.checkIn, req.checkOut), listing };
}

export type CreateBookingResult = { ok: true; bookingId: string } | { ok: false; error: string };

function isOverlapViolation(error: unknown) {
  // PostgreSQL exclusion_violation (23P01) raised by the "Booking_no_overlap" constraint.
  const text = error instanceof Error ? error.message : String(error);
  return text.includes("Booking_no_overlap") || text.includes("23P01");
}

export async function createBooking(req: BookingRequest, guestId: string): Promise<CreateBookingResult> {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const check = await checkStay(req, guestId, tx);
        if (!check.ok) return check;
        const { quote } = check;

        // Mock payment: no card data is collected or sent anywhere. A real
        // provider would authorise `quote.total` here before confirming.
        const paymentRef = `mock_${randomBytes(9).toString("base64url")}`;

        const booking = await tx.booking.create({
          data: {
            listingId: req.listingId,
            guestId,
            checkIn: req.checkIn,
            checkOut: req.checkOut,
            adults: req.adults,
            children: req.children,
            infants: req.infants,
            pets: req.pets,
            nights: quote.nights,
            nightlyPrice: quote.nightlyPrice,
            subtotal: quote.subtotal,
            discount: quote.discount,
            cleaningFee: quote.cleaningFee,
            serviceFee: quote.serviceFee,
            taxes: quote.taxes,
            total: quote.total,
            currency: quote.currency,
            paymentRef,
          },
        });
        return { ok: true as const, bookingId: booking.id };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  } catch (error) {
    // Two requests can pass the read check at the same moment; the exclusion
    // constraint guarantees only one of them commits.
    if (isOverlapViolation(error)) return { ok: false, error: "Those dates were just booked by someone else." };
    throw error;
  }
}

export async function cancelBooking(bookingId: string, userId: string): Promise<{ ok: boolean; error?: string }> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { listing: true } });
  if (!booking) return { ok: false, error: "Reservation not found." };
  const isGuest = booking.guestId === userId;
  const isHost = booking.listing.hostId === userId;
  if (!isGuest && !isHost) return { ok: false, error: "Reservation not found." };
  if (booking.status === "CANCELLED") return { ok: false, error: "This reservation is already cancelled." };
  if (booking.checkIn <= todayUTC()) return { ok: false, error: "Stays that have started can't be cancelled online." };

  await prisma.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED", cancelledAt: new Date() } });
  return { ok: true };
}

export async function refreshListingRating(listingId: string, db: Db = prisma) {
  const agg = await db.review.aggregate({ where: { listingId }, _avg: { rating: true }, _count: { _all: true } });
  await db.listing.update({
    where: { id: listingId },
    data: { avgRating: Math.round((agg._avg.rating ?? 0) * 100) / 100, reviewCount: agg._count._all },
  });
}
