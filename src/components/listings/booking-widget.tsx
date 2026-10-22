"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { DateRangeCalendar } from "@/components/search/date-range-calendar";
import { GuestPicker, guestSummary } from "@/components/search/guest-picker";
import { formatMoney } from "@/lib/pricing";
import { shortDate } from "@/lib/search-url";
import { cn } from "@/lib/utils";
import { PriceBreakdown } from "./price-breakdown";
import { useStay } from "./stay-context";

const reserveClass =
  "bg-brand-gradient flex h-12 w-full items-center justify-center rounded-lg text-base font-semibold text-white transition-transform duration-200 active:scale-[0.98] focus-ring disabled:opacity-60";

/**
 * Booking card measured on the reference: radius 12, 1px #DDD border, elevation 0 6px 16px rgba(0,0,0,.12),
 * 24px padding; outlined date/guest box (radius 8, #B0B0B0) with 10px uppercase labels; 48px gradient Reserve.
 */
export function BookingWidget({ pricePerNight, freeCancellationNote }: { pricePerNight: number; freeCancellationNote?: string }) {
  const { range, setRange, guests, setGuests, isDisabled, listing, quote: state, reserveHref } = useStay();
  const [panel, setPanel] = useState<"dates" | "guests" | null>(null);

  return (
    <div id="booking-widget" className="rounded-xl border border-grey-400 p-6 shadow-elev-2" data-testid="booking-widget">
      <p className="text-base">
        {state.status === "ok" ? (
          <>
            <span className="text-[22px] leading-[26px] font-semibold underline underline-offset-2">{formatMoney(state.quote.total)}</span> for{" "}
            {state.quote.nights} night{state.quote.nights === 1 ? "" : "s"}
          </>
        ) : (
          <>
            <span className="text-[22px] leading-[26px] font-semibold">{formatMoney(pricePerNight)}</span> night
          </>
        )}
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-grey-600">
        <Popover open={panel === "dates"} onOpenChange={(o) => setPanel(o ? "dates" : null)}>
          <PopoverTrigger className="grid w-full grid-cols-2 text-left outline-none" aria-label="Change dates">
            <span className={cn("rounded-tl-lg border-r border-grey-600 px-3 pt-2.5 pb-2", panel === "dates" && "shadow-[inset_0_0_0_2px_#222]")}>
              <span className="block text-[10px] leading-3 font-bold tracking-wide uppercase">Check-in</span>
              <span className={cn("text-sm", !range?.from && "text-muted-foreground")}>{range?.from ? range.from.toLocaleDateString("en-US") : "Add date"}</span>
            </span>
            <span className="px-3 pt-2.5 pb-2">
              <span className="block text-[10px] leading-3 font-bold tracking-wide uppercase">Checkout</span>
              <span className={cn("text-sm", !range?.to && "text-muted-foreground")}>{range?.to ? range.to.toLocaleDateString("en-US") : "Add date"}</span>
            </span>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={-56} className="kip-panel w-auto rounded-2xl border-0 p-8 shadow-elev-4 ring-0">
            <p className="text-[22px] leading-[26px] font-semibold">{range?.from && range.to ? `${shortDate(range.from)} – ${shortDate(range.to)}` : "Select dates"}</p>
            <p className="mb-4 text-sm text-muted-foreground">{listing.minNights > 1 ? `Minimum stay: ${listing.minNights} nights` : "Add your travel dates for exact pricing"}</p>
            <DateRangeCalendar value={range} onChange={setRange} disabled={[isDisabled]} minNights={listing.minNights} autoFocus strikeUnavailable />
            <div className="mt-2 flex justify-end gap-2">
              <Button variant="link" className="font-semibold text-foreground underline" onClick={() => setRange(undefined)}>
                Clear dates
              </Button>
              <Button variant="dark" size="lg" className="h-10 rounded-lg px-5" onClick={() => setPanel(null)}>
                Close
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <Popover open={panel === "guests"} onOpenChange={(o) => setPanel(o ? "guests" : null)}>
          <PopoverTrigger
            className={cn("flex w-full items-center justify-between border-t border-grey-600 px-3 pt-2.5 pb-2 text-left outline-none", panel === "guests" && "rounded-b-lg shadow-[inset_0_0_0_2px_#222]")}
            aria-label="Change guests"
          >
            <span>
              <span className="block text-[10px] leading-3 font-bold tracking-wide uppercase">Guests</span>
              <span className="text-sm">{guestSummary(guests) ?? "1 guest"}</span>
            </span>
            <ChevronDown className={cn("size-5 transition-transform duration-200", panel === "guests" && "rotate-180")} />
          </PopoverTrigger>
          <PopoverContent align="end" className="kip-panel w-[var(--anchor-width)] min-w-80 rounded-xl border-0 px-4 py-2 shadow-elev-3 ring-0">
            <GuestPicker value={guests} onChange={setGuests} maxGuests={listing.maxGuests} allowsPets={listing.allowsPets} />
          </PopoverContent>
        </Popover>
      </div>

      {freeCancellationNote && <p className="mt-4 rounded-lg bg-grey-100 px-3 py-2 text-center text-xs">{freeCancellationNote}</p>}

      <div className="mt-4">
        {reserveHref ? (
          <Link href={reserveHref} className={reserveClass}>
            Reserve
          </Link>
        ) : (
          <button type="button" className={reserveClass} disabled={state.status === "loading" || state.status === "error"} onClick={() => setPanel("dates")}>
            {state.status === "loading" ? <Loader2 className="animate-spin" /> : "Check availability"}
          </button>
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
            <p className="mb-6 text-center text-sm">You won&apos;t be charged yet</p>
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
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-4 border-t border-grey-300 bg-background px-6 py-4 md:bottom-0 lg:hidden">
      <div className="min-w-0 text-sm">
        {state.status === "ok" ? (
          <p className="text-base">
            <span className="font-semibold underline">{formatMoney(state.quote.total)}</span> total
          </p>
        ) : (
          <p className="text-base">
            <span className="font-semibold">{formatMoney(pricePerNight)}</span> night
          </p>
        )}
        <p className="truncate text-muted-foreground">
          {range?.from && range.to ? `${shortDate(range.from)} – ${shortDate(range.to)}` : state.status === "error" ? state.error : "Add dates for prices"}
        </p>
      </div>
      {reserveHref ? (
        <Link href={reserveHref} className="bg-brand-gradient rounded-lg px-6 py-3 text-base font-semibold text-white active:scale-[0.98] focus-ring">
          Reserve
        </Link>
      ) : (
        <a href="#availability-heading" className="bg-brand-gradient rounded-lg px-6 py-3 text-base font-semibold text-white active:scale-[0.98] focus-ring">
          Check availability
        </a>
      )}
    </div>
  );
}
