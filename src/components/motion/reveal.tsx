"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// One observer for the whole page: each element is revealed once and then unobserved.
let observer: IntersectionObserver | null = null;

function getObserver() {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.reveal = "in";
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
  );
  return observer;
}

/**
 * Fades and lifts its content in the first time it scrolls into view (CSS in globals.css).
 * Content already on screen at mount is left alone, so server-rendered HTML is never hidden while the page hydrates.
 * `group` reveals descendant `.kip-reveal-item` elements with a stagger instead of the wrapper itself,
 * which suits horizontal rows whose later cards start outside the viewport.
 */
export function Reveal({
  children,
  index = 0,
  group = false,
  as: Tag = "div",
  className,
}: {
  children: React.ReactNode;
  index?: number;
  group?: boolean;
  as?: "div" | "section" | "li";
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.94) return;
    el.dataset.reveal = "pending";
    const io = getObserver();
    io.observe(el);
    return () => io.unobserve(el);
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={cn(group ? "kip-reveal-group" : "kip-reveal", className)}
      style={group ? undefined : ({ "--reveal-index": Math.min(index, 7) } as React.CSSProperties)}
    >
      {children}
    </Tag>
  );
}
