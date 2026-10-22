"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AMENITIES, PROPERTY_TYPES, QUICK_AMENITIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const FILTER_KEYS = ["minPrice", "maxPrice", "type", "amenities", "bedrooms"] as const;

function useUpdateParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params);
    mutate(next);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  };
}

/** Amenity chips that toggle a single filter straight from the results page. */
export function QuickFilters() {
  const params = useSearchParams();
  const update = useUpdateParams();
  const selected = params.getAll("amenities");

  return (
    <div className="scrollbar-none flex gap-2 overflow-x-auto" role="group" aria-label="Quick filters">
      {QUICK_AMENITIES.map((a) => {
        const on = selected.includes(a);
        return (
          <button
            key={a}
            type="button"
            aria-pressed={on}
            onClick={() =>
              update((p) => {
                const rest = p.getAll("amenities").filter((x) => x !== a);
                p.delete("amenities");
                for (const x of on ? rest : [...rest, a]) p.append("amenities", x);
              })
            }
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors",
              on ? "border-foreground bg-foreground text-background" : "hover:border-foreground",
            )}
          >
            {a}
          </button>
        );
      })}
    </div>
  );
}

export function FiltersDialog() {
  const params = useSearchParams();
  const update = useUpdateParams();
  const [open, setOpen] = useState(false);
  const active = FILTER_KEYS.reduce((n, k) => n + params.getAll(k).length, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="h-10 shrink-0 rounded-xl px-4" />}>
        <SlidersHorizontal /> Filters
        {active > 0 && (
          <span className="ml-1 grid size-5 place-items-center rounded-full bg-foreground text-[11px] text-background">{active}</span>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
        </DialogHeader>
        <form
          key={params.toString()}
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            update((p) => {
              for (const k of FILTER_KEYS) p.delete(k);
              for (const k of ["minPrice", "maxPrice", "bedrooms"] as const) {
                const v = String(fd.get(k) ?? "").trim();
                if (v && Number(v) > 0) p.set(k, String(Math.round(Number(v))));
              }
              for (const t of fd.getAll("type")) p.append("type", String(t));
              for (const a of fd.getAll("amenities")) p.append("amenities", String(a));
            });
            setOpen(false);
          }}
        >
          <fieldset>
            <legend className="mb-3 font-semibold">Price per night (USD)</legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="minPrice">Minimum</Label>
                <Input id="minPrice" name="minPrice" type="number" min={0} inputMode="numeric" defaultValue={params.get("minPrice") ?? ""} placeholder="$10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="maxPrice">Maximum</Label>
                <Input id="maxPrice" name="maxPrice" type="number" min={0} inputMode="numeric" defaultValue={params.get("maxPrice") ?? ""} placeholder="$1,000+" />
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 font-semibold">Bedrooms</legend>
            <div className="flex flex-wrap gap-2">
              {["", "1", "2", "3", "4", "5"].map((n) => (
                <label key={n || "any"} className="cursor-pointer">
                  <input type="radio" name="bedrooms" value={n} defaultChecked={(params.get("bedrooms") ?? "") === n} className="peer sr-only" />
                  <span className="block rounded-full border px-4 py-1.5 text-sm peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50">
                    {n ? `${n}+` : "Any"}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 font-semibold">Property type</legend>
            <div className="grid grid-cols-2 gap-3">
              {PROPERTY_TYPES.map((t) => (
                <label key={t.value} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="size-4 accent-primary" name="type" value={t.value} defaultChecked={params.getAll("type").includes(t.value)} />
                  {t.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 font-semibold">Amenities</legend>
            <div className="grid grid-cols-2 gap-3">
              {AMENITIES.map((a) => (
                <label key={a} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="size-4 accent-primary" name="amenities" value={a} defaultChecked={params.getAll("amenities").includes(a)} />
                  {a}
                </label>
              ))}
            </div>
          </fieldset>

          <DialogFooter className="sticky bottom-0 flex-row justify-between bg-popover sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                update((p) => FILTER_KEYS.forEach((k) => p.delete(k)));
                setOpen(false);
              }}
            >
              Clear all
            </Button>
            <Button type="submit">Show stays</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SortSelect({ value }: { value: string }) {
  const update = useUpdateParams();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Sort</span>
      <select
        aria-label="Sort results"
        value={value}
        onChange={(e) => update((p) => (e.target.value === "recommended" ? p.delete("sort") : p.set("sort", e.target.value)))}
        className="h-10 rounded-xl border bg-background px-3"
      >
        <option value="recommended">Recommended</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
        <option value="rating">Top rated</option>
      </select>
    </label>
  );
}
