import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { PAGE_SIZE, REVIEW_CATEGORIES, type ReviewCategory } from "./constants";
import { nightsBetween, todayUTC } from "./dates";
import type { SearchFilters } from "./validation";

export const cardSelect = {
  id: true,
  title: true,
  city: true,
  region: true,
  country: true,
  propertyType: true,
  bedrooms: true,
  beds: true,
  bathrooms: true,
  pricePerNight: true,
  cleaningFee: true,
  images: true,
  avgRating: true,
  reviewCount: true,
  cancellationPolicy: true,
  latitude: true,
  longitude: true,
  createdAt: true,
} satisfies Prisma.ListingSelect;

export type ListingCardData = Prisma.ListingGetPayload<{ select: typeof cardSelect }>;

/** Bookings that occupy at least one night of [checkIn, checkOut). */
export function overlappingBookings(checkIn: Date, checkOut: Date): Prisma.BookingWhereInput {
  return { status: { not: "CANCELLED" }, checkIn: { lt: checkOut }, checkOut: { gt: checkIn } };
}

/** Host calendar blocks that close at least one night of [checkIn, checkOut). */
export function overlappingBlocks(checkIn: Date, checkOut: Date): Prisma.AvailabilityBlockWhereInput {
  return { startDate: { lt: checkOut }, endDate: { gt: checkIn } };
}

/** Listings free for every night of [checkIn, checkOut): no live booking and no host block. */
export function availableFor(checkIn: Date, checkOut: Date): Prisma.ListingWhereInput {
  return { bookings: { none: overlappingBookings(checkIn, checkOut) }, blocks: { none: overlappingBlocks(checkIn, checkOut) } };
}

export function buildSearchWhere(f: SearchFilters): Prisma.ListingWhereInput {
  const and: Prisma.ListingWhereInput[] = [{ isPublished: true }];

  if (f.bbox) {
    // Map search replaces the text destination, as on the reference ("Map area").
    and.push({ latitude: { gte: f.bbox.south, lte: f.bbox.north }, longitude: { gte: f.bbox.west, lte: f.bbox.east } });
  } else if (f.location) {
    // "Lisbon, Portugal" → match every comma-separated term against the place fields.
    for (const term of f.location.split(",").map((t) => t.trim()).filter(Boolean)) {
      and.push({
        OR: [
          { city: { contains: term, mode: "insensitive" } },
          { region: { contains: term, mode: "insensitive" } },
          { country: { contains: term, mode: "insensitive" } },
        ],
      });
    }
  }

  const guests = f.adults + f.children;
  if (guests > 0) and.push({ maxGuests: { gte: guests } });
  if (f.pets > 0) and.push({ allowsPets: true });
  if (f.category) and.push({ category: f.category });
  if (f.type.length) and.push({ propertyType: { in: f.type } });
  if (f.amenities.length) and.push({ amenities: { hasEvery: f.amenities } });
  if (f.bedrooms) and.push({ bedrooms: { gte: f.bedrooms } });
  if (f.minPrice !== undefined) and.push({ pricePerNight: { gte: f.minPrice * 100 } });
  if (f.maxPrice !== undefined) and.push({ pricePerNight: { lte: f.maxPrice * 100 } });

  if (f.checkin && f.checkout) {
    and.push({ minNights: { lte: nightsBetween(f.checkin, f.checkout) } });
    and.push(availableFor(f.checkin, f.checkout));
  }

  return { AND: and };
}

const ORDER: Record<SearchFilters["sort"], Prisma.ListingOrderByWithRelationInput[]> = {
  recommended: [{ avgRating: "desc" }, { reviewCount: "desc" }, { createdAt: "desc" }],
  rating: [{ avgRating: "desc" }, { reviewCount: "desc" }],
  price_asc: [{ pricePerNight: "asc" }],
  price_desc: [{ pricePerNight: "desc" }],
};

export async function searchListings(f: SearchFilters) {
  const where = buildSearchWhere(f);
  const [total, listings] = await prisma.$transaction([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      select: cardSelect,
      orderBy: [...ORDER[f.sort], { id: "asc" }],
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  return { total, listings, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getListingDetail(id: string) {
  return prisma.listing.findFirst({
    where: { id, isPublished: true },
    include: {
      host: { select: { id: true, name: true, bio: true, createdAt: true, isHost: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { author: { select: { name: true, createdAt: true } } },
      },
    },
  });
}

/** Future unavailable ranges for a listing (bookings and host blocks), as [checkIn, checkOut) pairs. */
export async function getBookedRanges(listingId: string) {
  const today = todayUTC();
  const [bookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: { listingId, status: { not: "CANCELLED" }, checkOut: { gt: today } },
      select: { checkIn: true, checkOut: true },
    }),
    prisma.availabilityBlock.findMany({ where: { listingId, endDate: { gt: today } }, select: { startDate: true, endDate: true } }),
  ]);
  return [...bookings, ...blocks.map((b) => ({ checkIn: b.startDate, checkOut: b.endDate }))].sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime());
}

export async function getWishlistIds(userId: string | undefined): Promise<Set<string>> {
  if (!userId) return new Set();
  const items = await prisma.wishlistItem.findMany({ where: { userId }, select: { listingId: true } });
  return new Set(items.map((i) => i.listingId));
}

export type Destination = { city: string; country: string; count: number };

export async function findDestinations(query: string, limit = 8): Promise<Destination[]> {
  const q = query.trim();
  const groups = await prisma.listing.groupBy({
    by: ["city", "country"],
    where: {
      isPublished: true,
      ...(q
        ? {
            OR: [
              { city: { contains: q, mode: "insensitive" } },
              { region: { contains: q, mode: "insensitive" } },
              { country: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    _count: { _all: true },
    orderBy: { _count: { city: "desc" } },
    take: limit,
  });
  return groups.map((g) => ({ city: g.city, country: g.country, count: g._count._all }));
}

/** Nightly prices (USD) of listings matching every filter except price, for the Filters histogram. */
export async function priceDistribution(f: SearchFilters): Promise<number[]> {
  const rows = await prisma.listing.findMany({
    where: buildSearchWhere({ ...f, minPrice: undefined, maxPrice: undefined }),
    select: { pricePerNight: true },
  });
  return rows.map((r) => Math.round(r.pricePerNight / 100));
}

export async function countListings(f: SearchFilters): Promise<number> {
  return prisma.listing.count({ where: buildSearchWhere(f) });
}

/** Review counts per star rating, ordered 5 → 1. */
export async function ratingDistribution(listingId: string): Promise<number[]> {
  const rows = await prisma.review.groupBy({ by: ["rating"], where: { listingId }, _count: { _all: true } });
  return [5, 4, 3, 2, 1].map((stars) => rows.find((r) => r.rating === stars)?._count._all ?? 0);
}

/** Average score per review category (null where no review has rated it yet). */
export async function categoryRatings(listingId: string) {
  const agg = await prisma.review.aggregate({
    where: { listingId },
    _avg: Object.fromEntries(REVIEW_CATEGORIES.map((c) => [c.key, true])) as Record<ReviewCategory, true>,
  });
  return REVIEW_CATEGORIES.map((c) => ({ ...c, avg: agg._avg[c.key] }));
}

/** Aggregate stats for a host across their published listings. */
export async function hostStats(hostId: string) {
  const [agg, listings] = await Promise.all([
    prisma.review.aggregate({ where: { listing: { hostId, isPublished: true } }, _avg: { rating: true }, _count: { _all: true } }),
    prisma.listing.count({ where: { hostId, isPublished: true } }),
  ]);
  return { reviewCount: agg._count._all, rating: agg._avg.rating ?? 0, listings };
}
