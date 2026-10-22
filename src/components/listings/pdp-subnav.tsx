"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { formatMoney } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { useStay } from "./stay-context";

const LINKS = [
  { id: "photos", label: "Photos" },
  { id: "amenities", label: "Amenities" },
  { id: "reviews", label: "Reviews" },
  { id: "location", label: "Location" },
];

/**
 * Sticky section nav observed on the reference listing page: appears once the photos scroll away; once the
 * booking card scrolls away too, it also shows the price and a Reserve button.
 */
export function PdpSubnav({ pricePerNight, rating, reviewCount }: { pricePerNight: number; rating: number; reviewCount: number }) {
  const { quote, reserveHref } = useStay();
  const [visible, setVisible] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const [active, setActive] = useState("photos");

  useEffect(() => {
    const photos = document.getElementById("photos");
    const widget = document.getElementById("booking-widget");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.target === photos) setVisible(!e.isIntersecting && e.boundingClientRect.top < 0);
          if (e.target === widget) setShowCta(!e.isIntersecting && e.boundingClientRect.top < 0);
        }
      },
      { rootMargin: "-80px 0px 0px 0px" },
    );
    if (photos) io.observe(photos);
    if (widget) io.observe(widget);

    const sections = LINKS.map((l) => document.getElementById(l.id)).filter(Boolean) as HTMLElement[];
    const spy = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: "-90px 0px -60% 0px" },
    );
    sections.forEach((s) => spy.observe(s));
    return () => {
      io.disconnect();
      spy.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 top-0 z-50 hidden border-b border-grey-300 bg-background transition-[opacity,transform] duration-200 ease-standard md:block",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
      )}
    >
      <div className="mx-auto flex h-20 max-w-[1120px] items-center justify-between px-6 min-[1168px]:px-0">
        <nav aria-label="Listing sections" className="flex h-full gap-6">
          {LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              tabIndex={visible ? 0 : -1}
              className={cn(
                "flex h-full items-center border-b-4 text-sm font-medium transition-colors",
                active === l.id ? "border-foreground" : "border-transparent hover:border-grey-400",
              )}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className={cn("flex items-center gap-6 transition-opacity duration-200", showCta ? "opacity-100" : "pointer-events-none opacity-0")}>
          <div className="text-right">
            <p className="text-base">
              {quote.status === "ok" ? (
                <>
                  <span className="font-semibold underline">{formatMoney(quote.quote.total)}</span> for {quote.quote.nights} night
                  {quote.quote.nights === 1 ? "" : "s"}
                </>
              ) : (
                <>
                  <span className="font-semibold">{formatMoney(pricePerNight)}</span> night
                </>
              )}
            </p>
            {reviewCount > 0 && (
              <p className="flex items-center justify-end gap-1 text-xs">
                <Star className="size-2.5 fill-current" aria-hidden /> {rating.toFixed(2)} · <span className="text-muted-foreground">{reviewCount} reviews</span>
              </p>
            )}
          </div>
          <Link
            href={reserveHref ?? "#availability-heading"}
            tabIndex={showCta ? 0 : -1}
            className="bg-brand-gradient rounded-lg px-6 py-3.5 text-base font-semibold text-white transition-transform duration-200 active:scale-[0.97] focus-ring"
          >
            {reserveHref ? "Reserve" : "Check availability"}
          </Link>
        </div>
      </div>
    </div>
  );
}
