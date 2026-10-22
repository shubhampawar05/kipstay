"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Reference photo arrows: 32px white circles that fade in on card hover (200ms) with press feedback.
const arrow =
  "absolute top-1/2 z-20 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow-elev-1 opacity-0 transition-[opacity,transform] duration-200 ease-standard group-hover/card:opacity-100 hover:scale-[1.04] hover:bg-white active:scale-[0.92] focus-visible:opacity-100 focus-ring";

/** Per-card photo carousel with prev/next buttons and position dots. */
export function CardCarousel({ images, title, priority, dots = true }: { images: string[]; title: string; priority?: boolean; dots?: boolean }) {
  const [index, setIndex] = useState(0);
  const count = images.length;

  function go(e: React.MouseEvent, delta: number) {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + delta + count) % count);
  }

  return (
    <div className="relative aspect-[20/19] overflow-hidden rounded-[20px] bg-grey-200">
      <Image
        key={images[index]}
        src={images[index] ?? "/images/listings/city-1.svg"}
        alt={`${title}, photo ${index + 1} of ${count}`}
        fill
        unoptimized
        priority={priority}
        sizes="(max-width: 744px) 50vw, (max-width: 1440px) 25vw, 15vw"
        className="kip-fade-in object-cover"
      />
      {count > 1 && (
        <>
          <button type="button" aria-label={`Previous photo: ${title}`} onClick={(e) => go(e, -1)} className={cn(arrow, "left-3", index === 0 && "invisible")}>
            <ChevronLeft className="size-4" strokeWidth={2.5} />
          </button>
          <button type="button" aria-label={`Next photo: ${title}`} onClick={(e) => go(e, 1)} className={cn(arrow, "right-3", index === count - 1 && "invisible")}>
            <ChevronRight className="size-4" strokeWidth={2.5} />
          </button>
          {dots && (
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-[5px]" aria-hidden>
              {images.slice(0, 5).map((src, i) => (
                <span
                  key={src + i}
                  className={cn("size-1.5 rounded-full bg-white transition-opacity duration-200", i === Math.min(index, 4) ? "opacity-100" : "opacity-60")}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
