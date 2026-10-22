import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { availableFor, cardSelect, getWishlistIds } from "@/lib/listings";
import { CATEGORIES } from "@/lib/constants";
import { addDays, toISODate, todayUTC } from "@/lib/dates";
import { CategoryBar } from "@/components/search/category-bar";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingRow } from "@/components/listings/listing-row";
import { Skeleton } from "@/components/ui/skeleton";

const ROW_SIZE = 10;

/** The coming Friday → Sunday (the reference's "Available … this weekend" row). */
function nextWeekend() {
  const today = todayUTC();
  const friday = addDays(today, (5 - today.getUTCDay() + 7) % 7 || 7);
  return { checkin: friday, checkout: addDays(friday, 2) };
}

async function HomeRows() {
  const user = await getCurrentUser();
  const weekend = nextWeekend();

  const topCities = await prisma.listing.groupBy({
    by: ["city", "country"],
    where: { isPublished: true },
    _count: { _all: true },
    orderBy: { _count: { city: "desc" } },
    take: 4,
  });
  const weekendCity = topCities[0];

  const [favourites, weekendRow, cityRows, categoryRows, saved] = await Promise.all([
    prisma.listing.findMany({
      where: { isPublished: true, reviewCount: { gte: 3 }, avgRating: { gte: 4.9 } },
      select: cardSelect,
      orderBy: [{ avgRating: "desc" }, { reviewCount: "desc" }],
      take: ROW_SIZE,
    }),
    weekendCity
      ? prisma.listing.findMany({
          where: {
            isPublished: true,
            city: weekendCity.city,
            minNights: { lte: 2 },
            ...availableFor(weekend.checkin, weekend.checkout),
          },
          select: cardSelect,
          orderBy: [{ avgRating: "desc" }],
          take: ROW_SIZE,
        })
      : Promise.resolve([]),
    Promise.all(
      topCities
        .slice(1)
        .map((c) =>
          prisma.listing.findMany({ where: { isPublished: true, city: c.city }, select: cardSelect, orderBy: [{ avgRating: "desc" }], take: ROW_SIZE }),
        ),
    ),
    Promise.all(
      CATEGORIES.slice(0, 4).map((c) =>
        prisma.listing.findMany({ where: { isPublished: true, category: c.value }, select: cardSelect, orderBy: [{ reviewCount: "desc" }], take: ROW_SIZE }),
      ),
    ),
    getWishlistIds(user?.id),
  ]);

  const weekendQuery = `checkin=${toISODate(weekend.checkin)}&checkout=${toISODate(weekend.checkout)}`;

  return (
    <>
      {favourites.length > 0 && (
        <ListingRow title="Guest favourites" subtitle="The highest-rated stays on Kipstay" href="/s?sort=rating">
          {favourites.map((l, i) => (
            <ListingCard key={l.id} listing={l} saved={saved.has(l.id)} variant="compact" priority={i < 4} />
          ))}
        </ListingRow>
      )}

      {weekendCity && weekendRow.length > 0 && (
        <ListingRow
          title={`Available in ${weekendCity.city} this weekend`}
          href={`/s?location=${encodeURIComponent(`${weekendCity.city}, ${weekendCity.country}`)}&${weekendQuery}`}
        >
          {weekendRow.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              saved={saved.has(l.id)}
              variant="compact"
              stay={{ checkin: weekend.checkin, checkout: weekend.checkout, query: weekendQuery }}
            />
          ))}
        </ListingRow>
      )}

      {topCities.slice(1).map((c, i) => (
        <ListingRow key={c.city} title={`Popular homes in ${c.city}`} subtitle={c.country} href={`/s?location=${encodeURIComponent(`${c.city}, ${c.country}`)}`}>
          {cityRows[i].map((l) => (
            <ListingCard key={l.id} listing={l} saved={saved.has(l.id)} variant="compact" />
          ))}
        </ListingRow>
      ))}

      {CATEGORIES.slice(0, 4).map((c, i) =>
        categoryRows[i].length > 0 ? (
          <ListingRow key={c.value} title={`${c.label} stays`} href={`/s?category=${c.value}`}>
            {categoryRows[i].map((l) => (
              <ListingCard key={l.id} listing={l} saved={saved.has(l.id)} variant="compact" />
            ))}
          </ListingRow>
        ) : null,
      )}
    </>
  );
}

function RowsSkeleton() {
  return (
    <div role="status" aria-label="Loading stays" className="mt-8">
      {[0, 1].map((row) => (
        <div key={row} className="mt-10">
          <Skeleton className="h-6 w-64" />
          <div className="mt-4 grid grid-cols-2 gap-3 min-[744px]:grid-cols-4 min-[1128px]:grid-cols-5 min-[1280px]:grid-cols-6 min-[1440px]:grid-cols-7">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className={i > 1 ? "hidden min-[744px]:block" : undefined}>
                <Skeleton index={i} className="aspect-[20/19] rounded-[20px]" />
                <Skeleton index={i} className="mt-2 h-3.5 w-3/4" />
                <Skeleton index={i} className="mt-1.5 h-3.5 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="page-gutter pb-8">
      <div className="border-b border-grey-300">
        <CategoryBar />
      </div>
      <Suspense fallback={<RowsSkeleton />}>
        <HomeRows />
      </Suspense>
    </div>
  );
}
