import Link from "next/link";
import {
  Camera,
  ChefHat,
  CookingPot,
  Dumbbell,
  Flower2,
  Landmark,
  Mountain,
  Palette,
  Scissors,
  Soup,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from "lucide-react";
import { ExperiencesIcon, ServicesIcon } from "@/components/layout/product-tabs";
import { serviceLabel } from "@/lib/constants";
import { addDays, toISODate } from "@/lib/dates";
import { searchHref } from "@/lib/search-url";
import type { ProductSearch } from "@/lib/validation";

type Product = "experiences" | "services";

const PRODUCTS: Record<
  Product,
  { title: string; label: string; icon: typeof ExperiencesIcon; pitch: string; detail: string; preview: { label: string; icon: LucideIcon }[] }
> = {
  experiences: {
    title: "Experiences",
    label: "Experiences",
    icon: ExperiencesIcon,
    pitch: "Tours, classes and activities led by local hosts.",
    detail:
      "Soon you'll be able to book things to do alongside your stay: a food walk through the old town, a pottery class or a sunrise hike, all hosted by people who know the place.",
    preview: [
      { label: "Cultural tours", icon: Landmark },
      { label: "Food tours", icon: Soup },
      { label: "Art workshops", icon: Palette },
      { label: "Cooking classes", icon: UtensilsCrossed },
      { label: "Outdoor adventures", icon: Mountain },
      { label: "Tastings", icon: Wine },
    ],
  },
  services: {
    title: "Services",
    label: "Services",
    icon: ServicesIcon,
    pitch: "Chefs, photographers and wellness, brought to your stay.",
    detail:
      "Soon you'll be able to add a service to your trip: a private chef for a birthday dinner, a photographer for the family, or a massage after a long travel day.",
    preview: [
      { label: "Private chefs", icon: ChefHat },
      { label: "Photography", icon: Camera },
      { label: "Massage", icon: Flower2 },
      { label: "Personal training", icon: Dumbbell },
      { label: "Hair and makeup", icon: Scissors },
      { label: "Prepared meals", icon: CookingPot },
    ],
  },
};

function SoonBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-[#1f2b47] px-2 py-1 text-[11px] leading-none font-bold tracking-wide text-white uppercase">
      Coming soon
    </span>
  );
}

const utcDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/**
 * Echo of a search made from the Experiences or Services search bar, with a way to the same trip's homes.
 * Returns null when the URL carries no search.
 */
function SearchEcho({ product, search }: { product: Product; search: ProductSearch }) {
  const { location, checkin, checkout, adults, children, infants, service } = search;
  const people = adults + children;
  if (!location && !checkin && !people && !service) return null;

  const what = product === "services" ? (serviceLabel(service) ?? "Services") : "Experiences";
  const dates = checkin && checkout ? (checkout.getTime() === checkin.getTime() ? utcDate.format(checkin) : `${utcDate.format(checkin)} – ${utcDate.format(checkout)}`) : null;
  const summary = [location ? `${what} in ${location}` : what, dates, people ? `${people} guest${people === 1 ? "" : "s"}` : null].filter(Boolean).join(" · ");
  // A one-day experience still needs a night's stay: check out the next morning.
  const homesHref = searchHref({
    location,
    checkin: checkin ? toISODate(checkin) : undefined,
    checkout: checkin && checkout ? toISODate(checkout > checkin ? checkout : addDays(checkin, 1)) : undefined,
    adults,
    children,
    infants,
  });

  return (
    <section aria-label="Your search" data-testid="search-echo" className="mx-auto mt-10 max-w-[640px] rounded-[20px] border border-grey-300 p-5 text-left shadow-elev-1">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Your search</p>
      <p className="mt-1 text-lg leading-6 font-semibold">{summary}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {product === "services" ? "Services aren't bookable yet" : "Experiences aren't bookable yet"}, but you can already find a place to stay
        {location ? ` in ${location}` : ""}
        {dates ? " for those dates" : ""}.
      </p>
      <Link href={homesHref} className="mt-4 inline-flex h-11 items-center rounded-lg bg-foreground px-5 text-sm font-semibold text-background transition-transform active:scale-[0.98] focus-ring">
        {location ? `See homes in ${location}` : "See homes"}
      </Link>
    </section>
  );
}

/** The Experiences and Services tabs' page until those products exist. */
export function ComingSoonPage({ product, search }: { product: Product; search?: ProductSearch }) {
  const p = PRODUCTS[product];
  const Icon = p.icon;
  return (
    <div className="page-gutter kip-fade-in pt-10 pb-16 md:pt-12">
      <section className="mx-auto flex max-w-[640px] flex-col items-center text-center">
        <Icon className="size-24 md:size-28" />
        <div className="mt-5">
          <SoonBadge />
        </div>
        <h1 className="mt-4 text-[28px] leading-8 font-semibold md:text-[32px] md:leading-9">{p.title} are coming soon</h1>
        <p className="mt-3 text-base leading-6 text-muted-foreground">{p.detail}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/homes"
            className="inline-flex h-12 items-center rounded-lg bg-brand px-6 text-base font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-brand-strong active:scale-[0.98] focus-ring"
          >
            Explore homes
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 items-center rounded-lg border border-foreground px-6 text-base font-semibold transition-[background-color,transform] duration-200 hover:bg-grey-100 active:scale-[0.98] focus-ring"
          >
            Back to all
          </Link>
        </div>
      </section>

      {search && <SearchEcho product={product} search={search} />}

      <section aria-labelledby="soon-preview" className="mx-auto mt-14 max-w-[960px]">
        <h2 id="soon-preview" className="text-xl leading-6 font-semibold">
          What you&apos;ll find here
        </h2>
        <ul className="mt-4 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-3">
          {p.preview.map(({ label, icon: ItemIcon }) => (
            <li key={label} className="flex items-center gap-3 rounded-2xl border border-grey-300 bg-grey-100 px-4 py-4 text-muted-foreground">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-background shadow-elev-1">
                <ItemIcon className="size-5 text-foreground/70" strokeWidth={1.6} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground/80">{label}</span>
                <span className="block text-xs">Not bookable yet</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Teaser at the end of the All feed linking to the two coming-soon tabs. */
export function ComingSoonTeaser() {
  return (
    <section aria-labelledby="coming-soon" className="mt-12">
      <h2 id="coming-soon" className="text-lg leading-6 font-semibold md:text-xl">
        Coming soon to Kipstay
      </h2>
      <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
        {(Object.keys(PRODUCTS) as Product[]).map((key) => {
          const p = PRODUCTS[key];
          const Icon = p.icon;
          return (
            <Link
              key={key}
              href={`/${key}`}
              className="group/soon flex items-center gap-4 rounded-[20px] border border-grey-300 p-4 transition-[box-shadow,transform] duration-300 ease-standard hover:-translate-y-0.5 hover:shadow-elev-2 focus-ring"
            >
              <Icon className="size-14 shrink-0 transition-transform duration-300 ease-standard group-hover/soon:scale-110 group-hover/soon:-rotate-3" />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold">{p.label}</span>
                  <SoonBadge />
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">{p.pitch}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
