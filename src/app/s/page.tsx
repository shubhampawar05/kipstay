import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getWishlistIds, searchListings } from "@/lib/listings";
import { searchParamsSchema } from "@/lib/validation";
import { formatStayRange, toISODate } from "@/lib/dates";
import { CategoryBar } from "@/components/search/category-bar";
import { FiltersDialog, QuickFilters, SortSelect } from "@/components/search/filters";
import { Pagination } from "@/components/search/pagination";
import { ListingCard, ListingGrid } from "@/components/listings/listing-card";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata({ searchParams }: PageProps<"/s">): Promise<Metadata> {
  const location = (await searchParams).location;
  return { title: typeof location === "string" && location ? `Stays in ${location}` : "Search stays" };
}

export default async function SearchPage({ searchParams }: PageProps<"/s">) {
  const raw = (await searchParams) as Record<string, string | string[]>;
  const filters = searchParamsSchema.parse(raw);
  const user = await getCurrentUser();
  const [{ total, listings, pageCount }, saved] = await Promise.all([searchListings(filters), getWishlistIds(user?.id)]);

  // Carry the stay forward to detail pages so dates and guests stay pre-filled.
  const stayQuery = new URLSearchParams();
  if (filters.checkin && filters.checkout) {
    stayQuery.set("checkin", toISODate(filters.checkin));
    stayQuery.set("checkout", toISODate(filters.checkout));
  }
  for (const k of ["adults", "children", "infants", "pets"] as const) if (filters[k]) stayQuery.set(k, String(filters[k]));

  const place = filters.location ?? "all destinations";
  const when = filters.checkin && filters.checkout ? ` · ${formatStayRange(filters.checkin, filters.checkout)}` : "";

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6">
      <div className="sticky top-20 z-30 -mx-4 border-b bg-background px-4 md:-mx-6 md:px-6">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <CategoryBar active={filters.category} params={raw} />
          </div>
          <FiltersDialog />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="results-heading">
            {total === 0 ? "No stays found" : `${total} stay${total === 1 ? "" : "s"}`} in {place}
            <span className="text-muted-foreground">{when}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filters.checkin ? "Totals include cleaning, service fees and taxes." : "Add dates to see total prices."}
          </p>
        </div>
        <SortSelect value={filters.sort} />
      </div>

      <div className="mt-4">
        <QuickFilters />
      </div>

      <div className="mt-8">
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
          <ListingGrid>
            {listings.map((l, i) => (
              <ListingCard
                key={l.id}
                listing={l}
                saved={saved.has(l.id)}
                priority={i < 4}
                stay={{ checkin: filters.checkin, checkout: filters.checkout, query: stayQuery.toString() }}
              />
            ))}
          </ListingGrid>
        )}
      </div>

      <div className="mt-12">
        <Pagination page={filters.page} pageCount={pageCount} params={raw} />
      </div>
    </div>
  );
}
