"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fromISO, localISO, searchHref, shortDate } from "@/lib/search-url";
import { DestinationInput } from "./destination-input";
import { DateRangeCalendar } from "./date-range-calendar";
import { EMPTY_GUESTS, GuestPicker, guestSummary, type Guests } from "./guest-picker";

export type SearchInitial = {
  location?: string;
  checkin?: string;
  checkout?: string;
  adults?: number;
  children?: number;
  infants?: number;
  pets?: number;
};

function useSearchState(initial: SearchInitial) {
  const router = useRouter();
  const [location, setLocation] = useState(initial.location ?? "");
  const [range, setRange] = useState<DateRange | undefined>(() => {
    const from = fromISO(initial.checkin);
    const to = fromISO(initial.checkout);
    return from ? { from, to } : undefined;
  });
  const [guests, setGuests] = useState<Guests>({
    adults: initial.adults ?? 0,
    children: initial.children ?? 0,
    infants: initial.infants ?? 0,
    pets: initial.pets ?? 0,
  });

  const datesLabel =
    range?.from && range.to ? `${shortDate(range.from)} – ${shortDate(range.to)}` : range?.from ? shortDate(range.from) : null;

  function submit() {
    const complete = range?.from && range.to;
    router.push(
      searchHref({
        location,
        checkin: complete ? localISO(range.from!) : undefined,
        checkout: complete ? localISO(range.to!) : undefined,
        ...guests,
      }),
    );
  }

  function clear() {
    setLocation("");
    setRange(undefined);
    setGuests(EMPTY_GUESTS);
  }

  return { location, setLocation, range, setRange, guests, setGuests, datesLabel, submit, clear };
}

type Panel = "when" | "who" | null;

/** Desktop three-segment search pill (Where · When · Who). */
export function SearchBar({ initial = {}, className }: { initial?: SearchInitial; className?: string }) {
  const s = useSearchState(initial);
  const [panel, setPanel] = useState<Panel>(null);
  const segment =
    "flex h-full flex-col justify-center rounded-full px-6 text-left transition-colors hover:bg-muted data-[popup-open]:bg-background data-[popup-open]:shadow-lg";

  return (
    <form
      role="search"
      aria-label="Search stays"
      className={cn(
        "flex h-16 w-full max-w-3xl items-center rounded-full border bg-background shadow-sm has-[[data-popup-open]]:bg-muted",
        className,
      )}
      onSubmit={(e) => {
        e.preventDefault();
        setPanel(null);
        s.submit();
      }}
    >
      <label className="flex h-full flex-[1.3] flex-col justify-center rounded-full px-6 hover:bg-muted focus-within:bg-background focus-within:shadow-lg">
        <span className="text-xs font-semibold">Where</span>
        <DestinationInput value={s.location} onChange={s.setLocation} onSelect={() => setPanel("when")} />
      </label>

      <Popover open={panel === "when"} onOpenChange={(open) => setPanel(open ? "when" : null)}>
        <PopoverTrigger className={cn(segment, "flex-1")} aria-label={`When: ${s.datesLabel ?? "Add dates"}`}>
          <span className="text-xs font-semibold">When</span>
          <span className={cn("truncate text-sm", !s.datesLabel && "text-muted-foreground")}>{s.datesLabel ?? "Add dates"}</span>
        </PopoverTrigger>
        <PopoverContent className="w-auto rounded-3xl p-4" align="center" sideOffset={12}>
          <DateRangeCalendar value={s.range} onChange={s.setRange} autoFocus />
          <div className="flex items-center justify-between border-t pt-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => s.setRange(undefined)}>
              Clear dates
            </Button>
            <Button type="button" size="sm" onClick={() => setPanel("who")} disabled={!s.range?.to}>
              Next
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex h-full flex-1 items-center rounded-full pr-2 hover:bg-muted has-[[data-popup-open]]:bg-background has-[[data-popup-open]]:shadow-lg">
        <Popover open={panel === "who"} onOpenChange={(open) => setPanel(open ? "who" : null)}>
          <PopoverTrigger
            className="flex h-full min-w-0 flex-1 flex-col justify-center rounded-full pl-6 text-left"
            aria-label={`Who: ${guestSummary(s.guests) ?? "Add guests"}`}
          >
            <span className="text-xs font-semibold">Who</span>
            <span className={cn("truncate text-sm", !guestSummary(s.guests) && "text-muted-foreground")}>
              {guestSummary(s.guests) ?? "Add guests"}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-96 rounded-3xl px-6 py-2" align="end" sideOffset={12}>
            <GuestPicker value={s.guests} onChange={s.setGuests} />
          </PopoverContent>
        </Popover>
        <Button type="submit" size="icon-lg" className="size-12 shrink-0 rounded-full" aria-label="Search">
          <Search className="size-5" />
        </Button>
      </div>
    </form>
  );
}

/** Mobile: a pill that opens a full-height sheet with the same three steps. */
export function MobileSearch({ initial = {} }: { initial?: SearchInitial }) {
  const s = useSearchState(initial);
  const [open, setOpen] = useState(false);
  const summary = [s.datesLabel ?? "Any week", guestSummary(s.guests) ?? "Add guests"].join(" · ");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="flex w-full items-center gap-3 rounded-full border bg-background px-4 py-2.5 text-left shadow-md" aria-label="Open search">
        <Search className="size-5 shrink-0" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{s.location || "Where to?"}</span>
          <span className="block truncate text-xs text-muted-foreground">{summary}</span>
        </span>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[92dvh] overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Find a stay</SheetTitle>
        </SheetHeader>
        <form
          role="search"
          aria-label="Search stays"
          className="flex flex-col gap-4 px-4 pb-6"
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(false);
            s.submit();
          }}
        >
          <section className="rounded-2xl border p-4 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold">Where to?</h3>
            <div className="rounded-xl border px-3 py-3">
              <DestinationInput value={s.location} onChange={s.setLocation} />
            </div>
          </section>
          <section className="rounded-2xl border p-4 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold">When?</h3>
            <div className="flex justify-center">
              <DateRangeCalendar value={s.range} onChange={s.setRange} />
            </div>
          </section>
          <section className="rounded-2xl border px-4 pt-4 pb-2 shadow-sm">
            <h3 className="text-lg font-semibold">Who?</h3>
            <GuestPicker value={s.guests} onChange={s.setGuests} />
          </section>
          <div className="sticky bottom-0 -mx-4 flex items-center justify-between border-t bg-background px-4 pt-3">
            <Button type="button" variant="link" className="px-0 text-foreground underline" onClick={s.clear}>
              Clear all
            </Button>
            <Button type="submit" size="lg" className="h-12 rounded-xl px-6">
              <Search /> Search
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
