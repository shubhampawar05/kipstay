import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Heart } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cardSelect } from "@/lib/listings";
import { ListingCard, ListingGrid } from "@/components/listings/listing-card";
import { Reveal } from "@/components/motion/reveal";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { WishlistActions } from "./wishlist-actions";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage({ params }: PageProps<"/wishlists/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/wishlists/${id}`);
  // Scoped to the owner: other people's lists are a 404.
  const list = await prisma.wishlist.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      name: true,
      items: { where: { listing: { isPublished: true } }, orderBy: { createdAt: "desc" }, select: { listing: { select: cardSelect } } },
    },
  });
  if (!list) notFound();

  return (
    <div className="page-gutter py-8">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/wishlists"
          aria-label="Back to wishlists"
          className="grid size-9 place-items-center rounded-full transition-colors hover:bg-grey-100 focus-ring"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <WishlistActions id={list.id} name={list.name} />
      </div>
      <h1 className="mt-4 text-[32px] leading-9 font-semibold" data-testid="wishlist-name">
        {list.name}
      </h1>
      <p className="mt-1 text-muted-foreground">
        {list.items.length} saved stay{list.items.length === 1 ? "" : "s"}
      </p>
      <div className="mt-8">
        {list.items.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No saves yet"
            action={
              <Link href="/s" className={buttonVariants()}>
                Explore stays
              </Link>
            }
          >
            As you search, tap the heart icon to save your favourite places to this wishlist.
          </EmptyState>
        ) : (
          <ListingGrid>
            {list.items.map(({ listing }, n) => (
              <Reveal key={listing.id} index={n % 4}>
                <ListingCard listing={listing} saved />
              </Reveal>
            ))}
          </ListingGrid>
        )}
      </div>
    </div>
  );
}
