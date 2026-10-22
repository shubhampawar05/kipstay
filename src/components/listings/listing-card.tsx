import { Suspense } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import type { ListingCardData } from "@/lib/listings";
import { propertyTypeLabel } from "@/lib/constants";
import { calculateQuote, formatMoney } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { CardCarousel } from "./card-carousel";
import { WishlistButton } from "./wishlist-button";

export type StayContext = { checkin?: Date; checkout?: Date; query?: string };

/**
 * Listing card measured on the reference: 20:19 media with 20px radius, frosted "Guest favourite" badge,
 * 32px heart. `compact` is the home-row variant (13/16 text, one meta line); `full` is the results variant.
 */
export function ListingCard({
  listing,
  saved,
  stay = {},
  priority,
  variant = "full",
}: {
  listing: ListingCardData;
  saved: boolean;
  stay?: StayContext;
  priority?: boolean;
  variant?: "compact" | "full";
}) {
  const quote = stay.checkin && stay.checkout ? calculateQuote(listing, stay.checkin, stay.checkout) : null;
  const href = `/rooms/${listing.id}${stay.query ? `?${stay.query}` : ""}`;
  const isNew = listing.reviewCount === 0;
  const favourite = listing.avgRating >= 4.9 && listing.reviewCount >= 3;
  const heading = `${propertyTypeLabel(listing.propertyType)} in ${listing.city}`;
  const rating = isNew ? "New" : listing.avgRating.toFixed(2).replace(/0$/, "");
  const ratingLabel = isNew ? "New listing" : `Rated ${listing.avgRating.toFixed(2)} out of 5 from ${listing.reviewCount} reviews`;

  const price = quote ? (
    <>
      {quote.discount > 0 && stay.checkin && stay.checkout && (
        <span className="mr-1 text-muted-foreground line-through" aria-label="Price before weekly discount">
          {formatMoney(calculateQuote(listing, stay.checkin, stay.checkout, { applyDiscount: false }).total)}
        </span>
      )}
      <span className={cn(variant === "full" && "font-semibold text-foreground underline underline-offset-2")}>{formatMoney(quote.total)}</span>{" "}
      for {quote.nights} night{quote.nights === 1 ? "" : "s"}
    </>
  ) : (
    <>
      <span className={cn(variant === "full" && "font-semibold text-foreground")}>{formatMoney(listing.pricePerNight)}</span> night
    </>
  );

  return (
    <article className="group/card relative" aria-labelledby={`title-${listing.id}`} data-testid="listing-card">
      <Link href={href} className="absolute inset-0 z-10 rounded-[20px] outline-none focus-visible:shadow-[var(--focus-ring)]" aria-labelledby={`title-${listing.id}`}>
        <span className="sr-only">View {listing.title}</span>
      </Link>
      {/* On touch screens the photo track sits above the card-wide link so it can be swiped (its slides link to the
          listing too); with a mouse, the arrows page it and the card link stays the click target. */}
      <div className="relative pointer-coarse:z-[15]">
        <CardCarousel images={listing.images} title={listing.title} href={href} priority={priority} dots={variant === "full"} />
        {favourite && (
          <span className="pointer-events-none absolute top-3 left-3 z-20 max-w-[calc(100%-60px)] truncate rounded-[14px] border border-white/50 bg-white/80 px-[9.5px] py-[5.5px] text-xs leading-none font-semibold text-foreground shadow-elev-1 backdrop-blur-sm">
            Guest favourite
          </span>
        )}
        <div className="absolute top-3 right-3 z-20">
          <Suspense>
            <WishlistButton listingId={listing.id} title={listing.title} saved={saved} />
          </Suspense>
        </div>
      </div>

      {variant === "compact" ? (
        <div className="mx-1 mt-2 grid gap-0.5 text-[13px] leading-4">
          <h3 id={`title-${listing.id}`} className="truncate font-medium text-foreground">
            {heading}
          </h3>
          <p className="truncate text-muted-foreground">
            {price}
            <span aria-hidden> · </span>
            <span aria-label={ratingLabel}>
              <Star className="mb-px inline size-2.5 fill-current" aria-hidden /> {rating}
            </span>
          </p>
        </div>
      ) : (
        <div className="mt-3 grid gap-0.5 text-[15px] leading-[19px]">
          <div className="flex items-start justify-between gap-2">
            <h3 id={`title-${listing.id}`} className="truncate font-semibold text-foreground">
              {heading}
            </h3>
            <span className="flex shrink-0 items-center gap-1" aria-label={ratingLabel}>
              {isNew ? (
                "New"
              ) : (
                <>
                  <Star className="size-3 fill-current" aria-hidden />
                  {rating} <span className="text-muted-foreground">({listing.reviewCount})</span>
                </>
              )}
            </span>
          </div>
          <p className="truncate text-muted-foreground">{listing.title}</p>
          <p className="truncate text-muted-foreground">
            {listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} bedroom${listing.bedrooms === 1 ? "" : "s"}`} · {listing.beds} bed
            {listing.beds === 1 ? "" : "s"} · {listing.bathrooms} bath{listing.bathrooms === 1 ? "" : "s"}
          </p>
          <p className="mt-1.5 text-muted-foreground">{price}</p>
          {listing.cancellationPolicy === "FLEXIBLE" && (
            <p className="mt-1">
              <span className="inline-block rounded-md bg-grey-100 px-1.5 py-0.5 text-xs text-foreground">Free cancellation</span>
            </p>
          )}
        </div>
      )}
    </article>
  );
}

export function ListingGrid({ children, columns = "default" }: { children: React.ReactNode; columns?: "default" | "split" }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-6 gap-y-10",
        columns === "split" ? "sm:grid-cols-2 min-[1440px]:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[1640px]:grid-cols-5",
      )}
    >
      {children}
    </div>
  );
}
