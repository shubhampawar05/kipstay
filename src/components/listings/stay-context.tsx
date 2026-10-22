"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { fromISO, localISO } from "@/lib/search-url";
import type { Quote } from "@/lib/pricing";
import type { Guests } from "@/components/search/guest-picker";

export type BookedRange = { checkIn: string; checkOut: string };

type StayState = {
  range: DateRange | undefined;
  setRange: (r: DateRange | undefined) => void;
  guests: Guests;
  setGuests: (g: Guests) => void;
  /** Matcher for the calendars: booked nights are unavailable, but a booking's first night can still be a checkout day. */
  isDisabled: (day: Date) => boolean;
  listing: { id: string; maxGuests: number; allowsPets: boolean; minNights: number };
  /** Server-computed quote for the current selection. */
  quote: QuoteState;
  reserveHref: string | null;
};

// Quotes come from /api/quote so prices are always computed on the server.
export type QuoteState = { status: "idle" } | { status: "loading" } | { status: "ok"; quote: Quote } | { status: "error"; error: string };

function useQuote(range: DateRange | undefined, guests: Guests, listing: { id: string }) {
  const [state, setState] = useState<QuoteState>({ status: "idle" });
  const checkin = range?.from ? localISO(range.from) : undefined;
  const checkout = range?.to ? localISO(range.to) : undefined;
  const key = checkin && checkout ? `${checkin}|${checkout}|${guests.adults}|${guests.children}|${guests.infants}|${guests.pets}` : null;

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      listingId: listing.id,
      checkin: checkin!,
      checkout: checkout!,
      adults: String(Math.max(1, guests.adults)),
      children: String(guests.children),
      infants: String(guests.infants),
      pets: String(guests.pets),
    });
    // Flip to "loading" asynchronously so the effect doesn't set state synchronously.
    queueMicrotask(() => {
      if (!controller.signal.aborted) setState({ status: "loading" });
    });
    fetch(`/api/quote?${params}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setState(data.ok ? { status: "ok", quote: data.quote } : { status: "error", error: data.error }))
      .catch((e) => {
        if (e.name !== "AbortError") setState({ status: "error", error: "Couldn't load pricing. Check your connection." });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures every input.
  }, [key]);

  const reserveHref =
    key && state.status === "ok"
      ? `/book/${listing.id}?${new URLSearchParams({
          checkin: checkin!,
          checkout: checkout!,
          adults: String(Math.max(1, guests.adults)),
          children: String(guests.children),
          infants: String(guests.infants),
          pets: String(guests.pets),
        })}`
      : null;

  return { state: key ? state : ({ status: "idle" } as QuoteState), reserveHref };
}

/**
 * Mirrors the chosen stay into the address bar (replaceState, no navigation or server render), so refresh, back,
 * shared links and the checkout redirect keep the dates and guests. A half-picked range leaves the URL alone.
 */
function useStayInUrl(range: DateRange | undefined, guests: Guests) {
  const checkin = range?.from && range.to ? localISO(range.from) : null;
  const checkout = range?.from && range.to ? localISO(range.to) : null;
  const pending = !!range?.from && !range.to;
  useEffect(() => {
    if (pending) return;
    const url = new URL(window.location.href);
    const set = (k: string, v: string | null) => (v ? url.searchParams.set(k, v) : url.searchParams.delete(k));
    set("checkin", checkin);
    set("checkout", checkout);
    set("adults", guests.adults ? String(guests.adults) : null);
    for (const k of ["children", "infants", "pets"] as const) set(k, guests[k] ? String(guests[k]) : null);
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
  }, [checkin, checkout, pending, guests]);
}

const StayContext = createContext<StayState | null>(null);

export function useStay() {
  const ctx = useContext(StayContext);
  if (!ctx) throw new Error("useStay must be used inside <StayProvider>");
  return ctx;
}

const dayKey = (d: Date) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

export function StayProvider({
  children,
  listing,
  booked,
  initial,
}: {
  children: React.ReactNode;
  listing: StayState["listing"];
  booked: BookedRange[];
  initial: { checkin?: string; checkout?: string; guests: Guests };
}) {
  const [range, setRange] = useState<DateRange | undefined>(() => {
    const from = fromISO(initial.checkin);
    const to = fromISO(initial.checkout);
    return from && to && to > from ? { from, to } : undefined;
  });
  const [guests, setGuests] = useState<Guests>(
    initial.guests.adults + initial.guests.children > 0 ? initial.guests : { ...initial.guests, adults: 1 },
  );

  const ranges = useMemo(
    () => booked.map((b) => ({ start: fromISO(b.checkIn)!, end: fromISO(b.checkOut)! })).sort((a, b) => +a.start - +b.start),
    [booked],
  );

  const isDisabled = useMemo(() => {
    return (day: Date) => {
      const k = dayKey(day);
      const inBookedNight = ranges.some((r) => k >= dayKey(r.start) && k < dayKey(r.end));
      if (!inBookedNight) return false;
      // While choosing a checkout, allow the first booked night after check-in (you leave as they arrive).
      if (range?.from && !range.to) {
        const next = ranges.find((r) => dayKey(r.start) > dayKey(range.from!));
        if (next && k === dayKey(next.start)) return false;
      }
      return true;
    };
  }, [ranges, range]);

  const { state: quote, reserveHref } = useQuote(range, guests, listing);
  useStayInUrl(range, guests);

  return (
    <StayContext.Provider value={{ range, setRange, guests, setGuests, isDisabled, listing, quote, reserveHref }}>{children}</StayContext.Provider>
  );
}
