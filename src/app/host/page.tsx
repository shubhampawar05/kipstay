import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Home, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatStayRange, todayUTC } from "@/lib/dates";
import { formatMoney } from "@/lib/pricing";
import { EmptyState } from "@/components/empty-state";
import { PageSkeleton } from "@/components/skeletons";
import type { CurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ListingRowActions } from "./listing-row-actions";
import { CancelButton } from "@/app/trips/[id]/cancel-button";

export const metadata: Metadata = { title: "Host dashboard" };

export default async function HostPage({ searchParams }: PageProps<"/host">) {
  const user = await requireUser("/host");
  const sp = await searchParams;
  return (
    <Suspense fallback={<PageSkeleton />}>
      <HostDashboard user={user} notice={sp.created ? "Your listing was created." : sp.updated ? "Your changes were saved." : null} />
    </Suspense>
  );
}

async function HostDashboard({ user, notice }: { user: CurrentUser; notice: string | null }) {
  const today = todayUTC();

  const [listings, reservations] = await Promise.all([
    prisma.listing.findMany({
      where: { hostId: user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { bookings: { where: { status: "CONFIRMED", checkOut: { gt: today } } } } } },
    }),
    prisma.booking.findMany({
      where: { listing: { hostId: user.id }, checkOut: { gt: today } },
      include: { listing: { select: { title: true } }, guest: { select: { name: true } } },
      orderBy: { checkIn: "asc" },
      take: 50,
    }),
  ]);

  if (listings.length === 0) {
    return (
      <EmptyState
        icon={Home}
        title="Host your place on Kipstay"
        action={
          <Link href="/host/listings/new" className={buttonVariants({ size: "lg" })}>
            <Plus /> Create your first listing
          </Link>
        }
      >
        Share your space, set your own price and rules, and manage reservations from one dashboard.
      </EmptyState>
    );
  }

  const confirmed = reservations.filter((r) => r.status === "CONFIRMED");
  const upcomingRevenue = confirmed.reduce((sum, r) => sum + r.subtotal - r.discount + r.cleaningFee, 0);

  return (
    <div className="page-gutter py-10">
      {notice && (
        <p role="status" className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {notice}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] leading-9 font-semibold">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="text-muted-foreground">Manage your listings and upcoming reservations.</p>
        </div>
        <Link href="/host/listings/new" className={buttonVariants()}>
          <Plus /> New listing
        </Link>
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Listings", String(listings.length), `${listings.filter((l) => l.isPublished).length} published`],
          ["Upcoming reservations", String(confirmed.length), "Confirmed stays not yet finished"],
          ["Upcoming earnings", formatMoney(upcomingRevenue), "Nightly totals + cleaning, before payout"],
        ].map(([label, value, hint]) => (
          <div key={label} className="rounded-2xl border border-grey-400 p-5 shadow-elev-1">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-3xl font-semibold">{value}</dd>
            <dd className="mt-1 text-xs text-muted-foreground">{hint}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-10" aria-labelledby="reservations-heading">
        <h2 id="reservations-heading" className="mb-4 text-xl font-semibold">
          Upcoming reservations
        </h2>
        {reservations.length === 0 ? (
          <p className="rounded-2xl border p-6 text-muted-foreground">No upcoming reservations yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3">Guest</th>
                  <th className="px-4 py-3">Listing</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Guests</th>
                  <th className="px-4 py-3">Payout base</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reservations.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-medium">{r.guest.name}</td>
                    <td className="max-w-48 truncate px-4 py-3">{r.listing.title}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatStayRange(r.checkIn, r.checkOut)}</td>
                    <td className="px-4 py-3">{r.adults + r.children}</td>
                    <td className="px-4 py-3">{formatMoney(r.subtotal - r.discount + r.cleaningFee)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={r.status === "CANCELLED" ? "destructive" : "secondary"}>{r.status === "CANCELLED" ? "Cancelled" : "Confirmed"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "CONFIRMED" && r.checkIn > today && <CancelButton bookingId={r.id} label="Cancel" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10" aria-labelledby="listings-heading">
        <h2 id="listings-heading" className="mb-4 text-xl font-semibold">
          Your listings
        </h2>
        <ul className="divide-y rounded-2xl border">
          {listings.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-4 p-4" data-testid="host-listing-row">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                <Image src={l.images[0]} alt="" fill unoptimized className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{l.title}</p>
                <p className="text-sm text-muted-foreground">
                  {l.city}, {l.country} · {formatMoney(l.pricePerNight)} night · {l._count.bookings} upcoming
                </p>
                <Badge variant={l.isPublished ? "secondary" : "outline"} className="mt-1">
                  {l.isPublished ? "Published" : "Unpublished"}
                </Badge>
              </div>
              <ListingRowActions id={l.id} isPublished={l.isPublished} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
