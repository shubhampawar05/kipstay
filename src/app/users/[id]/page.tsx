import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { cardSelect, getWishlistIds, hostStats } from "@/lib/listings";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingRow } from "@/components/listings/listing-row";

export async function generateMetadata({ params }: PageProps<"/users/[id]">): Promise<Metadata> {
  const host = await prisma.user.findUnique({ where: { id: (await params).id }, select: { name: true } });
  return { title: host ? `${host.name.split(" ")[0]}'s profile` : "Profile not found" };
}

/** Public host profile (reference "Go to host full profile"): only users with published listings have one. */
export default async function HostProfilePage({ params }: PageProps<"/users/[id]">) {
  const { id } = await params;
  const host = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, bio: true, createdAt: true } });
  if (!host) notFound();
  const [stats, listings, reviews, viewer] = await Promise.all([
    hostStats(host.id),
    prisma.listing.findMany({ where: { hostId: host.id, isPublished: true }, select: cardSelect, orderBy: [{ avgRating: "desc" }] }),
    prisma.review.findMany({
      where: { listing: { hostId: host.id, isPublished: true } },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, comment: true, rating: true, createdAt: true, author: { select: { name: true } }, listing: { select: { title: true } } },
    }),
    getCurrentUser(),
  ]);
  if (listings.length === 0) notFound();
  const saved = await getWishlistIds(viewer?.id);
  const first = host.name.split(" ")[0];
  const years = Math.max(1, new Date().getFullYear() - host.createdAt.getFullYear());

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-10 min-[1168px]:px-0">
      <div className="grid gap-12 md:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="md:sticky md:top-28 md:self-start">
          <div className="grid grid-cols-[1fr_auto] items-center gap-6 rounded-3xl p-6 shadow-[0_6px_20px_rgba(0,0,0,0.2)]">
            <div className="text-center">
              <span className="mx-auto grid size-28 place-items-center rounded-full bg-foreground text-5xl font-semibold text-background" aria-hidden>
                {first.charAt(0)}
              </span>
              <h1 className="mt-3 text-[32px] leading-9 font-semibold">{first}</h1>
              <p className="text-sm font-medium">Host</p>
            </div>
            <dl className="divide-y divide-grey-400">
              <div className="pb-3">
                <dt className="sr-only">Reviews</dt>
                <dd className="text-[22px] leading-[26px] font-semibold">{stats.reviewCount}</dd>
                <dd className="text-xs">Reviews</dd>
              </div>
              <div className="py-3">
                <dt className="sr-only">Rating</dt>
                <dd className="flex items-center gap-1 text-[22px] leading-[26px] font-semibold">
                  {stats.rating.toFixed(2)} <Star className="size-3.5 fill-current" aria-hidden />
                </dd>
                <dd className="text-xs">Rating</dd>
              </div>
              <div className="pt-3">
                <dt className="sr-only">Years hosting</dt>
                <dd className="text-[22px] leading-[26px] font-semibold">{years}</dd>
                <dd className="text-xs">Year{years === 1 ? "" : "s"} hosting</dd>
              </div>
            </dl>
          </div>
        </aside>

        <div className="min-w-0">
          <h2 className="text-[32px] leading-9 font-semibold">About {first}</h2>
          <p className="mt-4 text-base leading-6">{host.bio || `${first} hasn't written a bio yet.`}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            On Kipstay since {host.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}
          </p>

          <div className="mt-6 border-t border-grey-400 pt-2">
            <ListingRow title={`${first}'s listings`} subtitle={`${listings.length} stay${listings.length === 1 ? "" : "s"}`}>
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} saved={saved.has(l.id)} variant="compact" />
              ))}
            </ListingRow>
          </div>

          {reviews.length > 0 && (
            <section className="mt-12 border-t border-grey-400 pt-10" aria-labelledby="host-reviews">
              <h2 id="host-reviews" className="text-[22px] leading-[26px] font-semibold">
                What guests are saying about {first}
              </h2>
              <ul className="mt-6 grid gap-6 sm:grid-cols-2">
                {reviews.map((r) => (
                  <li key={r.id} className="rounded-2xl border border-grey-400 p-6">
                    <p className="flex gap-px" aria-label={`Rated ${r.rating} out of 5`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={i < r.rating ? "size-3 fill-current" : "size-3 text-grey-500"} aria-hidden />
                      ))}
                    </p>
                    <p className="mt-3 line-clamp-4 text-base leading-6">&ldquo;{r.comment}&rdquo;</p>
                    <p className="mt-4 text-sm font-semibold">{r.author.name.split(" ")[0]}</p>
                    <p className="text-sm text-muted-foreground">
                      {r.listing.title} · {r.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
