import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatStayDate, todayUTC } from "@/lib/dates";
import { CANCELLATION_POLICIES } from "@/lib/constants";
import { PriceBreakdown } from "@/components/listings/price-breakdown";
import { Badge } from "@/components/ui/badge";
import { CancelButton } from "./cancel-button";
import { ReviewForm } from "./review-form";

export const metadata: Metadata = { title: "Reservation" };

export default async function TripPage({ params, searchParams }: PageProps<"/trips/[id]">) {
  const { id } = await params;
  const { confirmed } = await searchParams;
  const user = await requireUser(`/trips/${id}`);

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { listing: { include: { host: { select: { name: true } } } }, review: true },
  });
  // Only the guest can open their reservation; anyone else gets a plain 404.
  if (!booking || booking.guestId !== user.id) notFound();

  const today = todayUTC();
  const canCancel = booking.status === "CONFIRMED" && booking.checkIn > today;
  const canReview = booking.status === "CONFIRMED" && booking.checkOut <= today && !booking.review;
  const policy = CANCELLATION_POLICIES[booking.listing.cancellationPolicy];
  const guests = booking.adults + booking.children;

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-10 min-[1168px]:px-0">
      {confirmed && booking.status === "CONFIRMED" && (
        <div role="status" className="mb-6 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-900">
          <CheckCircle2 className="size-6 shrink-0" />
          <div>
            <p className="font-semibold">Your reservation is confirmed</p>
            <p className="text-sm">Mock payment reference {booking.paymentRef}. No money was charged.</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[32px] leading-9 font-semibold">{booking.listing.title}</h1>
        <Badge variant={booking.status === "CANCELLED" ? "destructive" : "secondary"}>
          {booking.status === "CANCELLED" ? "Cancelled" : booking.checkOut <= today ? "Completed" : "Confirmed"}
        </Badge>
      </div>
      <p className="mt-1 text-muted-foreground">
        {booking.listing.city}, {booking.listing.country} · Hosted by {booking.listing.host.name}
      </p>

      <div className="relative mt-6 aspect-[16/7] overflow-hidden rounded-2xl bg-muted">
        <Image src={booking.listing.images[0]} alt="" fill unoptimized className="object-cover" />
      </div>

      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <section aria-labelledby="details-heading">
          <h2 id="details-heading" className="text-xl font-semibold">
            Reservation details
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-medium">Check-in</dt>
              <dd className="text-muted-foreground">
                {formatStayDate(booking.checkIn, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                <br />
                After {booking.listing.checkInTime}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Checkout</dt>
              <dd className="text-muted-foreground">
                {formatStayDate(booking.checkOut, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                <br />
                Before {booking.listing.checkOutTime}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Guests</dt>
              <dd className="text-muted-foreground">
                {guests} guest{guests === 1 ? "" : "s"}
                {booking.infants ? `, ${booking.infants} infant${booking.infants === 1 ? "" : "s"}` : ""}
                {booking.pets ? `, ${booking.pets} pet${booking.pets === 1 ? "" : "s"}` : ""}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Confirmation code</dt>
              <dd className="font-mono text-muted-foreground">{booking.id.slice(-8).toUpperCase()}</dd>
            </div>
          </dl>
          <p className="mt-6 text-sm text-muted-foreground">
            {policy.label} cancellation policy: free cancellation until {policy.daysBefore} day{policy.daysBefore === 1 ? "" : "s"} before check-in.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {booking.listing.isPublished ? (
              <Link href={`/rooms/${booking.listingId}`} className="rounded-sm text-sm font-semibold underline focus-ring">
                View listing
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">The host has unpublished this listing.</p>
            )}
          </div>
          {canCancel && (
            <div className="mt-6">
              <CancelButton bookingId={booking.id} />
            </div>
          )}
        </section>

        <section aria-labelledby="payment-heading">
          <h2 id="payment-heading" className="mb-4 text-xl font-semibold">
            Payment summary
          </h2>
          <PriceBreakdown
            quote={{
              nights: booking.nights,
              nightlyPrice: booking.nightlyPrice,
              subtotal: booking.subtotal,
              discount: booking.discount,
              cleaningFee: booking.cleaningFee,
              serviceFee: booking.serviceFee,
              taxes: booking.taxes,
              total: booking.total,
              currency: "USD",
            }}
          />
          <p className="mt-3 text-xs text-muted-foreground">Paid with the development mock provider ({booking.paymentRef}).</p>
        </section>
      </div>

      {canReview && (
        <section className="mt-10 rounded-2xl border p-6" aria-labelledby="review-heading">
          <h2 id="review-heading" className="text-xl font-semibold">
            How was your stay?
          </h2>
          <ReviewForm bookingId={booking.id} />
        </section>
      )}
      {booking.review && (
        <section className="mt-10 rounded-2xl border p-6">
          <h2 className="text-xl font-semibold">Your review</h2>
          <p className="mt-2">{"★".repeat(booking.review.rating)}</p>
          <p className="mt-1 text-muted-foreground">{booking.review.comment}</p>
        </section>
      )}
    </div>
  );
}
