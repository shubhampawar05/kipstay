import { Suspense } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import type { ListingCardData } from "@/lib/listings";
import { propertyTypeLabel } from "@/lib/constants";
import { calculateQuote, formatMoney } from "@/lib/pricing";
import { CardCarousel } from "./card-carousel";
import { WishlistButton } from "./wishlist-button";

export type StayContext = { checkin?: Date; checkout?: Date; query?: string };

export function ListingCard({
  listing,
  saved,
  stay = {},
  priority,
}: {
  listing: ListingCardData;
  saved: boolean;
  stay?: StayContext;
  priority?: boolean;
}) {
  const quote = stay.checkin && stay.checkout ? calculateQuote(listing, stay.checkin, stay.checkout) : null;
  const href = `/rooms/${listing.id}${stay.query ? `?${stay.query}` : ""}`;
  const isNew = listing.reviewCount === 0;
  const favourite = listing.avgRating >= 4.9 && listing.reviewCount >= 3;
  const heading = `${propertyTypeLabel(listing.propertyType)} in ${listing.city}`;

  return (
    <article className="group relative" aria-labelledby={`title-${listing.id}`} data-testid="listing-card">
      <Link href={href} className="absolute inset-0 z-10 rounded-xl" aria-labelledby={`title-${listing.id}`}>
        <span className="sr-only">View {listing.title}</span>
      </Link>
      <div className="relative">
        <CardCarousel images={listing.images} title={listing.title} priority={priority} />
        {favourite && (
          <span className="pointer-events-none absolute top-3 left-3 z-20 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-black shadow">
            Guest favourite
          </span>
        )}
        <div className="absolute top-2 right-2 z-20">
          <Suspense>
            <WishlistButton listingId={listing.id} title={listing.title} saved={saved} />
          </Suspense>
        </div>
      </div>
      <div className="relative z-0 mt-3 space-y-0.5 text-[15px]">
        <div className="flex items-start justify-between gap-2">
          <h3 id={`title-${listing.id}`} className="truncate font-semibold">
            {heading}
          </h3>
          <span className="flex shrink-0 items-center gap-1 text-sm" aria-label={isNew ? "New listing" : `Rated ${listing.avgRating.toFixed(2)} out of 5 from ${listing.reviewCount} reviews`}>
            {isNew ? (
              "New"
            ) : (
              <>
                <Star className="size-3.5 fill-current" aria-hidden />
                {listing.avgRating.toFixed(2)} <span className="text-muted-foreground">({listing.reviewCount})</span>
              </>
            )}
          </span>
        </div>
        <p className="truncate text-muted-foreground">{listing.title}</p>
        <p className="text-muted-foreground">
          {listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} bedroom${listing.bedrooms === 1 ? "" : "s"}`} · {listing.beds} bed
          {listing.beds === 1 ? "" : "s"}
        </p>
        <p className="pt-1">
          {quote ? (
            <>
              {quote.discount > 0 && stay.checkin && stay.checkout && (
                <span className="mr-1 text-muted-foreground line-through" aria-label="Price before weekly discount">
                  {formatMoney(calculateQuote(listing, stay.checkin, stay.checkout, { applyDiscount: false }).total)}
                </span>
              )}
              <span className="font-semibold">{formatMoney(quote.total)}</span>{" "}
              <span className="text-muted-foreground">
                for {quote.nights} night{quote.nights === 1 ? "" : "s"}
              </span>
            </>
          ) : (
            <>
              <span className="font-semibold">{formatMoney(listing.pricePerNight)}</span> <span className="text-muted-foreground">night</span>
            </>
          )}
        </p>
      </div>
    </article>
  );
}

export function ListingGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>;
}
