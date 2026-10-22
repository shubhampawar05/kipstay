"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Car, Check, Minus, Plus, SlidersHorizontal, Snowflake, Utensils, Waves, Wifi, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AMENITIES, CATEGORIES, PROPERTY_TYPES, QUICK_AMENITIES } from "@/lib/constants";
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
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };
}

// Reference chips: 12/16 text, min-height 32, radius 24, #DDDDDD border → #C1C1C1 on hover, 2px press shrink.
export const chip =
  "inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-[24px] border bg-background px-3 py-2 text-xs leading-4 transition-[border-color,box-shadow,transform] duration-200 ease-standard active:scale-[0.97] focus-ring";

/** Results filter bar: Filters dialog, category chips and one-tap amenity chips. */
export function ResultsFilterBar({ prices, total }: { prices: number[]; total: number }) {
  const params = useSearchParams();
  const update = useUpdateParams();
  const selected = params.getAll("amenities");
  const category = params.get("category");

  function categoryHref(value?: string) {
    const next = new URLSearchParams(params);
    next.delete("page");
    if (value && value !== category) next.set("category", value);
    else next.delete("category");
    return `/s?${next.toString()}`;
  }

  return (
    <div className="scrollbar-none flex items-center gap-2 overflow-x-auto py-4" role="toolbar" aria-label="Filters">
      <FiltersDialog prices={prices} total={total} />
      <span aria-hidden className="mx-2 h-8 w-px shrink-0 bg-grey-400" />
      {CATEGORIES.map((c) => {
        const on = category === c.value;
        return (
          <Link
            key={c.value}
            href={categoryHref(c.value)}
            scroll={false}
            aria-current={on ? "true" : undefined}
            className={cn(chip, on ? "border-foreground bg-grey-100 shadow-[inset_0_0_0_1px_#222]" : "border-grey-400 hover:border-grey-500")}
          >
            {c.label}
          </Link>
        );
      })}
      <span aria-hidden className="mx-2 h-8 w-px shrink-0 bg-grey-400" />
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
            className={cn(chip, on ? "border-foreground bg-grey-100 shadow-[inset_0_0_0_1px_#222]" : "border-grey-400 hover:border-grey-500")}
          >
            {on && <Check className="size-3" strokeWidth={3} />}
            {a}
          </button>
        );
      })}
    </div>
  );
}

const RECOMMENDED: { amenity: (typeof AMENITIES)[number]; icon: LucideIcon }[] = [
  { amenity: "Kitchen", icon: Utensils },
  { amenity: "Free parking", icon: Car },
  { amenity: "Pool", icon: Waves },
  { amenity: "Wifi", icon: Wifi },
  { amenity: "Air conditioning", icon: Snowflake },
];

function Histogram({ prices, min, max, lo, hi }: { prices: number[]; min: number; max: number; lo: number; hi: number }) {
  const BUCKETS = 40;
  const counts = useMemo(() => {
    const c = new Array(BUCKETS).fill(0);
    const span = Math.max(1, max - min);
    for (const p of prices) c[Math.min(BUCKETS - 1, Math.floor(((p - min) / span) * BUCKETS))]++;
    return c;
  }, [prices, min, max]);
  const peak = Math.max(1, ...counts);
  return (
    <div className="flex h-16 items-end gap-[2px] px-3" aria-hidden>
      {counts.map((n, i) => {
        const value = min + ((i + 0.5) / BUCKETS) * (max - min);
        const inRange = value >= lo && value <= hi;
        return (
          <span
            key={i}
            className={cn("flex-1 rounded-t-[2px] transition-colors duration-200", inRange ? "bg-brand" : "bg-grey-400")}
            style={{ height: n ? `${Math.max(6, (n / peak) * 100)}%` : 0 }}
          />
        );
      })}
    </div>
  );
}

function Stepper({ label, value, onChange, max = 8 }: { label: string; value: number; onChange: (n: number) => void; max?: number }) {
  const btn =
    "grid size-8 place-items-center rounded-full border border-grey-600 text-muted-foreground transition-[border-color,transform] hover:border-foreground hover:text-foreground active:scale-[0.92] disabled:border-grey-300 disabled:text-grey-400 focus-ring";
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-base">{label}</span>
      <div className="flex items-center gap-4" role="group" aria-label={label}>
        <button type="button" className={btn} aria-label={`Decrease ${label}`} disabled={value <= 0} onClick={() => onChange(value - 1)}>
          <Minus className="size-3.5" />
        </button>
        <span className="w-10 text-center tabular-nums" aria-live="polite">
          {value ? `${value}+` : "Any"}
        </span>
        <button type="button" className={btn} aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function FiltersDialog({ prices, total }: { prices: number[]; total: number }) {
  const params = useSearchParams();
  const update = useUpdateParams();
  const [open, setOpen] = useState(false);
  const active = FILTER_KEYS.reduce((n, k) => n + params.getAll(k).length, 0);

  const floor = prices.length ? Math.min(...prices) : 10;
  const ceiling = prices.length ? Math.max(...prices) : 1000;

  const [lo, setLo] = useState(floor);
  const [hi, setHi] = useState(ceiling);
  const [types, setTypes] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [bedrooms, setBedrooms] = useState(0);
  const [count, setCount] = useState<number | null>(total);

  function resetFromUrl() {
    setLo(Number(params.get("minPrice")) || floor);
    setHi(Number(params.get("maxPrice")) || ceiling);
    setTypes(params.getAll("type"));
    setAmenities(params.getAll("amenities"));
    setBedrooms(Number(params.get("bedrooms")) || 0);
    setCount(total);
  }

  function draftParams() {
    const p = new URLSearchParams(params);
    for (const k of FILTER_KEYS) p.delete(k);
    p.delete("page");
    if (lo > floor) p.set("minPrice", String(lo));
    if (hi < ceiling) p.set("maxPrice", String(hi));
    if (bedrooms) p.set("bedrooms", String(bedrooms));
    for (const t of types) p.append("type", t);
    for (const a of amenities) p.append("amenities", a);
    return p;
  }

  const draftKey = open ? draftParams().toString() : "";
  // Live "Show N places" count, computed by the same server-side search as the results.
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/listings/count?${draftKey}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((d) => setCount(typeof d.count === "number" ? d.count : null))
        // Unknown count: the button falls back to "Show places" instead of a stale number.
        .catch((e) => e.name !== "AbortError" && setCount(null));
    }, 200);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [open, draftKey]);

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const section = "border-b border-grey-300 px-6 py-8 last:border-0";
  const h3 = "text-[22px] leading-[26px] font-semibold";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) resetFromUrl();
        setOpen(o);
      }}
    >
      <DialogTrigger render={<button type="button" className={cn(chip, "border-grey-400 px-4 text-xs font-medium hover:border-grey-500")} />}>
        <SlidersHorizontal className="size-3.5" /> Filters
        {active > 0 && <span className="ml-0.5 grid size-5 place-items-center rounded-full bg-foreground text-[10px] text-background">{active}</span>}
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="top-auto bottom-0 flex max-h-[92dvh] w-full max-w-none translate-y-0 flex-col gap-0 rounded-t-[32px] rounded-b-none p-0 shadow-elev-3 ring-0 data-open:animate-[kip-sheet-up_500ms_var(--ease-enter)] sm:top-1/2 sm:bottom-auto sm:max-h-[min(800px,calc(100dvh-48px))] sm:w-[calc(100%-48px)] sm:max-w-[720px] sm:-translate-y-1/2 sm:rounded-[32px] sm:data-open:animate-[kip-dialog-in_400ms_var(--ease-enter)]"
      >
        <div className="relative flex h-16 shrink-0 items-center justify-center border-b border-grey-300">
          <DialogTitle className="text-base font-semibold">Filters</DialogTitle>
          <DialogClose
            render={<button type="button" aria-label="Close filters" className="absolute right-6 grid size-8 place-items-center rounded-full hover:bg-grey-200 focus-ring" />}
          >
            <X className="size-4" strokeWidth={2.5} />
          </DialogClose>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <section className={section}>
            <h3 className={h3}>Recommended for you</h3>
            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {RECOMMENDED.map(({ amenity, icon: Icon }) => {
                const on = amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setAmenities((a) => toggle(a, amenity))}
                    className={cn(
                      "flex h-28 flex-col items-center justify-center gap-3 rounded-2xl border text-sm transition-[border-color,box-shadow,transform] duration-200 active:scale-[0.97] focus-ring",
                      on ? "border-foreground bg-grey-100 shadow-[inset_0_0_0_1px_#222]" : "border-grey-400 hover:border-foreground",
                    )}
                  >
                    <Icon className="size-8" strokeWidth={1.5} />
                    {amenity}
                  </button>
                );
              })}
            </div>
          </section>

          <section className={section}>
            <h3 className={h3}>Type of place</h3>
            <div className="mt-6 flex flex-wrap gap-2">
              {PROPERTY_TYPES.map((t) => {
                const on = types.includes(t.value);
                return (
                  <button
                    key={t.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setTypes((x) => toggle(x, t.value))}
                    className={cn(chip, "px-4 text-sm", on ? "border-foreground bg-grey-100 shadow-[inset_0_0_0_1px_#222]" : "border-grey-400 hover:border-foreground")}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className={section}>
            <h3 className={h3}>Price range</h3>
            <p className="mt-1 text-sm text-muted-foreground">Nightly prices before fees and taxes</p>
            <div className="mt-6">
              <Histogram prices={prices} min={floor} max={ceiling} lo={lo} hi={hi} />
              <div className="kip-range relative h-7">
                <input
                  type="range"
                  min={floor}
                  max={ceiling}
                  value={lo}
                  aria-label="Minimum price"
                  onChange={(e) => setLo(Math.min(Number(e.target.value), hi - 1))}
                />
                <input
                  type="range"
                  min={floor}
                  max={ceiling}
                  value={hi}
                  aria-label="Maximum price"
                  onChange={(e) => setHi(Math.max(Number(e.target.value), lo + 1))}
                />
              </div>
              <div className="mt-4 flex items-center justify-between gap-6">
                <label className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                  Minimum
                  <span className="flex h-14 min-w-28 items-center justify-center rounded-full border border-grey-600 px-4 text-base text-foreground focus-within:border-foreground focus-within:shadow-[inset_0_0_0_1px_#222]">
                    $
                    <PriceInput value={lo} min={floor} max={hi - 1} fallback={floor} onCommit={setLo} />
                  </span>
                </label>
                <label className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                  Maximum
                  <span className="flex h-14 min-w-28 items-center justify-center rounded-full border border-grey-600 px-4 text-base text-foreground focus-within:border-foreground focus-within:shadow-[inset_0_0_0_1px_#222]">
                    $
                    <PriceInput value={hi} min={lo + 1} max={ceiling} fallback={ceiling} onCommit={setHi} />
                    {hi >= ceiling && "+"}
                  </span>
                </label>
              </div>
            </div>
          </section>

          <section className={section}>
            <h3 className={h3}>Rooms</h3>
            <div className="mt-4">
              <Stepper label="Bedrooms" value={bedrooms} onChange={setBedrooms} />
            </div>
          </section>

          <section className={section}>
            <h3 className={h3}>Amenities</h3>
            <div className="mt-6 flex flex-wrap gap-2">
              {AMENITIES.map((a) => {
                const on = amenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setAmenities((x) => toggle(x, a))}
                    className={cn(chip, "px-4 text-sm", on ? "border-foreground bg-grey-100 shadow-[inset_0_0_0_1px_#222]" : "border-grey-400 hover:border-foreground")}
                  >
                    {on && <Check className="size-3.5" strokeWidth={3} />}
                    {a}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="flex h-20 shrink-0 items-center justify-between border-t border-grey-300 px-6">
          <button
            type="button"
            className="rounded-lg px-2 py-2.5 text-base font-semibold underline hover:bg-grey-100 focus-ring"
            onClick={() => {
              setLo(floor);
              setHi(ceiling);
              setTypes([]);
              setAmenities([]);
              setBedrooms(0);
            }}
          >
            Clear all
          </button>
          <Button
            type="button"
            variant="dark"
            size="xl"
            className="rounded-lg"
            disabled={count === 0}
            onClick={() => {
              const p = draftParams();
              update((current) => {
                for (const k of [...current.keys()]) current.delete(k);
                for (const [k, v] of p) current.append(k, v);
              });
              setOpen(false);
            }}
          >
            {count === null ? "Show places" : count === 0 ? "No exact matches" : `Show ${count} place${count === 1 ? "" : "s"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SortSelect({ value }: { value: string }) {
  const update = useUpdateParams();
  return (
    <label className="flex shrink-0 items-center gap-2 text-sm">
      <span className="text-muted-foreground">Sort</span>
      <select
        aria-label="Sort results"
        value={value}
        onChange={(e) => update((p) => (e.target.value === "recommended" ? p.delete("sort") : p.set("sort", e.target.value)))}
        className="h-8 rounded-[24px] border border-grey-400 bg-background px-3 text-xs hover:border-grey-500 focus-ring"
      >
        <option value="recommended">Recommended</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
        <option value="rating">Top rated</option>
      </select>
    </label>
  );
}

/**
 * Typed price bound: free typing while focused, clamped into [min, max] on blur or Enter (clamping on every
 * keystroke would snap "1" to the floor before "120" could be typed).
 */
function PriceInput({ value, min, max, fallback, onCommit }: { value: number; min: number; max: number; fallback: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const n = Number(draft);
    onCommit(Math.max(min, Math.min(Number.isFinite(n) && draft !== "" ? Math.round(n) : fallback, max)));
    setDraft(null);
  };
  return (
    <input
      type="number"
      inputMode="numeric"
      className="w-16 rounded-sm bg-transparent text-center outline-none focus-visible:underline"
      value={draft ?? value}
      min={min}
      max={max}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
      }}
    />
  );
}
