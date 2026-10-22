import Link from "next/link";
import { Building2, Mountain, Palmtree, Sailboat, Sun, Trees, Waves, type LucideIcon } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = { Waves, Mountain, Building2, Trees, Sailboat, Sun, Palmtree };

/** Horizontally scrolling category tabs. `params` are preserved when switching category. */
export function CategoryBar({ active, params = {} }: { active?: string; params?: Record<string, string | string[]> }) {
  function href(category?: string) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (k === "category" || k === "page") continue;
      for (const item of Array.isArray(v) ? v : [v]) sp.append(k, item);
    }
    if (category) sp.set("category", category);
    const s = sp.toString();
    return s ? `/s?${s}` : "/s";
  }

  return (
    <nav aria-label="Categories" className="scrollbar-none -mx-4 flex gap-8 overflow-x-auto px-4 md:mx-0 md:px-0">
      {CATEGORIES.map(({ value, label, icon }) => {
        const Icon = ICONS[icon];
        const isActive = active === value;
        return (
          <Link
            key={value}
            href={isActive ? href() : href(value)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex shrink-0 flex-col items-center gap-2 border-b-2 pt-2 pb-3 text-xs font-medium transition-colors",
              isActive ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground",
            )}
          >
            <Icon className="size-6" strokeWidth={1.6} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
