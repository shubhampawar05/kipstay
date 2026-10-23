import Image from "next/image";
import Link from "next/link";
import type { Category } from "@prisma/client";
import { CATEGORIES } from "@/lib/constants";
import { ListingRow } from "@/components/listings/listing-row";
import { rawImage } from "@/lib/photos";

/**
 * Picture tiles that open a category search, modelled on the reference's "Explore experiences nearby" row:
 * 20:19 artwork with rounded corners and a 14px label underneath, carousel buttons only when the row overflows.
 */
export function CategoryTiles({
  counts,
  covers = {},
}: {
  counts: Partial<Record<Category, number>>;
  /** Cover photo per category; the bundled artwork stands in when a category has none. */
  covers?: Partial<Record<Category, string>>;
}) {
  const categories = CATEGORIES.filter((c) => (counts[c.value] ?? 0) > 0);
  if (categories.length === 0) return null;

  return (
    <ListingRow title="Explore stays by category" href="/s" controls="fit">
      {categories.map((c, i) => {
        const count = counts[c.value] ?? 0;
        const cover = covers[c.value] ?? `/images/listings/${c.value.toLowerCase()}-${(i % 4) + 1}.svg`;
        return (
          <Link
            key={c.value}
            href={`/s?category=${c.value}`}
            className="group/tile block rounded-2xl outline-none focus-visible:shadow-[var(--focus-ring)]"
            data-testid="category-tile"
          >
            <span className="block overflow-hidden rounded-2xl bg-grey-200">
              <Image
                src={cover}
                alt=""
                width={400}
                height={380}
                unoptimized={rawImage(cover)}
                sizes="(max-width: 744px) 45vw, 15vw"
                priority={i < 4}
                className="aspect-[20/19] w-full object-cover transition-transform duration-500 ease-standard group-hover/tile:scale-[1.04] motion-reduce:transition-none"
              />
            </span>
            <span className="mt-2 block truncate px-0.5 text-sm leading-[18px] font-medium">{c.label}</span>
            <span className="block px-0.5 text-[13px] leading-4 text-muted-foreground">
              {count} stay{count === 1 ? "" : "s"}
            </span>
          </Link>
        );
      })}
    </ListingRow>
  );
}
