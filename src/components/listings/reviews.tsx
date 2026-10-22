"use client";

import { useState } from "react";
import { CircleCheck, KeyRound, Loader2, Map as MapIcon, MessageSquare, Sparkles, SprayCan, Star, Tag, type LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type CategoryScore = { key: string; label: string; avg: number | null };

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  cleanliness: SprayCan,
  accuracy: CircleCheck,
  checkIn: KeyRound,
  communication: MessageSquare,
  location: MapIcon,
  value: Tag,
};

export type ReviewItem = { id: string; rating: number; comment: string; createdAt: string; author: string; memberSince: string };

function yearsOn(memberSince: string) {
  const years = new Date().getFullYear() - new Date(memberSince).getFullYear();
  return years >= 1 ? `${years} year${years === 1 ? "" : "s"} on Kipstay` : "New to Kipstay";
}

function monthYear(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

function Stars({ rating, size = "size-2.5" }: { rating: number; size?: string }) {
  return (
    <span className="flex gap-px" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={cn(size, i < rating ? "fill-current" : "text-grey-500")} aria-hidden />
      ))}
    </span>
  );
}

function ReviewCard({ r, clamp = true }: { r: ReviewItem; clamp?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const long = r.comment.length > 180;
  return (
    <li>
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-full bg-foreground text-lg font-semibold text-background" aria-hidden>
          {r.author.charAt(0)}
        </span>
        <div>
          <p className="text-base font-semibold">{r.author}</p>
          <p className="text-sm text-muted-foreground">{yearsOn(r.memberSince)}</p>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm">
        <Stars rating={r.rating} />
        <span aria-hidden>·</span>
        <span className="font-medium">{monthYear(r.createdAt)}</span>
      </p>
      <p className={cn("mt-1 text-base leading-6", clamp && !expanded && "line-clamp-3")}>{r.comment}</p>
      {clamp && long && !expanded && (
        <button type="button" onClick={() => setExpanded(true)} className="mt-2 text-base font-semibold underline focus-ring">
          Show more
        </button>
      )}
    </li>
  );
}

/** Reviews block: rating hero for guest favourites, 5→1 distribution, six reviews and an all-reviews dialog. */
export function ReviewsSection({
  listingId,
  avgRating,
  reviewCount,
  distribution,
  initial,
  favourite,
  categories = [],
}: {
  categories?: CategoryScore[];
  listingId: string;
  avgRating: number;
  reviewCount: number;
  distribution: number[];
  initial: ReviewItem[];
  favourite: boolean;
}) {
  const [all, setAll] = useState<ReviewItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  async function loadMore() {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch(`/api/listings/${listingId}/reviews?page=${page}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setAll((a) => [...a, ...data.reviews]);
      setHasMore(data.hasMore);
      setPage((p) => p + 1);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  if (reviewCount === 0) {
    return (
      <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-24 py-12">
        <h2 id="reviews-heading" className="flex items-center gap-2 text-[22px] leading-[26px] font-semibold">
          <Star className="size-5 fill-current" aria-hidden /> No reviews (yet)
        </h2>
        <p className="mt-2 text-muted-foreground">This place is new to Kipstay. Book it to be one of the first guests to leave a review.</p>
      </section>
    );
  }

  const max = Math.max(1, ...distribution);
  const rating = avgRating.toFixed(2).replace(/0$/, "");

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-24 py-12">
      {favourite ? (
        <div className="flex flex-col items-center text-center">
          <p className="flex items-center gap-3 text-[80px] leading-none font-semibold tracking-tight md:text-[104px]">
            <Sparkles className="size-10 text-brand md:size-14" aria-hidden />
            {rating}
            <Sparkles className="size-10 -scale-x-100 text-brand md:size-14" aria-hidden />
          </p>
          <h2 id="reviews-heading" className="mt-4 text-[22px] leading-[26px] font-semibold">
            Guest favourite
          </h2>
          <p className="mt-2 max-w-sm text-lg leading-6 text-muted-foreground">
            One of the most loved homes on Kipstay based on ratings, reviews and reliability
          </p>
        </div>
      ) : (
        <h2 id="reviews-heading" className="flex items-center gap-2 text-[22px] leading-[26px] font-semibold">
          <Star className="size-5 fill-current" aria-hidden /> {rating} · {reviewCount} review{reviewCount === 1 ? "" : "s"}
        </h2>
      )}

      {/* Reference breakdown: the overall distribution, then one column per category with its score and icon. */}
      <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-7 lg:gap-0" data-testid="rating-breakdown">
      <div className="col-span-2 sm:col-span-3 lg:col-span-1 lg:pr-6">
        <h3 className="text-sm font-semibold">Overall rating</h3>
        <ul className="mt-2 space-y-1">
          {[5, 4, 3, 2, 1].map((stars, i) => (
            <li key={stars} className="flex items-center gap-2 text-xs" aria-label={`${stars} stars: ${distribution[i]} review${distribution[i] === 1 ? "" : "s"}`}>
              <span className="w-2">{stars}</span>
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-grey-300">
                <span className="block h-full rounded-full bg-foreground" style={{ width: `${(distribution[i] / max) * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
      </div>
      {categories
        .filter((c) => c.avg !== null)
        .map((c) => {
          const Icon = CATEGORY_ICONS[c.key] ?? Star;
          return (
            <div key={c.key} className="flex flex-col justify-between gap-6 lg:border-l lg:border-grey-400 lg:px-6">
              <div>
                <h3 className="text-sm font-semibold">{c.label}</h3>
                <p className="text-lg font-semibold" aria-label={`${c.label}: ${c.avg!.toFixed(1)} out of 5`}>
                  {c.avg!.toFixed(1)}
                </p>
              </div>
              <Icon className="size-8" strokeWidth={1.4} aria-hidden />
            </div>
          );
        })}
      </div>

      <ul className="mt-10 grid gap-x-24 gap-y-10 md:grid-cols-2">
        {initial.map((r) => (
          <ReviewCard key={r.id} r={r} />
        ))}
      </ul>

      {reviewCount > initial.length && (
        <Dialog
          onOpenChange={(open) => {
            if (open && all.length === 0) void loadMore();
          }}
        >
          <DialogTrigger render={<button type="button" className="mt-10 rounded-lg bg-grey-200 px-6 py-3 text-base font-semibold transition-[background-color,transform] hover:bg-grey-300 active:scale-[0.98] focus-ring" />}>
            Show all {reviewCount} reviews
          </DialogTrigger>
          <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-[32px] p-8 shadow-elev-3 ring-0 sm:max-w-3xl data-open:animate-[kip-dialog-in_400ms_var(--ease-enter)]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[26px] leading-[30px] font-semibold">
                <Star className="size-6 fill-current" aria-hidden /> {rating} · {reviewCount} reviews
              </DialogTitle>
            </DialogHeader>
            <ul className="mt-4 space-y-10">
              {all.map((r) => (
                <ReviewCard key={r.id} r={r} clamp={false} />
              ))}
            </ul>
            {loading && <Loader2 className="mx-auto mt-6 size-6 animate-spin text-muted-foreground" aria-label="Loading reviews" />}
            {!loading && loadError && (
              <div role="alert" className="mt-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Couldn&apos;t load reviews.{" "}
                <button type="button" onClick={loadMore} className="rounded-sm font-semibold underline focus-ring">
                  Try again
                </button>
              </div>
            )}
            {!loading && !loadError && hasMore && all.length > 0 && (
              <button type="button" onClick={loadMore} className="mt-8 w-full rounded-lg border border-foreground py-3 font-semibold hover:bg-grey-100 focus-ring">
                Show more reviews
              </button>
            )}
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
