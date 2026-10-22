import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { cardSelect, getWishlistIds } from "@/lib/listings";
import { CategoryBar } from "@/components/search/category-bar";
import { ListingCard } from "@/components/listings/listing-card";
import { GridSkeleton } from "@/components/skeletons";

async function HomeSections() {
  const user = await getCurrentUser();

  const topCities = await prisma.listing.groupBy({
    by: ["city", "country"],
    where: { isPublished: true },
    _count: { _all: true },
    orderBy: { _count: { city: "desc" } },
    take: 3,
  });

  const [favourites, cityRows, saved] = await Promise.all([
    prisma.listing.findMany({
      where: { isPublished: true, reviewCount: { gte: 3 } },
      select: cardSelect,
      orderBy: [{ avgRating: "desc" }, { reviewCount: "desc" }],
      take: 8,
    }),
    Promise.all(
      topCities.map((c) =>
        prisma.listing.findMany({
          where: { isPublished: true, city: c.city },
          select: cardSelect,
          orderBy: [{ avgRating: "desc" }],
          take: 4,
        }),
      ),
    ),
    getWishlistIds(user?.id),
  ]);

  return (
    <>
      {topCities.map((c, i) => (
        <section key={c.city} className="mt-12" aria-labelledby={`city-${i}`}>
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 id={`city-${i}`} className="text-2xl font-semibold tracking-tight">
              Popular homes in {c.city}
            </h2>
            <Link href={`/s?location=${encodeURIComponent(`${c.city}, ${c.country}`)}`} className="flex shrink-0 items-center text-sm font-medium hover:underline">
              Show all {c._count._all} <ChevronRight className="size-4" />
            </Link>
          </div>
          <div className="scrollbar-none -mx-4 flex snap-x gap-6 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {cityRows[i].map((l, j) => (
              <div key={l.id} className="w-[78vw] shrink-0 snap-start sm:w-auto">
                <ListingCard listing={l} saved={saved.has(l.id)} priority={i === 0 && j < 2} />
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-12" aria-labelledby="favourites">
        <h2 id="favourites" className="mb-4 text-2xl font-semibold tracking-tight">
          Guest favourites
        </h2>
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {favourites.map((l) => (
            <ListingCard key={l.id} listing={l} saved={saved.has(l.id)} />
          ))}
        </div>
      </section>
    </>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6">
      <div className="sticky top-20 z-30 -mx-4 border-b bg-background px-4 md:-mx-6 md:px-6">
        <CategoryBar />
      </div>

      <section className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-teal-900 px-6 py-12 text-primary-foreground md:px-12">
        <p className="text-sm font-medium tracking-wide text-teal-100 uppercase">Stays worth the trip</p>
        <h1 className="mt-2 max-w-xl text-3xl font-bold tracking-tight md:text-5xl">Cabins, lofts and beach houses, booked in minutes.</h1>
        <p className="mt-4 max-w-lg text-teal-50">
          Search by destination and dates, compare transparent prices, and save your favourites for later.
        </p>
        <Link
          href="/s"
          className="mt-6 inline-flex items-center gap-1 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-teal-900 hover:bg-teal-50"
        >
          Browse all stays <ChevronRight className="size-4" />
        </Link>
      </section>

      <Suspense fallback={<div className="mt-12"><GridSkeleton /></div>}>
        <HomeSections />
      </Suspense>
    </div>
  );
}
