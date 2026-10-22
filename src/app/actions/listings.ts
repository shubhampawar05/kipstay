"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { lockListing } from "@/lib/bookings";
import { fieldErrors, listingSchema } from "@/lib/validation";

export type ListingFormState =
  | {
      errors?: Record<string, string>;
      /** Echoed back so React's post-action form reset doesn't wipe what the host typed. */
      values?: Record<string, string | string[]>;
    }
  | undefined;

function echo(formData: FormData) {
  const values: Record<string, string | string[]> = {};
  for (const key of new Set(formData.keys())) {
    const all = formData.getAll(key).map(String);
    values[key] = key === "amenities" ? all : all[0];
  }
  return values;
}

function parseForm(formData: FormData) {
  return listingSchema.safeParse({
    ...Object.fromEntries(formData),
    amenities: formData.getAll("amenities"),
    allowsPets: formData.get("allowsPets") === "on",
    isPublished: formData.get("isPublished") === "on",
  });
}

export async function createListingAction(_prev: ListingFormState, formData: FormData): Promise<ListingFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/host/listings/new");
  const parsed = parseForm(formData);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: echo(formData) };

  const listing = await prisma.$transaction(async (tx) => {
    const created = await tx.listing.create({ data: { ...parsed.data, hostId: user.id } });
    if (!user.isHost) await tx.user.update({ where: { id: user.id }, data: { isHost: true } });
    return created;
  });
  revalidatePath("/host");
  redirect(`/host?created=${listing.id}`);
}

export async function updateListingAction(listingId: string, _prev: ListingFormState, formData: FormData): Promise<ListingFormState> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/host/listings/${listingId}/edit`);
  const parsed = parseForm(formData);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: echo(formData) };

  // updateMany scoped by hostId: a non-owner matches zero rows instead of editing someone else's listing.
  const { count } = await prisma.listing.updateMany({ where: { id: listingId, hostId: user.id }, data: parsed.data });
  if (count === 0) return { errors: { form: "Listing not found." }, values: echo(formData) };

  revalidatePath("/host");
  revalidatePath(`/rooms/${listingId}`);
  redirect("/host?updated=1");
}

const idSchema = z.string().min(1).max(40);

export async function setPublishedAction(listingId: string, isPublished: boolean) {
  const user = await getCurrentUser();
  if (!user) return { error: "Log in again." };
  if (!idSchema.safeParse(listingId).success || typeof isPublished !== "boolean") return { error: "Listing not found." };
  const { count } = await prisma.listing.updateMany({ where: { id: listingId, hostId: user.id }, data: { isPublished } });
  if (count === 0) return { error: "Listing not found." };
  revalidatePath("/host");
  revalidatePath(`/rooms/${listingId}`);
  return { ok: true };
}

/**
 * Deletes a listing that has never been booked. Bookings and reviews cascade with their listing, so a listing with
 * any reservation history is kept (guests' trips and receipts stay intact) and must be unpublished instead.
 * The check and delete run under the listing row lock that booking creation also takes.
 */
export async function deleteListingAction(listingId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Log in again." };
  if (!idSchema.safeParse(listingId).success) return { error: "Listing not found." };

  const result = await prisma.$transaction(async (tx) => {
    const listing = await tx.listing.findFirst({ where: { id: listingId, hostId: user.id }, select: { id: true } });
    if (!listing) return { error: "Listing not found." };
    await lockListing(tx, listing.id);
    const bookings = await tx.booking.count({ where: { listingId } });
    if (bookings > 0) {
      return {
        error: `This listing has ${bookings} reservation${bookings === 1 ? "" : "s"} on record, so it can't be deleted. Unpublish it instead.`,
      };
    }
    await tx.listing.delete({ where: { id: listingId } });
    return { ok: true };
  });
  if (result.ok) revalidatePath("/host");
  return result;
}
