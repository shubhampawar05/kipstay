import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { propertyTypeLabel } from "@/lib/constants";

const search = (location: string, extra = "") => `/s?location=${encodeURIComponent(location)}${extra}`;

/**
 * Reference "Explore other options in and around {city}": links to nearby destinations (same country, by number of
 * stays) and to other stay types in this city, plus a Kipstay › country › region › city trail. Only real searches.
 */
export async function NearbyLinks({ city, region, country }: { city: string; region: string; country: string }) {
  const [cities, types] = await Promise.all([
    prisma.listing.groupBy({
      by: ["city", "country"],
      where: { isPublished: true, country, city: { not: city } },
      _count: { _all: true },
      orderBy: { _count: { city: "desc" } },
      take: 9,
    }),
    prisma.listing.groupBy({
      by: ["propertyType"],
      where: { isPublished: true, city, country },
      _count: { _all: true },
      orderBy: { _count: { propertyType: "desc" } },
    }),
  ]);
  const links = [
    ...types.map((t) => ({
      label: `${propertyTypeLabel(t.propertyType)} rentals in ${city}`,
      href: search(`${city}, ${country}`, `&type=${t.propertyType}`),
    })),
    ...cities.map((c) => ({ label: `${c.city} holiday rentals`, href: search(`${c.city}, ${c.country}`) })),
    { label: `Stays across ${country}`, href: search(country) },
  ];

  return (
    <section aria-labelledby="nearby-heading" className="border-t border-grey-400 py-12">
      <h2 id="nearby-heading" className="text-[22px] leading-[26px] font-semibold">
        Explore other options in and around {city}
      </h2>
      <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="rounded-sm text-base font-medium hover:underline focus-ring">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      <nav aria-label="Breadcrumb" className="mt-10">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {[
            { label: "Kipstay", href: "/" },
            { label: country, href: search(country) },
            { label: region, href: search(`${region}, ${country}`) },
            { label: city, href: search(`${city}, ${country}`) },
          ].map((crumb, i, all) => (
            <li key={crumb.label + i} className="flex items-center gap-1">
              {i < all.length - 1 ? (
                <>
                  <Link href={crumb.href} className="rounded-sm hover:underline focus-ring">
                    {crumb.label}
                  </Link>
                  <ChevronRight className="size-3" aria-hidden />
                </>
              ) : (
                <span aria-current="page" className="text-foreground">
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </section>
  );
}
