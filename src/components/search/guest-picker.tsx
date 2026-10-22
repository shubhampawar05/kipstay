"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_GUESTS } from "@/lib/constants";

export type Guests = { adults: number; children: number; infants: number; pets: number };

export const EMPTY_GUESTS: Guests = { adults: 0, children: 0, infants: 0, pets: 0 };

const ROWS: { key: keyof Guests; label: string; hint: string; max: number }[] = [
  { key: "adults", label: "Adults", hint: "Ages 13 or above", max: MAX_GUESTS },
  { key: "children", label: "Children", hint: "Ages 2–12", max: MAX_GUESTS },
  { key: "infants", label: "Infants", hint: "Under 2", max: 5 },
  { key: "pets", label: "Pets", hint: "Service animals are always welcome", max: 5 },
];

export function guestSummary(g: Guests): string | null {
  const people = g.adults + g.children;
  if (people === 0 && g.infants === 0 && g.pets === 0) return null;
  const parts = [`${people} guest${people === 1 ? "" : "s"}`];
  if (g.infants) parts.push(`${g.infants} infant${g.infants === 1 ? "" : "s"}`);
  if (g.pets) parts.push(`${g.pets} pet${g.pets === 1 ? "" : "s"}`);
  return parts.join(", ");
}

export function GuestPicker({
  value,
  onChange,
  maxGuests,
  allowsPets = true,
}: {
  value: Guests;
  onChange: (next: Guests) => void;
  /** Cap on adults + children (infants don't count), e.g. a listing's capacity. */
  maxGuests?: number;
  allowsPets?: boolean;
}) {
  const people = value.adults + value.children;

  function update(key: keyof Guests, delta: number) {
    const next = { ...value, [key]: Math.max(0, value[key] + delta) };
    // Children, infants and pets need a supervising adult.
    if (key !== "adults" && delta > 0 && next.adults === 0) next.adults = 1;
    if (key === "adults" && next.adults === 0 && next.children + next.infants + next.pets > 0) return;
    onChange(next);
  }

  return (
    <div className="divide-y">
      {ROWS.filter((r) => r.key !== "pets" || allowsPets).map((row) => {
        const n = value[row.key];
        const atPeopleCap = (row.key === "adults" || row.key === "children") && maxGuests !== undefined && people >= maxGuests;
        const minimum = row.key === "adults" && value.children + value.infants + value.pets > 0 ? 1 : 0;
        return (
          <div key={row.key} className="flex items-center justify-between gap-6 py-4">
            <div>
              <div className="font-medium" id={`guest-${row.key}`}>
                {row.label}
              </div>
              <div className="text-sm text-muted-foreground">{row.hint}</div>
            </div>
            <div className="flex items-center gap-3" role="group" aria-labelledby={`guest-${row.key}`}>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-full"
                aria-label={`Decrease ${row.label}`}
                disabled={n <= minimum}
                onClick={() => update(row.key, -1)}
              >
                <Minus />
              </Button>
              <span className="w-6 text-center tabular-nums" aria-live="polite" data-testid={`guest-${row.key}-value`}>
                {n}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-full"
                aria-label={`Increase ${row.label}`}
                disabled={n >= row.max || atPeopleCap}
                onClick={() => update(row.key, 1)}
              >
                <Plus />
              </Button>
            </div>
          </div>
        );
      })}
      {maxGuests !== undefined && (
        <p className="pt-3 text-xs text-muted-foreground">
          This place has a maximum of {maxGuests} guests, not including infants.
          {!allowsPets && " Pets aren't allowed."}
        </p>
      )}
    </div>
  );
}
