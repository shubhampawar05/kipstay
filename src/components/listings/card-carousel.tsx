"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Per-card photo carousel with prev/next buttons and position dots. */
export function CardCarousel({ images, title, priority }: { images: string[]; title: string; priority?: boolean }) {
  const [index, setIndex] = useState(0);
  const count = images.length;

  function go(e: React.MouseEvent, delta: number) {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + delta + count) % count);
  }

  return (
    <div className="group/carousel relative aspect-[20/19] overflow-hidden rounded-xl bg-muted">
      <Image
        src={images[index] ?? "/images/listings/city-1.svg"}
        alt={`${title}, photo ${index + 1} of ${count}`}
        fill
        unoptimized
        priority={priority}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover"
      />
      {count > 1 && (
        <>
          <button
            type="button"
            aria-label={`Previous photo: ${title}`}
            onClick={(e) => go(e, -1)}
            className={cn(
              "absolute top-1/2 left-2 z-20 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow opacity-0 transition-opacity group-hover/carousel:opacity-100 focus-visible:opacity-100",
              index === 0 && "invisible",
            )}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Next photo: ${title}`}
            onClick={(e) => go(e, 1)}
            className={cn(
              "absolute top-1/2 right-2 z-20 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow opacity-0 transition-opacity group-hover/carousel:opacity-100 focus-visible:opacity-100",
              index === count - 1 && "invisible",
            )}
          >
            <ChevronRight className="size-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1" aria-hidden>
            {images.slice(0, 5).map((src, i) => (
              <span key={src + i} className={cn("size-1.5 rounded-full bg-white", i === Math.min(index, 4) ? "opacity-100" : "opacity-60")} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
