import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { rawImage } from "@/lib/photos";

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

  const lists = await prisma.wishlist.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      _count: { select: { items: { where: { listing: { isPublished: true } } } } },
      items: {
        where: { listing: { isPublished: true } },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { listing: { select: { images: true } } },
      },
    },
  });

  return (
    <div className="page-gutter py-10">
      <h1 className="text-[32px] leading-9 font-semibold">Wishlists</h1>
      <div className="mt-8">
        {lists.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Create your first wishlist"
            action={
              <Link href="/s" className={buttonVariants()}>
                Explore stays
              </Link>
            }
          >
            As you search, tap the heart icon to save your favourite places and experiences to a wishlist.
          </EmptyState>
        ) : (
          <ul className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {lists.map((l, n) => (
              <Reveal as="li" key={l.id} index={n % 5}>
                <WishlistTile id={l.id} name={l.name} count={l._count.items} covers={l.items.map((i) => i.listing.images[0]).filter(Boolean)} />
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Reference wishlist tile: one large photo, or a 1 + 2 collage once the list has three stays. */
function WishlistTile({ id, name, count, covers }: { id: string; name: string; count: number; covers: string[] }) {
  return (
    <Link href={`/wishlists/${id}`} className="group block rounded-2xl focus-ring" data-testid="wishlist-tile">
      <span className="grid aspect-square grid-cols-[2fr_1fr] grid-rows-2 gap-0.5 overflow-hidden rounded-2xl bg-grey-200 shadow-elev-1 transition-[box-shadow,transform] duration-300 ease-standard group-hover:shadow-elev-2 group-active:scale-[0.98]">
        {covers.length === 0 ? (
          <span className="col-span-2 row-span-2 grid place-items-center">
            <Heart className="size-8 text-grey-600" aria-hidden />
          </span>
        ) : (
          covers.map((src, i) => (
            <span
              key={src + i}
              className={cn(
                "relative overflow-hidden",
                covers.length < 3 ? (i === 0 ? "col-span-2 row-span-2" : "hidden") : i === 0 ? "row-span-2" : "",
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                unoptimized={rawImage(src)}
                className="object-cover transition-transform duration-500 ease-standard group-hover:scale-[1.04]"
                sizes="240px"
              />
            </span>
          ))
        )}
      </span>
      <span className="mt-3 block truncate text-base font-semibold">{name}</span>
      <span className="block text-sm text-muted-foreground">{count} saved</span>
    </Link>
  );
}
