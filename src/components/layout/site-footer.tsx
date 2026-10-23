import Link from "next/link";
import { prisma } from "@/lib/db";
import { CATEGORIES, PROPERTY_TYPES } from "@/lib/constants";
import { InspirationTabs, type InspirationTab } from "./inspiration-tabs";

const COLUMNS = [
  {
    title: "Support",
    links: [
      ["Help Centre", "/help"],
      ["How prices work", "/help#pricing"],
      ["Cancellation options", "/help#cancellations"],
      ["Report a concern", "/help#report"],
    ],
  },
  {
    title: "Hosting",
    links: [
      ["Host your place", "/host"],
      ["Create a listing", "/host/listings/new"],
      ["Hosting standards", "/help#hosting"],
    ],
  },
  {
    title: "Kipstay",
    links: [
      ["About Kipstay", "/help#about"],
      ["Explore all stays", "/s"],
      ["Wishlists", "/wishlists"],
      ["Trips", "/trips"],
    ],
  },
] as const;

async function inspiration(): Promise<InspirationTab[]> {
  const rows = await prisma.listing.groupBy({
    by: ["city", "country", "category", "propertyType"],
    where: { isPublished: true },
    _count: { _all: true },
  });
  const typeLabel = (t: string) => PROPERTY_TYPES.find((p) => p.value === t)?.label ?? t;
  const cityLink = (city: string, country: string, extra = "") => `/s?location=${encodeURIComponent(`${city}, ${country}`)}${extra}`;

  const byCity = new Map<string, { city: string; country: string; count: number; types: Map<string, number> }>();
  for (const r of rows) {
    const key = `${r.city}|${r.country}`;
    const entry = byCity.get(key) ?? { city: r.city, country: r.country, count: 0, types: new Map() };
    entry.count += r._count._all;
    entry.types.set(r.propertyType, (entry.types.get(r.propertyType) ?? 0) + r._count._all);
    byCity.set(key, entry);
  }
  const popular = [...byCity.values()].sort((a, b) => b.count - a.count);
  const tabs: InspirationTab[] = [
    {
      label: "Popular",
      links: popular.flatMap((c) =>
        [...c.types.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([type]) => ({ label: c.city, sublabel: `${typeLabel(type)} rentals`, href: cityLink(c.city, c.country, `&type=${type}`) })),
      ),
    },
  ];
  for (const cat of CATEGORIES) {
    const cities = new Map<string, { city: string; country: string }>();
    for (const r of rows) if (r.category === cat.value) cities.set(`${r.city}|${r.country}`, { city: r.city, country: r.country });
    if (cities.size)
      tabs.push({
        label: cat.label,
        links: [...cities.values()].map((c) => ({ label: c.city, sublabel: c.country, href: `${cityLink(c.city, c.country)}&category=${cat.value}` })),
      });
  }
  return tabs;
}

export async function SiteFooter() {
  const tabs = await inspiration();
  return (
    <footer className="mt-16 bg-grey-100 pb-20 md:pb-0">
      <InspirationTabs tabs={tabs} />
      <div className="page-gutter">
        <div className="grid gap-8 border-t border-grey-400 py-12 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="mb-3 text-sm font-semibold">{col.title}</h2>
              <ul className="space-y-3 text-sm">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="rounded-sm hover:underline focus-ring">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-grey-400 py-6 text-sm">
          <p>
            © {new Date().getFullYear()} Kipstay (demo) · <Link href="/help#about" className="hover:underline">About</Link> ·{" "}
            <Link href="/help#pricing" className="hover:underline">
              Pricing
            </Link>{" "}
            ·{" "}
            <Link href="/credits" className="hover:underline">
              Photo credits
            </Link>
          </p>
          <p className="font-medium">English (US) · $ USD · Payments are simulated</p>
        </div>
      </div>
    </footer>
  );
}
