"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Star } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button, buttonVariants } from "@/components/ui/button";
import { DateRangeCalendar } from "@/components/search/date-range-calendar";
import { GuestPicker, guestSummary } from "@/components/search/guest-picker";
import { formatMoney } from "@/lib/pricing";
import { shortDate } from "@/lib/search-url";
import { cn } from "@/lib/utils";
import { PriceBreakdown } from "./price-breakdown";
import { useStay } from "./stay-context";

export function BookingWidget({ pricePerNight, rating, reviewCount }: { pricePerNight: number; rating: number; reviewCount: number }) {
  const { range, setRange, guests, setGuests, isDisabled, listing, quote: state, reserveHref } = useStay();
  const [panel, setPanel] = useState<"dates" | "guests" | null>(null);

  return (
    <div className="rounded-2xl border p-6 shadow-xl" data-testid="booking-widget">
      <div className="flex items-baseline justify-between gap-2">
        <p>
          {state.status === "ok" ? (
            <>
              <span className="text-2xl font-semibold">{formatMoney(state.quote.total)}</span>{" "}
              <span className="text-muted-foreground">
                for {state.quote.nights} night{state.quote.nights === 1 ? "" : "s"}
              </span>
            </>
          ) : (
            <>
              <span className="text-2xl font-semibold">{formatMoney(pricePerNight)}</span> <span className="text-muted-foreground">night</span>
            </>
          )}
        </p>
        {reviewCount > 0 && (
          <span className="flex items-center gap-1 text-sm">
            <Star className="size-3.5 fill-current" aria-hidden /> {rating.toFixed(2)}
          </span>
        )}
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border">
        <Popover open={panel === "dates"} onOpenChange={(o) => setPanel(o ? "dates" : null)}>
          <PopoverTrigger className="grid w-full grid-cols-2 text-left" aria-label="Change dates">
            <span className="border-r px-3 py-2.5">
              <span className="block text-[10px] font-bold uppercase">Check-in</span>
              <span className={cn("text-sm", !range?.from && "text-muted-foreground")}>{range?.from ? shortDate(range.from) : "Add date"}</span>
            </span>
            <span className="px-3 py-2.5">
              <span className="block text-[10px] font-bold uppercase">Checkout</span>
              <span className={cn("text-sm", !range?.to && "text-muted-foreground")}>{range?.to ? shortDate(range.to) : "Add date"}</span>
            </span>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto rounded-2xl p-4">
            <DateRangeCalendar value={range} onChange={setRange} disabled={[isDisabled]} minNights={listing.minNights} autoFocus />
            <div className="flex justify-between border-t pt-3">
              <Button variant="ghost" size="sm" onClick={() => setRange(undefined)}>
                Clear dates
              </Button>
              <Button size="sm" onClick={() => setPanel(null)}>
                Close
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <Popover open={panel === "guests"} onOpenChange={(o) => setPanel(o ? "guests" : null)}>
          <PopoverTrigger className="w-full border-t px-3 py-2.5 text-left" aria-label="Change guests">
            <span className="block text-[10px] font-bold uppercase">Guests</span>
            <span className="text-sm">{guestSummary(guests) ?? "1 guest"}</span>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 rounded-2xl px-4 py-2">
            <GuestPicker value={guests} onChange={setGuests} maxGuests={listing.maxGuests} allowsPets={listing.allowsPets} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="mt-4">
        {reserveHref ? (
          <Link href={reserveHref} className={cn(buttonVariants({ size: "lg" }), "h-12 w-full rounded-xl text-base")}>
            Reserve
          </Link>
        ) : (
          <Button
            size="lg"
            className="h-12 w-full rounded-xl text-base"
            disabled={state.status === "loading" || state.status === "error"}
            onClick={() => setPanel("dates")}
          >
            {state.status === "loading" ? <Loader2 className="animate-spin" /> : "Check availability"}
          </Button>
        )}
      </div>

      <div aria-live="polite" className="mt-4">
        {state.status === "error" && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {state.error}
          </p>
        )}
        {state.status === "ok" && (
          <>
            <p className="mb-4 text-center text-sm text-muted-foreground">You won&apos;t be charged yet</p>
            <PriceBreakdown quote={state.quote} />
          </>
        )}
      </div>
    </div>
  );
}

/** Phone-only sticky footer that mirrors the widget's price and primary action. */
export function MobileReserveBar({ pricePerNight }: { pricePerNight: number }) {
  const { range, quote: state, reserveHref } = useStay();
  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-4 border-t bg-background px-4 py-3 lg:hidden">
      <div className="min-w-0 text-sm">
        {state.status === "ok" ? (
          <p>
            <span className="font-semibold">{formatMoney(state.quote.total)}</span> total
          </p>
        ) : (
          <p>
            <span className="font-semibold">{formatMoney(pricePerNight)}</span> night
          </p>
        )}
        <p className="truncate text-muted-foreground">
          {range?.from && range.to ? `${shortDate(range.from)} – ${shortDate(range.to)}` : state.status === "error" ? state.error : "Add dates"}
        </p>
      </div>
      {reserveHref ? (
        <Link href={reserveHref} className={cn(buttonVariants({ size: "lg" }), "rounded-xl")}>
          Reserve
        </Link>
      ) : (
        <a href="#availability-heading" className={cn(buttonVariants({ size: "lg" }), "rounded-xl")}>
          Check availability
        </a>
      )}
    </div>
  );
}
