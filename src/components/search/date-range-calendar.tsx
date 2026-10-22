"use client";

import type { DateRange, Matcher } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useHydrated, useIsDesktop } from "@/hooks/use-media-query";

/** Two-month range calendar (one month on phones) with past days disabled. */
export function DateRangeCalendar({
  value,
  onChange,
  disabled = [],
  minNights = 1,
  autoFocus,
  strikeUnavailable,
  compact,
}: {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  disabled?: Matcher[];
  minNights?: number;
  autoFocus?: boolean;
  /** Listing calendars strike through unavailable nights, as on the reference listing page. */
  strikeUnavailable?: boolean;
  /** 44px cells and tighter month gap, for narrower columns such as the listing page. */
  compact?: boolean;
}) {
  const isDesktop = useIsDesktop();
  const hydrated = useHydrated();
  // "Today" and the month count depend on the viewer's clock and screen, so only render on the client.
  if (!hydrated) return <div className="kip-shimmer h-[22rem] w-full max-w-[44rem] rounded-2xl" aria-hidden />;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Calendar
      mode="range"
      numberOfMonths={isDesktop ? 2 : 1}
      selected={value}
      onSelect={onChange}
      min={minNights}
      excludeDisabled
      disabled={[{ before: today }, ...disabled]}
      startMonth={today}
      defaultMonth={value?.from ?? today}
      autoFocus={autoFocus}
      className={cn(
        "kip-calendar bg-transparent p-0 [--cell-radius:9999px] [--cell-size:44px] md:[--cell-size:48px] [&_.rdp-months]:gap-12",
        compact && "md:[--cell-size:44px] [&_.rdp-months]:gap-8",
        strikeUnavailable && "kip-calendar-strike",
      )}
    />
  );
}
