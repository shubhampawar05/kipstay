"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { todayUTC } from "@/lib/dates";
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

export async function setPublishedAction(listingId: string, isPublished: boolean) {
  const user = await getCurrentUser();
  if (!user) return { error: "Log in again." };
  const { count } = await prisma.listing.updateMany({ where: { id: listingId, hostId: user.id }, data: { isPublished } });
  if (count === 0) return { error: "Listing not found." };
  revalidatePath("/host");
  revalidatePath(`/rooms/${listingId}`);
  return { ok: true };
}

export async function deleteListingAction(listingId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Log in again." };
  const listing = await prisma.listing.findFirst({ where: { id: listingId, hostId: user.id }, select: { id: true } });
  if (!listing) return { error: "Listing not found." };

  const upcoming = await prisma.booking.count({
    where: { listingId, status: "CONFIRMED", checkOut: { gt: todayUTC() } },
  });
  if (upcoming > 0) {
    return { error: `This listing has ${upcoming} upcoming reservation${upcoming === 1 ? "" : "s"}. Unpublish it instead, or cancel them first.` };
  }
  await prisma.listing.delete({ where: { id: listingId } });
  revalidatePath("/host");
  return { ok: true };
}
