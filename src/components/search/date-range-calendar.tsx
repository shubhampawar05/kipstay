"use client";

import type { DateRange, Matcher } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { useHydrated, useIsDesktop } from "@/hooks/use-media-query";

/** Two-month range calendar (one month on phones) with past days disabled. */
export function DateRangeCalendar({
  value,
  onChange,
  disabled = [],
  minNights = 1,
  autoFocus,
}: {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  disabled?: Matcher[];
  minNights?: number;
  autoFocus?: boolean;
}) {
  const isDesktop = useIsDesktop();
  const hydrated = useHydrated();
  // "Today" and the month count depend on the viewer's clock and screen, so only render on the client.
  if (!hydrated) return <div className="h-[22rem] w-full max-w-[42rem] animate-pulse rounded-xl bg-muted/60" aria-hidden />;

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
      className="[--cell-size:--spacing(10)]"
    />
  );
}
