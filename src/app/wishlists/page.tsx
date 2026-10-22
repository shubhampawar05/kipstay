import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cardSelect } from "@/lib/listings";
import { ListingCard, ListingGrid } from "@/components/listings/listing-card";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Wishlists" };

export default async function WishlistsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <EmptyState
        icon={Heart}
        title="Log in to view your wishlists"
        action={
          <Link href="/login?next=/wishlists" className={buttonVariants()}>
            Log in
          </Link>
        }
      >
        You can create, view or edit wishlists once you&apos;ve logged in.
      </EmptyState>
    );
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id, listing: { isPublished: true } },
    include: { listing: { select: cardSelect } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Wishlists</h1>
      <p className="mt-1 text-muted-foreground">
        {items.length} saved place{items.length === 1 ? "" : "s"}
      </p>
      <div className="mt-8">
        {items.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Nothing saved yet"
            action={
              <Link href="/s" className={buttonVariants()}>
                Explore stays
              </Link>
            }
          >
            Tap the heart on any stay to save it here.
          </EmptyState>
        ) : (
          <ListingGrid>
            {items.map((i) => (
              <ListingCard key={i.listingId} listing={i.listing} saved />
            ))}
          </ListingGrid>
        )}
      </div>
    </div>
  );
}
