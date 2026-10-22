import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toISODate, todayUTC } from "@/lib/dates";
import { formatMoney } from "@/lib/pricing";
import { CalendarManager } from "./calendar-manager";

export const metadata: Metadata = { title: "Calendar" };

export default async function ListingCalendarPage({ params }: PageProps<"/host/listings/[id]/calendar">) {
  const { id } = await params;
  const user = await requireUser(`/host/listings/${id}/calendar`);
  const listing = await prisma.listing.findFirst({
    where: { id, hostId: user.id },
    select: { id: true, title: true, pricePerNight: true, minNights: true },
  });
  if (!listing) notFound();

  const today = todayUTC();
  const [bookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: { listingId: id, status: "CONFIRMED", checkOut: { gt: today } },
      select: { id: true, checkIn: true, checkOut: true, adults: true, children: true, guest: { select: { name: true } } },
      orderBy: { checkIn: "asc" },
    }),
    prisma.availabilityBlock.findMany({
      where: { listingId: id, endDate: { gt: today } },
      select: { id: true, startDate: true, endDate: true, note: true },
      orderBy: { startDate: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <Link href="/host" className="mb-4 inline-flex items-center gap-1 rounded-sm text-sm font-medium underline-offset-2 hover:underline focus-ring">
        <ChevronLeft className="size-4" /> Host dashboard
      </Link>
      <h1 className="text-[32px] leading-9 font-semibold">Calendar</h1>
      <p className="mt-1 text-muted-foreground">
        {listing.title} · {formatMoney(listing.pricePerNight)} night · {listing.minNights}-night minimum
      </p>
      <CalendarManager
        listingId={listing.id}
        bookings={bookings.map((b) => ({
          id: b.id,
          checkIn: toISODate(b.checkIn),
          checkOut: toISODate(b.checkOut),
          guest: b.guest.name,
          guests: b.adults + b.children,
        }))}
        blocks={blocks.map((b) => ({ id: b.id, start: toISODate(b.startDate), end: toISODate(b.endDate), note: b.note }))}
      />
    </div>
  );
}
