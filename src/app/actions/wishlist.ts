"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type WishlistResult = { ok: true; saved: boolean } | { ok: false; reason: "auth" | "not_found" };

export async function toggleWishlist(listingId: string): Promise<WishlistResult> {
  const id = z.string().min(1).max(40).safeParse(listingId);
  if (!id.success) return { ok: false, reason: "not_found" };

  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "auth" };

  const listing = await prisma.listing.findFirst({ where: { id: id.data, isPublished: true }, select: { id: true } });
  if (!listing) return { ok: false, reason: "not_found" };

  const key = { userId_listingId: { userId: user.id, listingId: listing.id } };
  const existing = await prisma.wishlistItem.findUnique({ where: key });
  if (existing) {
    await prisma.wishlistItem.delete({ where: key });
  } else {
    // upsert keeps a double-click from failing on the composite primary key.
    await prisma.wishlistItem.upsert({ where: key, create: { userId: user.id, listingId: listing.id }, update: {} });
  }
  revalidatePath("/wishlists");
  return { ok: true, saved: !existing };
}
