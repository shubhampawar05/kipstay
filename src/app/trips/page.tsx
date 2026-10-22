import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Luggage } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatStayRange, todayUTC } from "@/lib/dates";
import { formatMoney } from "@/lib/pricing";
import { EmptyState } from "@/components/empty-state";
import { PageSkeleton } from "@/components/skeletons";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Trips" };

export default async function TripsPage() {
  // Auth runs before streaming starts so the redirect is a real HTTP redirect.
  const user = await requireUser("/trips");
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TripsList userId={user.id} />
    </Suspense>
  );
}

async function TripsList({ userId }: { userId: string }) {
  const bookings = await prisma.booking.findMany({
    where: { guestId: userId },
    include: { listing: { select: { id: true, title: true, city: true, country: true, images: true } } },
    orderBy: { checkIn: "asc" },
  });

  const today = todayUTC();
  const upcoming = bookings.filter((b) => b.status === "CONFIRMED" && b.checkOut > today);
  const past = bookings.filter((b) => b.status === "CONFIRMED" && b.checkOut <= today).reverse();
  const cancelled = bookings.filter((b) => b.status === "CANCELLED");

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={Luggage}
        title="No trips booked… yet!"
        action={
          <Link href="/s" className={buttonVariants()}>
            Start searching
          </Link>
        }
      >
        Time to dust off your bags and start planning your next adventure.
      </EmptyState>
    );
  }

  const groups = [
    { title: "Upcoming", items: upcoming },
    { title: "Where you've been", items: past },
    { title: "Cancelled", items: cancelled },
  ].filter((g) => g.items.length);

  return (
    <div className="page-gutter py-10">
      <h1 className="text-[32px] leading-9 font-semibold">Trips</h1>
      {groups.map((g) => (
        <section key={g.title} className="mt-8" aria-labelledby={`trips-${g.title}`}>
          <h2 id={`trips-${g.title}`} className="mb-4 text-xl font-semibold">
            {g.title}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {g.items.map((b) => (
              <li key={b.id}>
                <Link href={`/trips/${b.id}`} className="flex gap-4 rounded-2xl border border-grey-400 p-3 shadow-elev-1 transition-shadow duration-200 hover:shadow-elev-2 focus-ring" data-testid="trip-card">
                  <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                    <Image src={b.listing.images[0]} alt="" fill unoptimized className="object-cover" />
                  </div>
                  <div className="min-w-0 py-1">
                    <p className="truncate font-semibold">{b.listing.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {b.listing.city}, {b.listing.country}
                    </p>
                    <p className="text-sm">{formatStayRange(b.checkIn, b.checkOut)}</p>
                    <p className="mt-1 flex items-center gap-2 text-sm">
                      {formatMoney(b.total, { cents: true })}
                      {b.status === "CANCELLED" && <Badge variant="destructive">Cancelled</Badge>}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
