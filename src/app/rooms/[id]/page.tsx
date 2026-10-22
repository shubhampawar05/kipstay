import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Check, Clock, DoorOpen, PawPrint, ShieldCheck, Sparkles, Star, X } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getBookedRanges, getListingDetail, getWishlistIds } from "@/lib/listings";
import { CANCELLATION_POLICIES, propertyTypeLabel } from "@/lib/constants";
import { toISODate } from "@/lib/dates";
import { normaliseGuests } from "@/lib/validation";
import { PhotoGallery } from "@/components/listings/photo-gallery";
import { StayProvider } from "@/components/listings/stay-context";
import { AvailabilityCalendar } from "@/components/listings/availability-calendar";
import { BookingWidget, MobileReserveBar } from "@/components/listings/booking-widget";
import { WishlistButton } from "@/components/listings/wishlist-button";
import { Separator } from "@/components/ui/separator";

export async function generateMetadata({ params }: PageProps<"/rooms/[id]">): Promise<Metadata> {
  const listing = await getListingDetail((await params).id);
  return listing ? { title: listing.title, description: listing.description.slice(0, 160) } : { title: "Listing not found" };
}

const num = (v: string | string[] | undefined) => Math.max(0, Math.min(16, Number(Array.isArray(v) ? v[0] : v) || 0));
const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default async function ListingPage({ params, searchParams }: PageProps<"/rooms/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const [listing, user] = await Promise.all([getListingDetail(id), getCurrentUser()]);
  if (!listing) notFound();
  const [booked, saved] = await Promise.all([getBookedRanges(listing.id), getWishlistIds(user?.id)]);

  const guests = normaliseGuests({ adults: num(sp.adults), children: num(sp.children), infants: num(sp.infants), pets: num(sp.pets) });
  const policy = CANCELLATION_POLICIES[listing.cancellationPolicy];
  const hostYears = Math.max(1, new Date().getFullYear() - listing.host.createdAt.getFullYear());

  return (
    <StayProvider
      listing={{ id: listing.id, maxGuests: listing.maxGuests, allowsPets: listing.allowsPets, minNights: listing.minNights }}
      booked={booked.map((b) => ({ checkIn: toISODate(b.checkIn), checkOut: toISODate(b.checkOut) }))}
      initial={{ checkin: str(sp.checkin), checkout: str(sp.checkout), guests }}
    >
      <article className="mx-auto max-w-6xl px-4 pt-6 pb-32 md:px-6 lg:pb-8">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{listing.title}</h1>
          <Suspense>
            <WishlistButton listingId={listing.id} title={listing.title} saved={saved.has(listing.id)} variant="inline" />
          </Suspense>
        </div>

        <PhotoGallery images={listing.images} title={listing.title} />

        <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_380px]">
          <div className="min-w-0">
            <section>
              <h2 className="text-xl font-semibold">
                {propertyTypeLabel(listing.propertyType)} in {listing.city}, {listing.country}
              </h2>
              <p className="mt-1 text-muted-foreground">
                {listing.maxGuests} guests · {listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} bedroom${listing.bedrooms === 1 ? "" : "s"}`} ·{" "}
                {listing.beds} bed{listing.beds === 1 ? "" : "s"} · {listing.bathrooms} bath{listing.bathrooms === 1 ? "" : "s"}
              </p>
              <p className="mt-2 flex items-center gap-1 font-medium">
                {listing.reviewCount > 0 ? (
                  <>
                    <Star className="size-4 fill-current" aria-hidden />
                    {listing.avgRating.toFixed(2)} · <a href="#reviews" className="underline">{listing.reviewCount} reviews</a>
                  </>
                ) : (
                  "New listing, no reviews yet"
                )}
              </p>
            </section>

            <Separator className="my-8" />

            <section className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-full bg-foreground text-lg font-semibold text-background" aria-hidden>
                {listing.host.name.charAt(0)}
              </span>
              <div>
                <p className="font-semibold">Hosted by {listing.host.name}</p>
                <p className="text-sm text-muted-foreground">
                  {hostYears} year{hostYears === 1 ? "" : "s"} hosting
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            <ul className="space-y-6">
              {listing.avgRating >= 4.9 && listing.reviewCount >= 3 && (
                <li className="flex gap-4">
                  <Sparkles className="mt-0.5 size-6 shrink-0" aria-hidden />
                  <div>
                    <p className="font-semibold">Guest favourite</p>
                    <p className="text-sm text-muted-foreground">Among the highest-rated stays on Kipstay.</p>
                  </div>
                </li>
              )}
              <li className="flex gap-4">
                <DoorOpen className="mt-0.5 size-6 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">Self check-in after {listing.checkInTime}</p>
                  <p className="text-sm text-muted-foreground">Checkout by {listing.checkOutTime}.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <ShieldCheck className="mt-0.5 size-6 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">{policy.label} cancellation</p>
                  <p className="text-sm text-muted-foreground">
                    Free cancellation up to {policy.daysBefore} day{policy.daysBefore === 1 ? "" : "s"} before check-in.
                  </p>
                </div>
              </li>
            </ul>

            <Separator className="my-8" />

            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="sr-only">
                About this place
              </h2>
              <div className="space-y-4 whitespace-pre-line leading-relaxed">{listing.description}</div>
            </section>

            <Separator className="my-8" />

            <section aria-labelledby="amenities-heading">
              <h2 id="amenities-heading" className="text-xl font-semibold">
                What this place offers
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {listing.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-3">
                    <Check className="size-5 text-primary" aria-hidden /> {a}
                  </li>
                ))}
                {!listing.amenities.includes("Smoke alarm") && (
                  <li className="flex items-center gap-3 text-muted-foreground line-through">
                    <X className="size-5" aria-hidden /> <span>Smoke alarm</span>
                    <span className="sr-only">(not available)</span>
                  </li>
                )}
                <li className="flex items-center gap-3">
                  <PawPrint className="size-5 text-primary" aria-hidden /> {listing.allowsPets ? "Pets allowed" : "No pets"}
                </li>
              </ul>
            </section>

            <Separator className="my-8" />

            <AvailabilityCalendar city={listing.city} />

            <Separator className="my-8" />

            <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-28">
              <h2 id="reviews-heading" className="flex items-center gap-2 text-xl font-semibold">
                {listing.reviewCount > 0 ? (
                  <>
                    <Star className="size-5 fill-current" aria-hidden /> {listing.avgRating.toFixed(2)} · {listing.reviewCount} review
                    {listing.reviewCount === 1 ? "" : "s"}
                  </>
                ) : (
                  "No reviews (yet)"
                )}
              </h2>
              {listing.reviews.length > 0 && (
                <ul className="mt-6 grid gap-8 md:grid-cols-2">
                  {listing.reviews.map((r) => (
                    <li key={r.id}>
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-full bg-secondary font-semibold" aria-hidden>
                          {r.author.name.charAt(0)}
                        </span>
                        <div>
                          <p className="font-semibold">{r.author.name.split(" ")[0]}</p>
                          <p className="text-sm text-muted-foreground">
                            {r.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}
                          </p>
                        </div>
                      </div>
                      <p className="mt-2 flex gap-0.5" aria-label={`Rated ${r.rating} out of 5`}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className={i < r.rating ? "size-3 fill-current" : "size-3 text-muted-foreground"} aria-hidden />
                        ))}
                      </p>
                      <p className="mt-2 leading-relaxed">{r.comment}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <Separator className="my-8" />

            <section aria-labelledby="rules-heading">
              <h2 id="rules-heading" className="text-xl font-semibold">
                Things to know
              </h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-3">
                <div>
                  <h3 className="font-semibold">House rules</h3>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Clock className="size-4" aria-hidden /> Check-in after {listing.checkInTime}
                    </li>
                    <li>Checkout before {listing.checkOutTime}</li>
                    <li>{listing.maxGuests} guests maximum</li>
                    {listing.houseRules.split("\n").filter(Boolean).map((rule) => (
                      <li key={rule}>{rule}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold">Minimum stay</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {listing.minNights} night{listing.minNights === 1 ? "" : "s"}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Cancellation policy</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {policy.label}: free cancellation until {policy.daysBefore} day{policy.daysBefore === 1 ? "" : "s"} before check-in. Exact address shared after booking.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="hidden lg:block" aria-label="Booking">
            <div className="sticky top-28">
              <BookingWidget pricePerNight={listing.pricePerNight} rating={listing.avgRating} reviewCount={listing.reviewCount} />
            </div>
          </aside>
        </div>
      </article>
      <MobileReserveBar pricePerNight={listing.pricePerNight} />
    </StayProvider>
  );
}
