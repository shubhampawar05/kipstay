import Link from "next/link";
import { Building2, LayoutGrid, Mountain, Palmtree, Sailboat, Sun, Trees, Waves, type LucideIcon } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = { LayoutGrid, Waves, Mountain, Building2, Trees, Sailboat, Sun, Palmtree };

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

  // Desktop: underlined icon tabs (14/18 medium, 2px underline, ~35px gaps as measured on the reference tab row).
  // Phones: pill chips, as on the reference's mobile home.
  const items = [{ value: undefined, label: "All", icon: "LayoutGrid" }, ...CATEGORIES];
  return (
    <nav aria-label="Categories" className="scrollbar-none -mx-6 flex gap-2 overflow-x-auto px-6 py-3 min-[744px]:mx-0 min-[744px]:gap-8 min-[744px]:px-0 min-[744px]:py-0">
      {items.map(({ value, label, icon }) => {
        const Icon = ICONS[icon];
        const isActive = value ? active === value : !active;
        return (
          <Link
            key={label}
            href={value ? (isActive ? href() : href(value)) : href()}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-[color,border-color,box-shadow,transform] duration-200 ease-standard active:scale-[0.97] focus-ring",
              "min-[744px]:flex-col min-[744px]:gap-2 min-[744px]:rounded-none min-[744px]:border-0 min-[744px]:border-b-2 min-[744px]:px-0 min-[744px]:pt-3 min-[744px]:pb-2.5 min-[744px]:text-xs min-[744px]:active:scale-100",
              isActive
                ? "border-foreground bg-grey-100 text-foreground shadow-elev-1 min-[744px]:bg-transparent min-[744px]:shadow-none"
                : "border-grey-400 text-muted-foreground hover:text-foreground min-[744px]:border-transparent min-[744px]:hover:border-grey-500",
            )}
          >
            <Icon className={cn("size-5 transition-opacity min-[744px]:size-6", isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100")} strokeWidth={1.6} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
