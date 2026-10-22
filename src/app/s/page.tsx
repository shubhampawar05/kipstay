import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeDollarSign, SearchX } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getWishlistIds, priceDistribution, searchListings } from "@/lib/listings";
import { searchParamsSchema } from "@/lib/validation";
import { formatStayRange, toISODate } from "@/lib/dates";
import { calculateQuote, formatMoney } from "@/lib/pricing";
import { propertyTypeLabel } from "@/lib/constants";
import { ResultsFilterBar, SortSelect } from "@/components/search/filters";
import { Pagination } from "@/components/search/pagination";
import { HoverTarget, ResultsLayout } from "@/components/search/results-layout";
import { ListingCard } from "@/components/listings/listing-card";
import { EmptyState } from "@/components/empty-state";
import { Reveal } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata({ searchParams }: PageProps<"/s">): Promise<Metadata> {
  const location = (await searchParams).location;
  return { title: typeof location === "string" && location ? `Stays in ${location}` : "Search stays" };
}

export default async function SearchPage({ searchParams }: PageProps<"/s">) {
  const raw = (await searchParams) as Record<string, string | string[]>;
  const filters = searchParamsSchema.parse(raw);
  const user = await getCurrentUser();
  const [{ total, listings, pageCount }, saved, prices] = await Promise.all([
    searchListings(filters),
    getWishlistIds(user?.id),
    priceDistribution(filters),
  ]);

  // A stale or hand-edited ?page= past the end goes to the last real page instead of an empty one.
  if (total > 0 && filters.page > pageCount) {
    const last = new URLSearchParams();
    for (const [k, v] of Object.entries(raw)) if (k !== "page") for (const item of [v].flat()) last.append(k, item);
    if (pageCount > 1) last.set("page", String(pageCount));
    redirect(`/s${last.size ? `?${last}` : ""}`);
  }

  // Carry the stay forward to detail pages so dates and guests stay pre-filled.
  const stayQuery = new URLSearchParams();
  if (filters.checkin && filters.checkout) {
    stayQuery.set("checkin", toISODate(filters.checkin));
    stayQuery.set("checkout", toISODate(filters.checkout));
  }
  for (const k of ["adults", "children", "infants", "pets"] as const) if (filters[k]) stayQuery.set(k, String(filters[k]));
  const query = stayQuery.toString();

  const place = filters.bbox ? "the map area" : (filters.location ?? "all destinations");
  const when = filters.checkin && filters.checkout ? ` · ${formatStayRange(filters.checkin, filters.checkout)}` : "";

  const mapListings = listings
    .filter((l) => l.latitude !== null && l.longitude !== null)
    .map((l) => {
      const quote = filters.checkin && filters.checkout ? calculateQuote(l, filters.checkin, filters.checkout) : null;
      return {
        id: l.id,
        title: l.title,
        subtitle: `${propertyTypeLabel(l.propertyType)} in ${l.city}`,
        lat: l.latitude!,
        lng: l.longitude!,
        price: formatMoney(quote ? quote.total : l.pricePerNight),
        image: l.images[0] ?? "/images/listings/city-1.svg",
        href: `/rooms/${l.id}${query ? `?${query}` : ""}`,
      };
    });

  const list = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-6">
        <h1 className="text-lg leading-6 font-semibold" data-testid="results-heading">
          {total === 0 ? "No stays found" : `${total} stay${total === 1 ? "" : "s"}`} in {place}
          <span className="font-normal text-muted-foreground">{when}</span>
        </h1>
        <div className="flex items-center gap-4">
          <p className="hidden items-center gap-1.5 text-sm font-medium sm:flex">
            <BadgeDollarSign className="size-4 text-brand" aria-hidden />
            {filters.checkin ? "Prices include all fees" : "Add dates for total prices"}
          </p>
          <SortSelect value={filters.sort} />
        </div>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No exact matches"
          action={
            <Link href="/s" className={buttonVariants({ variant: "outline" })}>
              Clear search and filters
            </Link>
          }
        >
          Try changing your dates, removing some filters, or searching a wider area.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 min-[1128px]:grid-cols-2 min-[1640px]:grid-cols-3">
          {listings.map((l, i) => (
            <HoverTarget key={l.id} id={l.id}>
              <Reveal index={i % 3}>
                <ListingCard listing={l} saved={saved.has(l.id)} priority={i < 4} stay={{ checkin: filters.checkin, checkout: filters.checkout, query }} />
              </Reveal>
            </HoverTarget>
          ))}
        </div>
      )}

      <div className="mt-12 mb-8">
        <Pagination page={filters.page} pageCount={pageCount} params={raw} />
      </div>
    </>
  );

  return (
    <div className="page-gutter">
      <ResultsFilterBar prices={prices} total={total} />
      <ResultsLayout list={list} mapListings={mapListings} mapArea={!!filters.bbox} />
    </div>
  );
}
