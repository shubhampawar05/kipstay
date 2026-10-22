"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { cancelBooking, createBooking, refreshListingRating } from "@/lib/bookings";
import { todayUTC } from "@/lib/dates";
import { bookingRequestSchema, fieldErrors, reviewSchema } from "@/lib/validation";

export type ActionState = { error?: string; errors?: Record<string, string>; ok?: boolean } | undefined;

export async function reserveAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Log in again to finish booking." };

  if (formData.get("confirmMock") !== "on") {
    return { error: "Tick the box to confirm you understand this is a simulated payment." };
  }

  const parsed = bookingRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid booking request." };

  const result = await createBooking(parsed.data, user.id);
  if (!result.ok) return { error: result.error };

  revalidatePath(`/rooms/${parsed.data.listingId}`);
  redirect(`/trips/${result.bookingId}?confirmed=1`);
}

export async function cancelAction(bookingId: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Log in to manage reservations." };
  const result = await cancelBooking(bookingId, user.id);
  if (!result.ok) return { error: result.error };
  revalidatePath("/trips");
  revalidatePath(`/trips/${bookingId}`);
  revalidatePath("/host");
  return { ok: true };
}

export async function reviewAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Log in to write a review." };
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const booking = await prisma.booking.findUnique({ where: { id: parsed.data.bookingId }, include: { review: true } });
  if (!booking || booking.guestId !== user.id) return { error: "Reservation not found." };
  if (booking.status !== "CONFIRMED" || booking.checkOut > todayUTC()) return { error: "You can review a stay after checkout." };
  if (booking.review) return { error: "You've already reviewed this stay." };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.review.create({
        data: { listingId: booking.listingId, authorId: user.id, bookingId: booking.id, rating: parsed.data.rating, comment: parsed.data.comment },
      });
      await refreshListingRating(booking.listingId, tx);
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "You've already reviewed this stay." };
    throw e;
  }
  revalidatePath(`/trips/${booking.id}`);
  revalidatePath(`/rooms/${booking.listingId}`);
  return { ok: true };
}
