"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { rawImage } from "@/lib/photos";

// Reference photo arrows: 32px white circles that fade in on card hover (200ms) with press feedback.
const arrow =
  "absolute top-1/2 z-20 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow-elev-1 opacity-0 transition-[opacity,transform] duration-200 ease-standard group-hover/card:opacity-100 hover:scale-[1.04] hover:bg-white active:scale-[0.92] focus-visible:opacity-100 focus-ring";

/** Which of the (at most five) dots is active: the window slides once the photo is past the second dot. */
function activeDot(index: number, count: number) {
  if (count <= 5 || index < 2) return index;
  if (index > count - 3) return 5 - (count - index);
  return 2;
}

/**
 * Per-card photo carousel: a scroll-snap track, so phones get native swipe and the arrows slide smoothly.
 * Each slide links to the listing (hidden from the tab order; the card's own link is the focus target).
 */
export function CardCarousel({
  images,
  title,
  href,
  priority,
  dots = true,
}: {
  images: string[];
  title: string;
  href: string;
  priority?: boolean;
  dots?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const [index, setIndex] = useState(0);
  const count = Math.max(images.length, 1);
  const slides = images.length ? images : ["/images/listings/city-1.svg"];

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function onScroll() {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = track.current;
      if (el && el.clientWidth) setIndex(Math.round(el.scrollLeft / el.clientWidth));
    });
  }

  function go(e: React.MouseEvent, delta: number) {
    e.preventDefault();
    e.stopPropagation();
    const el = track.current;
    if (!el) return;
    const next = Math.max(0, Math.min(count - 1, index + delta));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: next * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
    setIndex(next);
  }

  return (
    <div className="relative aspect-[20/19] overflow-hidden rounded-[20px] bg-grey-200 transition-shadow duration-300 ease-standard group-hover/card:shadow-elev-2">
      <div
        ref={track}
        onScroll={onScroll}
        className="scrollbar-none flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        aria-label={`${title}: photos`}
        role="group"
      >
        {slides.map((src, i) => (
          <Link key={src + i} href={href} tabIndex={-1} aria-hidden className="relative size-full shrink-0 snap-center snap-always overflow-hidden">
            <Image
              src={src}
              alt={i === index ? `${title}, photo ${i + 1} of ${count}` : ""}
              fill
              unoptimized={rawImage(src)}
              priority={priority && i === 0}
              loading={priority && i === 0 ? undefined : "lazy"}
              sizes="(max-width: 744px) 50vw, (max-width: 1440px) 25vw, 15vw"
              className="object-cover transition-transform duration-500 ease-standard group-hover/card:scale-[1.04]"
              draggable={false}
            />
          </Link>
        ))}
      </div>
      {count > 1 && (
        <>
          <button type="button" aria-label={`Previous photo: ${title}`} onClick={(e) => go(e, -1)} className={cn(arrow, "left-3", index === 0 && "invisible")}>
            <ChevronLeft className="size-4" strokeWidth={2.5} />
          </button>
          <button type="button" aria-label={`Next photo: ${title}`} onClick={(e) => go(e, 1)} className={cn(arrow, "right-3", index >= count - 1 && "invisible")}>
            <ChevronRight className="size-4" strokeWidth={2.5} />
          </button>
          {dots && (
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-[5px]" aria-hidden>
              {slides.slice(0, 5).map((src, i) => (
                <span
                  key={src + i}
                  className={cn(
                    "size-1.5 rounded-full bg-white transition-[opacity,transform] duration-200",
                    i === activeDot(index, count) ? "opacity-100" : "scale-[0.85] opacity-60",
                  )}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
