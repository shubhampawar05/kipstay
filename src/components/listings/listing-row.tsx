"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";

// Reference carousel buttons: 28px circles, hover scale(30/28), press scale(26/28), 250ms standard easing.
const navButton =
  "grid size-7 place-items-center rounded-full bg-grey-200 text-foreground transition-[transform,background-color] duration-250 ease-standard hover:scale-[1.0714] hover:bg-grey-300 active:scale-[0.9286] disabled:pointer-events-none disabled:opacity-40 focus-ring";

/**
 * Horizontal listing carousel: 2.2 cards on phones, 4 at 744px, 5 at 1128px, 6 at 1280px, 7 at 1440px
 * (column counts read from reference screenshots at 390, 820 and 1440px).
 */
export function ListingRow({
  title,
  subtitle,
  href,
  controls = "always",
  children,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  /** "fit": hide previous/next while every item fits (the reference's tile row has none at full width). */
  controls?: "always" | "fit";
  children: React.ReactNode;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  // "fit" rows assume they fit until measured, so buttons appear on overflow rather than flash away on load.
  const [edges, setEdges] = useState({ start: true, end: controls === "fit" });
  const [shown, setShown] = useState({ from: 1, to: 0 });
  const count = Children.count(children);

  const frame = useRef(0);
  // At most one measurement per frame, and no re-render unless an edge actually changed.
  const update = useCallback(() => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const el = scroller.current;
      if (!el) return;
      const start = el.scrollLeft <= 4;
      const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
      // "3–9 of 10 showing" for screen readers, like the reference's "7 of 9 items showing".
      const item = el.firstElementChild as HTMLElement | null;
      if (item) {
        const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
        const step = item.offsetWidth + gap;
        const from = Math.round(el.scrollLeft / step) + 1;
        // The last visible card has no trailing gap, hence the extra `gap`.
        const to = Math.min(el.children.length, Math.floor((el.scrollLeft + el.clientWidth + gap + 4) / step));
        setShown((prev) => (prev.from === from && prev.to === to ? prev : { from, to }));
      }
    });
  }, []);

  useEffect(() => {
    update();
    const el = scroller.current;
    el?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [update]);

  function page(direction: 1 | -1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth, behavior: "smooth" });
  }

  const heading = (
    <span className="flex items-center gap-1.5">
      <span className="text-lg leading-6 font-semibold md:text-xl md:leading-6">{title}</span>
      {href && (
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-grey-200 transition-[transform,background-color] duration-250 ease-standard group-hover:scale-[1.077] group-hover:bg-grey-300 group-active:scale-[0.929]">
          <ArrowRight className="size-3.5" strokeWidth={2.5} />
        </span>
      )}
    </span>
  );

  return (
    <section className="mt-8 first:mt-6 md:mt-10" aria-label={title}>
      <div className="mb-3.5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2>
            {href ? (
              <Link href={href} className="group inline-flex rounded-lg outline-none focus-visible:shadow-[var(--focus-ring)]">
                {heading}
              </Link>
            ) : (
              heading
            )}
          </h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {count > 2 && !(controls === "fit" && edges.start && edges.end) && (
          <div className="hidden shrink-0 gap-2 md:flex">
            <button type="button" aria-label={`Previous: ${title}`} className={navButton} disabled={edges.start} onClick={() => page(-1)}>
              <ChevronLeft className="size-3.5" strokeWidth={2.5} />
            </button>
            <button type="button" aria-label={`Next: ${title}`} className={navButton} disabled={edges.end} onClick={() => page(1)}>
              <ChevronRight className="size-3.5" strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
      {shown.to > 0 && (
        <p role="status" className="sr-only">
          {shown.from === 1 ? `${shown.to}` : `${shown.from}–${shown.to}`} of {count} items showing
        </p>
      )}
      <Reveal group>
        <div
          ref={scroller}
          className={cn(
            // Phones peek the next card into the 24px gutter; from 744px the row clips at the gutter like the reference.
            "scrollbar-none -mx-6 grid snap-x snap-mandatory auto-cols-[calc((100%-1rem)/2.2)] grid-flow-col gap-3 overflow-x-auto scroll-px-6 px-6 pb-1",
            "min-[744px]:mx-0 min-[744px]:auto-cols-[calc((100%-3*0.75rem)/4)] min-[744px]:scroll-px-0 min-[744px]:px-0",
            "min-[1128px]:auto-cols-[calc((100%-4*0.75rem)/5)] min-[1280px]:auto-cols-[calc((100%-5*0.75rem)/6)] min-[1440px]:auto-cols-[calc((100%-6*0.75rem)/7)]",
          )}
        >
          {Children.map(children, (child, i) => (
            <div className="kip-reveal-item min-w-0 snap-start" style={{ "--reveal-index": i } as React.CSSProperties}>
              {child}
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
