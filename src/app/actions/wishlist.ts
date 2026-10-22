"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const id = z.string().min(1).max(40);
const name = z.string().trim().min(1, "Give your wishlist a name").max(50, "Keep it under 50 characters");

export type WishlistSummary = { id: string; name: string; count: number; cover: string | null; hasListing: boolean };
export type WishlistResult = { ok: true; name?: string } | { ok: false; reason: "auth" | "not_found" | "invalid"; error?: string };

function revalidateWishlists(wishlistId?: string) {
  revalidatePath("/wishlists");
  if (wishlistId) revalidatePath(`/wishlists/${wishlistId}`);
}

async function publishedListing(listingId: string) {
  return prisma.listing.findFirst({ where: { id: listingId, isPublished: true }, select: { id: true } });
}

/** The current user's lists for the "Save to wishlist" dialog, newest activity first. */
export async function listMyWishlists(listingId?: string): Promise<{ ok: true; lists: WishlistSummary[] } | { ok: false; reason: "auth" }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "auth" };
  const lists = await prisma.wishlist.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      _count: { select: { items: true } },
      items: { orderBy: { createdAt: "desc" }, take: 1, select: { listing: { select: { images: true } } } },
    },
  });
  const listingKey = id.safeParse(listingId);
  const containing = listingKey.success
    ? new Set(
        (await prisma.wishlistItem.findMany({ where: { userId: user.id, listingId: listingKey.data }, select: { wishlistId: true } })).map(
          (i) => i.wishlistId,
        ),
      )
    : new Set<string>();
  return {
    ok: true,
    lists: lists.map((l) => ({
      id: l.id,
      name: l.name,
      count: l._count.items,
      cover: l.items[0]?.listing.images[0] ?? null,
      hasListing: containing.has(l.id),
    })),
  };
}

/** Adds a listing to one of the current user's lists. */
export async function saveToWishlist(listingId: string, wishlistId: string): Promise<WishlistResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "auth" };
  if (!id.safeParse(listingId).success || !id.safeParse(wishlistId).success) return { ok: false, reason: "not_found" };
  const [listing, list] = await Promise.all([
    publishedListing(listingId),
    prisma.wishlist.findFirst({ where: { id: wishlistId, userId: user.id }, select: { id: true, name: true } }),
  ]);
  if (!listing || !list) return { ok: false, reason: "not_found" };
  // upsert keeps a double-click from failing on the composite primary key.
  await prisma.$transaction([
    prisma.wishlistItem.upsert({
      where: { wishlistId_listingId: { wishlistId: list.id, listingId: listing.id } },
      create: { wishlistId: list.id, userId: user.id, listingId: listing.id },
      update: {},
    }),
    prisma.wishlist.update({ where: { id: list.id }, data: { updatedAt: new Date() } }),
  ]);
  revalidateWishlists(list.id);
  return { ok: true, name: list.name };
}

/** Creates a list (optionally saving a listing into it straight away). */
export async function createWishlist(rawName: string, listingId?: string): Promise<WishlistResult & { id?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "auth" };
  const parsed = name.safeParse(rawName);
  if (!parsed.success) return { ok: false, reason: "invalid", error: parsed.error.issues[0]?.message };
  const listing = listingId ? await publishedListing(listingId) : null;
  if (listingId && !listing) return { ok: false, reason: "not_found" };
  const list = await prisma.wishlist.create({
    data: { userId: user.id, name: parsed.data, items: listing ? { create: { userId: user.id, listingId: listing.id } } : undefined },
  });
  revalidateWishlists(list.id);
  return { ok: true, name: list.name, id: list.id };
}

/** Un-hearting a listing removes it from every list of the current user (as on the reference). */
export async function removeFromWishlists(listingId: string): Promise<WishlistResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "auth" };
  if (!id.safeParse(listingId).success) return { ok: false, reason: "not_found" };
  await prisma.wishlistItem.deleteMany({ where: { userId: user.id, listingId } });
  revalidateWishlists();
  return { ok: true };
}

export async function removeFromWishlist(wishlistId: string, listingId: string): Promise<WishlistResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "auth" };
  if (!id.safeParse(listingId).success || !id.safeParse(wishlistId).success) return { ok: false, reason: "not_found" };
  await prisma.wishlistItem.deleteMany({ where: { userId: user.id, wishlistId, listingId } });
  revalidateWishlists(wishlistId);
  return { ok: true };
}

export async function renameWishlist(wishlistId: string, rawName: string): Promise<WishlistResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "auth" };
  const parsed = name.safeParse(rawName);
  if (!parsed.success) return { ok: false, reason: "invalid", error: parsed.error.issues[0]?.message };
  if (!id.safeParse(wishlistId).success) return { ok: false, reason: "not_found" };
  const { count } = await prisma.wishlist.updateMany({ where: { id: wishlistId, userId: user.id }, data: { name: parsed.data } });
  if (count === 0) return { ok: false, reason: "not_found" };
  revalidateWishlists(wishlistId);
  return { ok: true, name: parsed.data };
}

export async function deleteWishlist(wishlistId: string): Promise<WishlistResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "auth" };
  if (!id.safeParse(wishlistId).success) return { ok: false, reason: "not_found" };
  // Items cascade with their list.
  const { count } = await prisma.wishlist.deleteMany({ where: { id: wishlistId, userId: user.id } });
  if (count === 0) return { ok: false, reason: "not_found" };
  revalidateWishlists();
  return { ok: true };
}
