"use client";

import type { DateRange } from "react-day-picker";
import { Camera, ChefHat, CookingPot, Flower2, Scissors, Sparkles, Timer, UtensilsCrossed, Wand2, type LucideIcon } from "lucide-react";
import { SERVICE_TYPES, type ServiceType } from "@/lib/constants";
import { shortDate } from "@/lib/search-url";
import { cn } from "@/lib/utils";

const SERVICE_ICONS: Record<ServiceType, LucideIcon> = {
  photography: Camera,
  chefs: ChefHat,
  massage: Flower2,
  "prepared-meals": CookingPot,
  training: Timer,
  "make-up": Wand2,
  hair: Scissors,
  spa: Sparkles,
  catering: UtensilsCrossed,
};

/**
 * "Type of service" chips (reference Services tab: nine outlined pills with an icon, wrapping in a 566px panel).
 * Picking the selected chip again clears it.
 */
export function ServiceTypePicker({ value, onChange }: { value: string | undefined; onChange: (next: string | undefined) => void }) {
  return (
    <div role="group" aria-label="Type of service" className="flex flex-wrap gap-2.5">
      {SERVICE_TYPES.map((t) => {
        const Icon = SERVICE_ICONS[t.value];
        const selected = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? undefined : t.value)}
            className={cn(
              "flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-[border-color,background-color,transform] duration-200 ease-standard active:scale-[0.96] focus-ring",
              selected ? "border-foreground bg-grey-100 shadow-[inset_0_0_0_1px_var(--foreground)]" : "border-grey-400 hover:border-foreground",
            )}
          >
            <Icon className="size-4" strokeWidth={1.8} aria-hidden />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function plusDays(d: Date, n: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

/** Today, tomorrow, and this weekend (today through Sunday from Friday on, otherwise the coming Friday–Sunday). */
export function experienceQuickDates() {
  const today = startOfToday();
  const day = today.getDay();
  const friday = day === 5 || day === 6 || day === 0 ? today : plusDays(today, 5 - day);
  const sunday = day === 0 ? today : plusDays(friday, (7 - friday.getDay()) % 7);
  return [
    { key: "today", label: "Today", range: { from: today, to: today } },
    { key: "tomorrow", label: "Tomorrow", range: { from: plusDays(today, 1), to: plusDays(today, 1) } },
    { key: "weekend", label: "This weekend", range: { from: friday, to: sunday } },
  ];
}

const sameDay = (a?: Date, b?: Date) => !!a && !!b && a.getTime() === b.getTime();

/** Reference Experiences "When" panel: three quick-pick cards beside a one-month calendar. */
export function ExperienceQuickDates({
  value,
  onChange,
  className,
}: {
  value: DateRange | undefined;
  onChange: (range: DateRange) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3", className)}>
      {experienceQuickDates().map((q) => {
        const selected = sameDay(value?.from, q.range.from) && sameDay(value?.to, q.range.to);
        const sub = sameDay(q.range.from, q.range.to) ? shortDate(q.range.from) : `${shortDate(q.range.from)} – ${shortDate(q.range.to)}`;
        return (
          <button
            key={q.key}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(q.range)}
            className={cn(
              "rounded-2xl border px-4 py-4 text-left transition-[border-color,background-color,transform] duration-200 ease-standard active:scale-[0.98] focus-ring",
              selected ? "border-foreground bg-grey-100 shadow-[inset_0_0_0_1px_var(--foreground)]" : "border-grey-400 hover:border-foreground",
            )}
          >
            <span className="block text-base leading-5 font-medium">{q.label}</span>
            <span className="mt-1 block text-sm text-muted-foreground">{sub}</span>
          </button>
        );
      })}
    </div>
  );
}
