"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

export type SearchPanel = "where" | "when" | "who";

function useSearchState(initial: SearchInitial, onSubmitted?: () => void) {
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
    onSubmitted?.();
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

// Segment styling measured on the reference bar: 15x32 padding, radius 32, #EBEBEB hover fill,
// white raised segment while its panel is open.
const segmentBase =
  "relative z-[1] flex h-full min-w-0 flex-1 flex-col justify-center rounded-[32px] px-8 text-left outline-none transition-[background-color,box-shadow] duration-200 ease-standard focus-visible:shadow-[var(--focus-ring)]";
const segmentIdle = "hover:bg-grey-300";
// The active segment's white raised pill is the shared sliding indicator drawn behind the segments.
const segmentActive = "hover:bg-transparent";
const label = "text-xs leading-4 font-medium text-foreground";
const value = "truncate text-sm leading-[18px]";

function Divider({ hidden }: { hidden: boolean }) {
  return <span aria-hidden className={cn("h-8 w-px shrink-0 bg-grey-400 transition-opacity", hidden && "opacity-0")} />;
}

/** Desktop three-segment search pill (Where · When · Who). */
export function SearchBar({
  initial = {},
  className,
  initialPanel,
  onSubmitted,
  collapsed,
}: {
  initial?: SearchInitial;
  className?: string;
  /** Segment to open on mount, e.g. when expanded from the compact header pill. */
  initialPanel?: SearchPanel;
  onSubmitted?: () => void;
  /** Set when the bar has scrolled out of view under the header; any open panel closes. */
  collapsed?: boolean;
}) {
  const s = useSearchState(initial, onSubmitted);
  const [panel, setPanel] = useState<SearchPanel | null>(initialPanel ?? null);
  const whereRef = useRef<HTMLDivElement>(null);
  const whenRef = useRef<HTMLButtonElement>(null);
  const whoRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const wasOpen = useRef(false);

  // Reference motion: one white pill slides between Where / When / Who instead of each segment lighting up.
  // Positioned with transform + width (absolutely positioned, so nothing else reflows).
  useLayoutEffect(() => {
    const indicator = indicatorRef.current;
    if (!indicator) return;
    const place = () => {
      const target = panel === "where" ? whereRef.current : panel === "when" ? whenRef.current : panel === "who" ? whoRef.current : null;
      if (!target) {
        indicator.style.opacity = "0";
        wasOpen.current = false;
        return;
      }
      // Appearing: jump into place and fade in; moving between segments: slide.
      indicator.style.transitionProperty = wasOpen.current ? "transform, width, opacity" : "opacity";
      indicator.style.transform = `translateX(${target.offsetLeft}px)`;
      indicator.style.width = `${target.offsetWidth}px`;
      indicator.style.opacity = "1";
      wasOpen.current = true;
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [panel]);
  const active = panel !== null;

  useEffect(() => {
    if (initialPanel === "where") whereRef.current?.querySelector("input")?.focus();
  }, [initialPanel]);

  // Panels anchored to a bar that has scrolled away would float over the header, so collapsing closes them
  // (state adjusted during render; the effect only moves focus out of the hidden bar).
  const formRef = useRef<HTMLFormElement>(null);
  const [wasCollapsed, setWasCollapsed] = useState(collapsed);
  if (collapsed !== wasCollapsed) {
    setWasCollapsed(collapsed);
    if (collapsed) setPanel(null);
  }
  useEffect(() => {
    if (collapsed && formRef.current?.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
  }, [collapsed]);

  // Closing a panel by clicking the search button would otherwise shrink the button mid-click,
  // so it stays wide briefly after the bar goes inactive.
  const [wide, setWide] = useState(active);
  useEffect(() => {
    if (active) {
      const t = setTimeout(() => setWide(true), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setWide(false), 300);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <form
      ref={formRef}
      role="search"
      aria-label="Search stays"
      data-active={active}
      className={cn(
        "flex h-[66px] w-full max-w-[850px] items-center rounded-[32px] border border-grey-400 bg-background shadow-search transition-colors duration-200 ease-standard data-[active=true]:border-transparent data-[active=true]:bg-grey-300",
        "relative",
        className,
      )}
      onSubmit={(e) => {
        e.preventDefault();
        setPanel(null);
        s.submit();
      }}
    >
      <span
        ref={indicatorRef}
        aria-hidden
        className="pointer-events-none absolute inset-y-[-1px] left-0 rounded-[32px] bg-background opacity-0 shadow-elev-3 duration-300 ease-standard"
      />
      <div
        ref={whereRef}
        className={cn(segmentBase, "cursor-text", panel === "where" ? segmentActive : segmentIdle)}
        onFocus={() => setPanel("where")}
        onClick={() => whereRef.current?.querySelector("input")?.focus()}
      >
        <span className={label}>Where</span>
        <DestinationInput
          value={s.location}
          onChange={s.setLocation}
          onSelect={() => setPanel("when")}
          onClose={() => setPanel((p) => (p === "where" ? null : p))}
          inputClassName={cn(value, "text-foreground placeholder:text-muted-foreground")}
          panelClassName="-left-8 mt-[27px]"
        />
      </div>

      <Divider hidden={panel === "where" || panel === "when"} />

      <Popover open={panel === "when"} onOpenChange={(open) => setPanel(open ? "when" : null)}>
        <PopoverTrigger ref={whenRef} className={cn(segmentBase, panel === "when" ? segmentActive : segmentIdle)} aria-label={`When: ${s.datesLabel ?? "Add dates"}`}>
          <span className={label}>When</span>
          <span className={cn(value, s.datesLabel ? "text-foreground" : "text-muted-foreground")}>{s.datesLabel ?? "Add dates"}</span>
        </PopoverTrigger>
        <PopoverContent
          className="kip-panel w-[min(850px,calc(100vw-2rem))] rounded-[32px] border-0 p-8 shadow-elev-4 ring-0"
          align="center"
          sideOffset={12}
        >
          <div className="flex justify-center">
            <DateRangeCalendar value={s.range} onChange={s.setRange} autoFocus />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <Button type="button" variant="link" className="px-0 font-semibold text-foreground underline" onClick={() => s.setRange(undefined)}>
              Clear dates
            </Button>
            <Button type="button" variant="dark" size="lg" className="h-10 rounded-lg px-5" onClick={() => setPanel("who")} disabled={!s.range?.to}>
              Next
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Divider hidden={panel === "when" || panel === "who"} />

      <div ref={whoRef} className={cn(segmentBase, "flex-row items-center gap-2 pr-2", panel === "who" ? segmentActive : segmentIdle)}>
        <Popover open={panel === "who"} onOpenChange={(open) => setPanel(open ? "who" : null)}>
          <PopoverTrigger
            className="flex h-full min-w-0 flex-1 flex-col justify-center rounded-[32px] text-left outline-none focus-visible:underline"
            aria-label={`Who: ${guestSummary(s.guests) ?? "Add guests"}`}
          >
            <span className={label}>Who</span>
            <span className={cn(value, guestSummary(s.guests) ? "text-foreground" : "text-muted-foreground")}>
              {guestSummary(s.guests) ?? "Add guests"}
            </span>
          </PopoverTrigger>
          <PopoverContent className="kip-panel w-[425px] rounded-[32px] border-0 px-8 py-4 shadow-elev-4 ring-0" align="end" alignOffset={-8} sideOffset={20}>
            <GuestPicker value={s.guests} onChange={s.setGuests} />
          </PopoverContent>
        </Popover>
        <button
          type="submit"
          aria-label="Search"
          className={cn(
            "bg-brand-gradient flex h-12 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full text-white transition-[width,padding] duration-250 ease-standard focus-ring press",
            wide ? "w-[112px] px-4" : "w-12",
          )}
        >
          <Search className="size-4 shrink-0" strokeWidth={3} />
          <span className={cn("text-base font-semibold transition-opacity duration-150", wide ? "opacity-100" : "w-0 opacity-0")}>Search</span>
        </button>
      </div>
    </form>
  );
}

/** Collapsed header pill ("Anywhere · Any week · Add guests") that expands the full search at a segment. */
export function CompactSearch({ initial = {}, onOpen }: { initial?: SearchInitial; onOpen: (panel: SearchPanel) => void }) {
  const from = fromISO(initial.checkin);
  const to = fromISO(initial.checkout);
  const dates = from && to ? `${shortDate(from)} – ${shortDate(to)}` : null;
  const guests = guestSummary({
    adults: initial.adults ?? 0,
    children: initial.children ?? 0,
    infants: initial.infants ?? 0,
    pets: initial.pets ?? 0,
  });
  const seg = "h-full truncate px-4 text-sm font-medium outline-none focus-visible:underline";

  return (
    <div
      role="search"
      aria-label="Search stays"
      className="kip-fade-in flex h-12 max-w-full items-center rounded-full border border-grey-400 bg-background pl-2 shadow-search transition-shadow duration-200 hover:shadow-elev-2"
    >
      <button type="button" className={cn(seg, "max-w-56 pl-4")} onClick={() => onOpen("where")}>
        {initial.location || "Anywhere"}
      </button>
      <span aria-hidden className="h-6 w-px bg-grey-400" />
      <button type="button" className={seg} onClick={() => onOpen("when")}>
        {dates ?? "Any week"}
      </button>
      <span aria-hidden className="h-6 w-px bg-grey-400" />
      <button type="button" className={cn(seg, !guests && "font-normal text-muted-foreground")} onClick={() => onOpen("who")}>
        {guests ?? "Add guests"}
      </button>
      <button
        type="button"
        aria-label="Open search"
        className="bg-brand-gradient mr-2 grid size-8 shrink-0 place-items-center rounded-full text-white press focus-ring"
        onClick={() => onOpen("where")}
      >
        <Search className="size-3.5" strokeWidth={3} />
      </button>
    </div>
  );
}

/** Mobile: a "Start your search" pill that opens a full-height sheet with the same three steps. */
export function MobileSearch({ initial = {} }: { initial?: SearchInitial }) {
  const s = useSearchState(initial);
  const [open, setOpen] = useState(false);
  const hasQuery = s.location || s.datesLabel || guestSummary(s.guests);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-grey-300 bg-background px-6 shadow-elev-2 press focus-ring"
        aria-label={hasQuery ? `Open search: ${s.location || "Anywhere"}, ${s.datesLabel ?? "any week"}, ${guestSummary(s.guests) ?? "add guests"}` : "Open search"}
      >
        <Search className="size-4 shrink-0" strokeWidth={2.5} />
        {hasQuery ? (
          <span className="min-w-0 text-left">
            <span className="block truncate text-sm font-semibold">{s.location || "Anywhere"}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {[s.datesLabel ?? "Any week", guestSummary(s.guests) ?? "Add guests"].join(" · ")}
            </span>
          </span>
        ) : (
          <span className="text-base font-medium">Start your search</span>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="gap-0 overflow-y-auto rounded-t-[32px] bg-grey-100 data-[side=bottom]:h-[94dvh] data-[side=bottom]:animate-[kip-sheet-up_500ms_var(--ease-enter)]">
        <SheetHeader>
          <SheetTitle>Find a stay</SheetTitle>
        </SheetHeader>
        <form
          role="search"
          aria-label="Search stays"
          className="flex flex-col gap-3 px-4 pb-6"
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(false);
            s.submit();
          }}
        >
          <section className="rounded-[24px] bg-background p-5 shadow-elev-2">
            <h3 className="mb-3 text-[22px] leading-[26px] font-semibold">Where?</h3>
            <div className="rounded-xl border border-grey-600 px-4 py-3.5 transition-shadow focus-within:border-foreground focus-within:shadow-[inset_0_0_0_1px_#222]">
              <DestinationInput value={s.location} onChange={s.setLocation} inputClassName="text-sm" inline />
            </div>
          </section>
          <section className="rounded-[24px] bg-background p-5 shadow-elev-2">
            <h3 className="mb-2 text-[22px] leading-[26px] font-semibold">When?</h3>
            <div className="flex justify-center">
              <DateRangeCalendar value={s.range} onChange={s.setRange} />
            </div>
          </section>
          <section className="rounded-[24px] bg-background px-5 pt-5 pb-2 shadow-elev-2">
            <h3 className="text-[22px] leading-[26px] font-semibold">Who?</h3>
            <GuestPicker value={s.guests} onChange={s.setGuests} />
          </section>
          <div className="sticky bottom-0 -mx-4 flex items-center justify-between border-t bg-background px-6 pt-3 pb-1">
            <Button type="button" variant="link" className="px-0 font-semibold text-foreground underline" onClick={s.clear}>
              Clear all
            </Button>
            <Button type="submit" variant="brand" size="xl" className="rounded-lg">
              <Search strokeWidth={3} /> Search
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
