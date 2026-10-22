"use client";

import { Button } from "@/components/ui/button";
import { DateRangeCalendar } from "@/components/search/date-range-calendar";
import { formatStayRange, fromLocalDay, nightsBetween } from "@/lib/dates";
import { useStay } from "./stay-context";

export function AvailabilityCalendar({ city }: { city: string }) {
  const { range, setRange, isDisabled, listing } = useStay();
  const complete = range?.from && range.to;
  const nights = complete ? nightsBetween(fromLocalDay(range.from!), fromLocalDay(range.to!)) : 0;

  return (
    <section aria-labelledby="availability-heading" className="py-8">
      <h2 id="availability-heading" className="text-xl font-semibold">
        {complete ? `${nights} night${nights === 1 ? "" : "s"} in ${city}` : "Select check-in date"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {complete
          ? formatStayRange(fromLocalDay(range.from!), fromLocalDay(range.to!))
          : listing.minNights > 1
            ? `Minimum stay: ${listing.minNights} nights`
            : "Add your travel dates for exact pricing"}
      </p>
      <div className="mt-4 overflow-x-auto" data-testid="availability-calendar">
        <DateRangeCalendar value={range} onChange={setRange} disabled={[isDisabled]} minNights={listing.minNights} />
      </div>
      {range && (
        <Button variant="link" className="mt-2 px-0 text-foreground underline" onClick={() => setRange(undefined)}>
          Clear dates
        </Button>
      )}
    </section>
  );
}
