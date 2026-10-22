import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CalendarX2, Star } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { checkStay } from "@/lib/bookings";
import { prisma } from "@/lib/db";
import { formatStayRange } from "@/lib/dates";
import { propertyTypeLabel } from "@/lib/constants";
import { bookingRequestSchema } from "@/lib/validation";
import { PriceBreakdown } from "@/components/listings/price-breakdown";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { ReserveForm } from "./reserve-form";

export const metadata: Metadata = { title: "Confirm and pay" };

export default async function BookPage({ params, searchParams }: PageProps<"/book/[id]">) {
  const { id } = await params;
  const sp = (await searchParams) as Record<string, string>;
  const user = await requireUser(`/book/${id}?${new URLSearchParams(sp)}`);

  const parsed = bookingRequestSchema.safeParse({ ...sp, listingId: id, adults: sp.adults ?? 1 });
  const check = parsed.success ? await checkStay(parsed.data, user.id) : ({ ok: false, error: "Choose valid dates and guests first." } as const);

  if (!check.ok || !parsed.success) {
    return (
      <EmptyState
        icon={CalendarX2}
        title="We can't book this stay"
        action={
          <Link href={`/rooms/${id}`} className={buttonVariants()}>
            Back to the listing
          </Link>
        }
      >
        <p role="alert">{check.ok ? "Invalid booking request." : check.error}</p>
      </EmptyState>
    );
  }

  const listing = await prisma.listing.findUniqueOrThrow({
    where: { id },
    select: { title: true, images: true, propertyType: true, city: true, avgRating: true, reviewCount: true, cancellationPolicy: true },
  });
  const req = parsed.data;
  const guestCount = req.adults + req.children;

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-10 min-[1168px]:px-0">
      <h1 className="text-[32px] leading-9 font-semibold">Confirm and pay</h1>
      <div className="mt-8 grid gap-10 md:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          <section aria-labelledby="trip-heading">
            <h2 id="trip-heading" className="text-xl font-semibold">
              Your trip
            </h2>
            <dl className="mt-4 space-y-4">
              <div className="flex justify-between gap-4">
                <div>
                  <dt className="font-medium">Dates</dt>
                  <dd className="text-muted-foreground">{formatStayRange(req.checkIn, req.checkOut)}</dd>
                </div>
                <Link href={`/rooms/${id}?${new URLSearchParams(sp)}`} className="text-sm font-semibold underline">
                  Edit
                </Link>
              </div>
              <div className="flex justify-between gap-4">
                <div>
                  <dt className="font-medium">Guests</dt>
                  <dd className="text-muted-foreground">
                    {guestCount} guest{guestCount === 1 ? "" : "s"}
                    {req.infants ? `, ${req.infants} infant${req.infants === 1 ? "" : "s"}` : ""}
                    {req.pets ? `, ${req.pets} pet${req.pets === 1 ? "" : "s"}` : ""}
                  </dd>
                </div>
              </div>
            </dl>
          </section>
          <ReserveForm request={{ ...sp, listingId: id }} total={check.quote.total} />
        </div>

        <aside className="h-fit rounded-xl border border-grey-400 p-6 shadow-elev-2 md:sticky md:top-28" aria-label="Price summary">
          <div className="flex gap-4">
            <div className="relative size-28 shrink-0 overflow-hidden rounded-xl bg-muted">
              <Image src={listing.images[0]} alt="" fill unoptimized className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{listing.title}</p>
              <p className="text-sm text-muted-foreground">
                {propertyTypeLabel(listing.propertyType)} in {listing.city}
              </p>
              {listing.reviewCount > 0 && (
                <p className="mt-1 flex items-center gap-1 text-sm">
                  <Star className="size-3.5 fill-current" aria-hidden /> {listing.avgRating.toFixed(2)} ({listing.reviewCount})
                </p>
              )}
            </div>
          </div>
          <hr className="my-6" />
          <h2 className="mb-4 text-lg font-semibold">Price details</h2>
          <PriceBreakdown quote={check.quote} />
          <p className="mt-4 text-xs text-muted-foreground">Prices were calculated on our server just now and are locked in when you confirm.</p>
        </aside>
      </div>
    </div>
  );
}
