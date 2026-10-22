"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { CalendarOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { blockDatesAction, unblockDatesAction } from "@/app/actions/calendar";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/empty-state";
import { useHydrated, useMediaQuery } from "@/hooks/use-media-query";
import { addDays, formatStayRange, fromLocalDay, nightsBetween, parseISODate, toISODate } from "@/lib/dates";

type Booking = { id: string; checkIn: string; checkOut: string; guest: string; guests: number };
type Block = { id: string; start: string; end: string; note: string };

/** Every night (local calendar day) in the half-open ISO range [start, end). */
function nightsOf(start: string, end: string): string[] {
  const out: string[] = [];
  for (let d = parseISODate(start)!; d < parseISODate(end)!; d = addDays(d, 1)) out.push(toISODate(d));
  return out;
}

const key = (d: Date) => toISODate(fromLocalDay(d));
const range = (start: string, end: string) => formatStayRange(parseISODate(start)!, parseISODate(end)!);

/**
 * Host availability: pick nights on the calendar to close them, reopen blocks, and see booked nights.
 * Nights are selected inclusively (first and last closed night); the server stores [start, end) like a stay.
 */
export function CalendarManager({ listingId, bookings, blocks }: { listingId: string; bookings: Booking[]; blocks: Block[] }) {
  const router = useRouter();
  const hydrated = useHydrated();
  // Two months only when the column beside the side panel is wide enough for them.
  const twoMonths = useMediaQuery("(min-width: 1200px)");
  const [selected, setSelected] = useState<DateRange | undefined>();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [reopening, setReopening] = useState<string | null>(null);

  const booked = useMemo(() => new Set(bookings.flatMap((b) => nightsOf(b.checkIn, b.checkOut))), [bookings]);
  const blocked = useMemo(() => new Set(blocks.flatMap((b) => nightsOf(b.start, b.end))), [blocks]);

  const first = selected?.from;
  const last = selected?.to ?? selected?.from;
  const startISO = first ? key(first) : null;
  const endISO = last ? toISODate(addDays(fromLocalDay(last), 1)) : null;
  const nights = startISO && endISO ? nightsBetween(parseISODate(startISO)!, parseISODate(endISO)!) : 0;

  function block() {
    if (!startISO || !endISO) return;
    setError(null);
    start(async () => {
      const result = await blockDatesAction({ listingId, start: startISO, end: endISO, note }).catch(() => null);
      if (!result) {
        setError("Couldn't save. Check your connection and try again.");
        return;
      }
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast(result.message);
      setSelected(undefined);
      setNote("");
      router.refresh();
    });
  }

  function reopen(id: string) {
    setReopening(id);
    start(async () => {
      const result = await unblockDatesAction(id).catch(() => null);
      setReopening(null);
      if (!result) toast.error("Couldn't reopen those nights. Try again.");
      else if (!result.ok) toast.error(result.error);
      else {
        toast(result.message);
        router.refresh();
      }
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section aria-labelledby="calendar-heading">
        <h2 id="calendar-heading" className="sr-only">
          Choose nights to block
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-grey-400 p-4 md:p-6" data-testid="host-calendar">
          {hydrated ? (
            <Calendar
              mode="range"
              numberOfMonths={twoMonths ? 2 : 1}
              selected={selected}
              onSelect={(r) => {
                setError(null);
                setSelected(r);
              }}
              excludeDisabled
              disabled={[{ before: today }, (d: Date) => booked.has(key(d)) || blocked.has(key(d))]}
              modifiers={{ booked: (d: Date) => booked.has(key(d)), blocked: (d: Date) => blocked.has(key(d)) }}
              modifiersClassNames={{ booked: "kip-day-booked", blocked: "kip-day-blocked" }}
              startMonth={today}
              className="kip-calendar mx-auto bg-transparent p-0 [--cell-radius:9999px] [--cell-size:42px] [&_.rdp-months]:gap-10"
            />
          ) : (
            <div className="kip-shimmer h-[22rem] w-full rounded-2xl" aria-hidden />
          )}
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground" aria-label="Legend">
            <li className="flex items-center gap-2">
              <span className="kip-swatch-booked size-4 rounded-full" aria-hidden /> Booked by a guest
            </li>
            <li className="flex items-center gap-2">
              <span className="kip-swatch-blocked size-4 rounded-full" aria-hidden /> Blocked by you
            </li>
          </ul>
        </div>
      </section>

      <aside className="space-y-8">
        <section aria-labelledby="block-heading" className="rounded-2xl border border-grey-400 p-5 shadow-elev-1">
          <h2 id="block-heading" className="text-lg font-semibold">
            Block nights
          </h2>
          {startISO && endISO ? (
            <>
              <p className="mt-1 text-sm" aria-live="polite" data-testid="block-selection">
                {nights} night{nights === 1 ? "" : "s"} · {range(startISO, endISO)}
              </p>
              <div className="mt-4 space-y-1.5">
                <Label htmlFor="block-note">Note (only you see this)</Label>
                <Input id="block-note" value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Repainting" />
              </div>
              {error && (
                <p role="alert" className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="mt-4 flex gap-2">
                <Button type="button" variant="dark" className="flex-1" disabled={pending} onClick={block}>
                  {pending && !reopening && <Loader2 className="animate-spin" />} Block {nights === 1 ? "night" : "nights"}
                </Button>
                <Button type="button" variant="outline" disabled={pending} onClick={() => setSelected(undefined)}>
                  Clear
                </Button>
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Select the first and last night to close. Guests won&apos;t be able to book them.</p>
          )}
        </section>

        <section aria-labelledby="blocks-heading">
          <h2 id="blocks-heading" className="mb-3 text-lg font-semibold">
            Blocked nights
          </h2>
          {blocks.length === 0 ? (
            <EmptyState icon={CalendarOff} title="Nothing blocked">
              Your calendar is open on every night that isn&apos;t booked.
            </EmptyState>
          ) : (
            <ul className="divide-y rounded-2xl border" data-testid="block-list">
              {blocks.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-medium">{range(b.start, b.end)}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {nightsOf(b.start, b.end).length} nights{b.note ? ` · ${b.note}` : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => reopen(b.id)}
                    aria-label={`Reopen ${range(b.start, b.end)}`}
                  >
                    {reopening === b.id && <Loader2 className="animate-spin" />} Reopen
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="booked-heading">
          <h2 id="booked-heading" className="mb-3 text-lg font-semibold">
            Upcoming reservations
          </h2>
          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming reservations for this listing.</p>
          ) : (
            <ul className="divide-y rounded-2xl border">
              {bookings.map((b) => (
                <li key={b.id} className="p-4">
                  <p className="font-medium">{range(b.checkIn, b.checkOut)}</p>
                  <p className="text-sm text-muted-foreground">
                    {b.guest} · {b.guests} guest{b.guests === 1 ? "" : "s"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}
