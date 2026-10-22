import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Check, Clock, DoorOpen, KeyRound, PawPrint, ShieldCheck, Sparkles, Star, X } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getBookedRanges, getListingDetail, getWishlistIds, hostStats, ratingDistribution } from "@/lib/listings";
import { CANCELLATION_POLICIES, propertyTypeLabel } from "@/lib/constants";
import { toISODate } from "@/lib/dates";
import { normaliseGuests } from "@/lib/validation";
import { PhotoGallery } from "@/components/listings/photo-gallery";
import { StayProvider } from "@/components/listings/stay-context";
import { AvailabilityCalendar } from "@/components/listings/availability-calendar";
import { BookingWidget, MobileReserveBar } from "@/components/listings/booking-widget";
import { WishlistButton } from "@/components/listings/wishlist-button";
import { ShareButton } from "@/components/listings/share-button";
import { PdpSubnav } from "@/components/listings/pdp-subnav";
import { ReviewsSection } from "@/components/listings/reviews";
import { InfoDialog } from "@/components/listings/info-dialog";
import { LocationMap } from "@/components/listings/location-map";

export async function generateMetadata({ params }: PageProps<"/rooms/[id]">): Promise<Metadata> {
  const listing = await getListingDetail((await params).id);
  return listing ? { title: listing.title, description: listing.description.slice(0, 160) } : { title: "Listing not found" };
}

const num = (v: string | string[] | undefined) => Math.max(0, Math.min(16, Number(Array.isArray(v) ? v[0] : v) || 0));
const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
const sectionClass = "border-b border-grey-400 py-8";

export default async function ListingPage({ params, searchParams }: PageProps<"/rooms/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const [listing, user] = await Promise.all([getListingDetail(id), getCurrentUser()]);
  if (!listing) notFound();
  const [booked, saved, distribution, host] = await Promise.all([
    getBookedRanges(listing.id),
    getWishlistIds(user?.id),
    ratingDistribution(listing.id),
    hostStats(listing.host.id),
  ]);

  const guests = normaliseGuests({ adults: num(sp.adults), children: num(sp.children), infants: num(sp.infants), pets: num(sp.pets) });
  const policy = CANCELLATION_POLICIES[listing.cancellationPolicy];
  const hostYears = Math.max(1, new Date().getFullYear() - listing.host.createdAt.getFullYear());
  const favourite = listing.avgRating >= 4.9 && listing.reviewCount >= 3;
  const rules = listing.houseRules.split("\n").filter(Boolean);
  const saveButton = (
    <Suspense>
      <WishlistButton listingId={listing.id} title={listing.title} saved={saved.has(listing.id)} variant="inline" />
    </Suspense>
  );

  return (
    <StayProvider
      listing={{ id: listing.id, maxGuests: listing.maxGuests, allowsPets: listing.allowsPets, minNights: listing.minNights }}
      booked={booked.map((b) => ({ checkIn: toISODate(b.checkIn), checkOut: toISODate(b.checkOut) }))}
      initial={{ checkin: str(sp.checkin), checkout: str(sp.checkout), guests }}
    >
      <PdpSubnav pricePerNight={listing.pricePerNight} rating={listing.avgRating} reviewCount={listing.reviewCount} />
      <article className="mx-auto max-w-[1120px] px-6 pt-6 pb-32 min-[1168px]:px-0 lg:pb-12">
        <div className="mb-6 hidden items-end justify-between gap-4 md:flex">
          <h1 className="text-[26px] leading-[30px] font-medium">{listing.title}</h1>
          <div className="flex shrink-0 items-center gap-1">
            <ShareButton title={listing.title} />
            {saveButton}
          </div>
        </div>

        <PhotoGallery
          images={listing.images}
          title={listing.title}
          saveSlot={saveButton}
          mobileSaveSlot={
            <Suspense>
              <WishlistButton listingId={listing.id} title={listing.title} saved={saved.has(listing.id)} variant="circle" />
            </Suspense>
          }
        />

        <div className="mt-6 grid gap-x-[8%] lg:grid-cols-[58%_minmax(0,1fr)] md:mt-8">
          <div className="min-w-0">
            <section className={sectionClass}>
              <h1 className="mb-2 text-[26px] leading-[30px] font-medium md:hidden">{listing.title}</h1>
              <h2 className="text-[22px] leading-[26px] font-medium">
                {propertyTypeLabel(listing.propertyType)} in {listing.city}, {listing.country}
              </h2>
              <p className="mt-1 text-base">
                {listing.maxGuests} guests · {listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} bedroom${listing.bedrooms === 1 ? "" : "s"}`} ·{" "}
                {listing.beds} bed{listing.beds === 1 ? "" : "s"} · {listing.bathrooms} bath{listing.bathrooms === 1 ? "" : "s"}
              </p>
              {favourite ? (
                <a href="#reviews" className="mt-6 flex items-center gap-6 rounded-xl border border-grey-400 px-6 py-5 transition-colors hover:bg-grey-100 focus-ring">
                  <span className="flex shrink-0 items-center gap-1 text-lg leading-5 font-semibold">
                    <Sparkles className="size-5 text-brand" aria-hidden />
                    Guest
                    <br />
                    favourite
                  </span>
                  <span className="hidden flex-1 text-base font-medium sm:block">One of the most loved homes on Kipstay, according to guests</span>
                  <span className="shrink-0 text-center">
                    <span className="block text-lg leading-5 font-semibold">{listing.avgRating.toFixed(2).replace(/0$/, "")}</span>
                    <span className="flex gap-px" aria-label={`Rated ${listing.avgRating.toFixed(2)} out of 5`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className="size-2.5 fill-current" aria-hidden />
                      ))}
                    </span>
                  </span>
                  <span aria-hidden className="h-10 w-px bg-grey-400" />
                  <span className="shrink-0 text-center">
                    <span className="block text-lg leading-5 font-semibold">{listing.reviewCount}</span>
                    <span className="text-xs underline">Reviews</span>
                  </span>
                </a>
              ) : (
                <p className="mt-2 flex items-center gap-1 text-base font-semibold">
                  {listing.reviewCount > 0 ? (
                    <>
                      <Star className="size-4 fill-current" aria-hidden />
                      {listing.avgRating.toFixed(2)} ·{" "}
                      <a href="#reviews" className="underline">
                        {listing.reviewCount} reviews
                      </a>
                    </>
                  ) : (
                    "New listing · no reviews yet"
                  )}
                </p>
              )}
            </section>

            <section className={sectionClass}>
              <Link href={`/users/${listing.host.id}`} className="flex items-center gap-6 rounded-lg focus-ring">
                <span className="grid size-10 place-items-center rounded-full bg-foreground text-base font-semibold text-background" aria-hidden>
                  {listing.host.name.charAt(0)}
                </span>
                <span>
                  <span className="block text-base font-medium">Hosted by {listing.host.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {host.rating >= 4.8 && host.reviewCount >= 10 ? "Superhost · " : ""}
                    {hostYears} year{hostYears === 1 ? "" : "s"} hosting
                  </span>
                </span>
              </Link>
            </section>

            <section className={sectionClass}>
              <ul className="space-y-6">
                {favourite && (
                  <li className="flex gap-6">
                    <Sparkles className="mt-0.5 size-6 shrink-0" aria-hidden />
                    <div>
                      <p className="text-base font-medium">Top-rated stay</p>
                      <p className="text-sm text-muted-foreground">Guests rate this place among the best on Kipstay.</p>
                    </div>
                  </li>
                )}
                <li className="flex gap-6">
                  <KeyRound className="mt-0.5 size-6 shrink-0" aria-hidden />
                  <div>
                    <p className="text-base font-medium">Self check-in after {listing.checkInTime}</p>
                    <p className="text-sm text-muted-foreground">Checkout by {listing.checkOutTime}. Arrival details are shared after booking.</p>
                  </div>
                </li>
                <li className="flex gap-6">
                  <ShieldCheck className="mt-0.5 size-6 shrink-0" aria-hidden />
                  <div>
                    <p className="text-base font-medium">{policy.label} cancellation</p>
                    <p className="text-sm text-muted-foreground">
                      Free cancellation up to {policy.daysBefore} day{policy.daysBefore === 1 ? "" : "s"} before check-in.
                    </p>
                  </div>
                </li>
              </ul>
            </section>

            <section className={sectionClass} aria-labelledby="about-heading">
              <h2 id="about-heading" className="sr-only">
                About this place
              </h2>
              <p className="line-clamp-6 text-base leading-6 whitespace-pre-line">{listing.description}</p>
              <InfoDialog title="About this space" className="mt-4">
                <p className="whitespace-pre-line">{listing.description}</p>
              </InfoDialog>
            </section>

            <section id="amenities" className={`${sectionClass} scroll-mt-24 py-12`} aria-labelledby="amenities-heading">
              <h2 id="amenities-heading" className="text-[22px] leading-[26px] font-semibold">
                What this place offers
              </h2>
              <ul className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {listing.amenities.slice(0, 10).map((a) => (
                  <li key={a} className="flex items-center gap-4 text-base">
                    <Check className="size-6 shrink-0" strokeWidth={1.5} aria-hidden /> {a}
                  </li>
                ))}
                <li className="flex items-center gap-4 text-base">
                  <PawPrint className="size-6 shrink-0" strokeWidth={1.5} aria-hidden /> {listing.allowsPets ? "Pets allowed" : "No pets"}
                </li>
                {!listing.amenities.includes("Smoke alarm") && (
                  <li className="flex items-center gap-4 text-base line-through">
                    <X className="size-6 shrink-0" strokeWidth={1.5} aria-hidden /> <span>Smoke alarm</span>
                    <span className="sr-only">(not available)</span>
                  </li>
                )}
              </ul>
              {listing.amenities.length > 0 && (
                <InfoDialog title="What this place offers" trigger={`Show all ${listing.amenities.length} amenities`} variant="button" className="mt-8">
                  <ul className="divide-y divide-grey-300">
                    {listing.amenities.map((a) => (
                      <li key={a} className="flex items-center gap-4 py-5">
                        <Check className="size-6" strokeWidth={1.5} aria-hidden /> {a}
                      </li>
                    ))}
                  </ul>
                </InfoDialog>
              )}
            </section>

            <AvailabilityCalendar city={listing.city} />
          </div>

          <aside className="hidden lg:block" aria-label="Booking">
            <div className="sticky top-28 pt-8">
              <BookingWidget pricePerNight={listing.pricePerNight} cancelDaysBefore={policy.daysBefore} />
            </div>
          </aside>
        </div>

        <div className="border-t border-grey-400">
          <ReviewsSection
            listingId={listing.id}
            avgRating={listing.avgRating}
            reviewCount={listing.reviewCount}
            distribution={distribution}
            favourite={favourite}
            initial={listing.reviews.map((r) => ({
              id: r.id,
              rating: r.rating,
              comment: r.comment,
              createdAt: r.createdAt.toISOString(),
              author: r.author.name.split(" ")[0],
              memberSince: r.author.createdAt.toISOString(),
            }))}
          />
        </div>

        <section id="location" className="scroll-mt-24 border-t border-grey-400 py-12" aria-labelledby="location-heading">
          <h2 id="location-heading" className="text-[22px] leading-[26px] font-semibold">
            Where you&apos;ll be
          </h2>
          <p className="mt-6 mb-6 text-base">
            {listing.city}, {listing.region}, {listing.country}
          </p>
          {listing.latitude !== null && listing.longitude !== null ? (
            <LocationMap lat={listing.latitude} lng={listing.longitude} label={listing.title} />
          ) : (
            <div className="grid h-60 place-items-center rounded-2xl bg-grey-100 text-muted-foreground">Map unavailable for this listing</div>
          )}
          <p className="mt-4 text-sm text-muted-foreground">Exact location is provided after booking.</p>
        </section>

        <section className="border-t border-grey-400 py-12" aria-labelledby="host-heading">
          <h2 id="host-heading" className="text-[22px] leading-[26px] font-semibold">
            Meet your host
          </h2>
          <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,380px)_1fr]">
            <Link href={`/users/${listing.host.id}`} className="grid grid-cols-[1fr_auto] items-center gap-6 rounded-3xl p-6 shadow-[0_6px_20px_rgba(0,0,0,0.2)] transition-shadow hover:shadow-elev-4 focus-ring">
              <span className="text-center">
                <span className="mx-auto grid size-24 place-items-center rounded-full bg-foreground text-4xl font-semibold text-background" aria-hidden>
                  {listing.host.name.charAt(0)}
                </span>
                <span className="mt-3 block text-[28px] leading-8 font-semibold">{listing.host.name.split(" ")[0]}</span>
                <span className="text-sm font-medium">Host</span>
              </span>
              <span className="divide-y divide-grey-400 text-left">
                <span className="block pb-3">
                  <span className="block text-[22px] leading-[26px] font-semibold">{host.reviewCount}</span>
                  <span className="text-xs">Reviews</span>
                </span>
                <span className="block py-3">
                  <span className="flex items-center gap-1 text-[22px] leading-[26px] font-semibold">
                    {host.rating.toFixed(2)} <Star className="size-3.5 fill-current" aria-hidden />
                  </span>
                  <span className="text-xs">Rating</span>
                </span>
                <span className="block pt-3">
                  <span className="block text-[22px] leading-[26px] font-semibold">{hostYears}</span>
                  <span className="text-xs">Year{hostYears === 1 ? "" : "s"} hosting</span>
                </span>
              </span>
            </Link>
            <div>
              {listing.host.bio && <p className="text-base leading-6">{listing.host.bio}</p>}
              <p className="mt-6 text-base">
                {host.listings} listing{host.listings === 1 ? "" : "s"} on Kipstay
              </p>
              <Link href={`/users/${listing.host.id}`} className="mt-6 inline-block rounded-lg bg-foreground px-6 py-3 text-base font-semibold text-background transition-transform active:scale-[0.98] focus-ring">
                View host profile
              </Link>
              <p className="mt-6 flex items-start gap-3 text-xs text-muted-foreground">
                <ShieldCheck className="size-5 shrink-0" aria-hidden />
                To protect your payment, always book and pay through Kipstay.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-grey-400 py-12" aria-labelledby="rules-heading">
          <h2 id="rules-heading" className="text-[22px] leading-[26px] font-semibold">
            Things to know
          </h2>
          <div className="mt-6 grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="text-base font-semibold">House rules</h3>
              <ul className="mt-3 space-y-3 text-base">
                <li className="flex items-center gap-2">
                  <Clock className="size-4" aria-hidden /> Check-in after {listing.checkInTime}
                </li>
                <li className="flex items-center gap-2">
                  <DoorOpen className="size-4" aria-hidden /> Checkout before {listing.checkOutTime}
                </li>
                <li>{listing.maxGuests} guests maximum</li>
              </ul>
              <InfoDialog title="House rules" className="mt-4">
                <ul className="space-y-4">
                  <li>Check-in after {listing.checkInTime}</li>
                  <li>Checkout before {listing.checkOutTime}</li>
                  <li>{listing.maxGuests} guests maximum</li>
                  <li>{listing.allowsPets ? "Pets allowed" : "No pets"}</li>
                  {rules.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </InfoDialog>
            </div>
            <div>
              <h3 className="text-base font-semibold">Safety & property</h3>
              <ul className="mt-3 space-y-3 text-base">
                <li>{listing.amenities.includes("Smoke alarm") ? "Smoke alarm" : "Smoke alarm not reported"}</li>
                <li>{listing.amenities.includes("Carbon monoxide alarm") ? "Carbon monoxide alarm" : "Carbon monoxide alarm not reported"}</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base font-semibold">Cancellation policy</h3>
              <p className="mt-3 text-base">
                {policy.label}: free cancellation until {policy.daysBefore} day{policy.daysBefore === 1 ? "" : "s"} before check-in.
              </p>
              <InfoDialog title="Cancellation policy" className="mt-4">
                <p>
                  This listing uses Kipstay&apos;s <strong>{policy.label}</strong> policy: cancel up to {policy.daysBefore} day{policy.daysBefore === 1 ? "" : "s"}{" "}
                  before check-in for free. You can cancel any upcoming reservation from its page in Trips. Stays that have started can&apos;t be cancelled online.
                </p>
              </InfoDialog>
            </div>
          </div>
        </section>
      </article>
      <MobileReserveBar pricePerNight={listing.pricePerNight} />
    </StayProvider>
  );
}
