import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Header product tabs (reference: All / Homes / Experiences / Services as links to /, /homes, /experiences and
 * /services, each with an illustrated icon that animates on hover and a dark underline under the current one).
 * Kipstay only has homes so far: Experiences and Services carry a "Soon" badge and open a coming-soon page.
 */
export const PRODUCT_TABS = [
  { href: "/", label: "All", icon: AllIcon },
  { href: "/homes", label: "Homes", icon: HomesIcon },
  { href: "/experiences", label: "Experiences", icon: ExperiencesIcon, soon: true },
  { href: "/services", label: "Services", icon: ServicesIcon, soon: true },
] as const;

export const PRODUCT_TAB_PATHS: string[] = PRODUCT_TABS.map((t) => t.href);

export function ProductTabs({ pathname, variant = "desktop" }: { pathname: string; variant?: "desktop" | "mobile" }) {
  const mobile = variant === "mobile";
  return (
    <nav aria-label="Browse Kipstay" className={cn("flex", mobile ? "w-full justify-between" : "h-14 items-stretch gap-5 min-[1128px]:gap-10")}>
      {PRODUCT_TABS.map(({ href, label, icon: Icon, ...tab }) => {
        const current = pathname === href;
        const soon = "soon" in tab && tab.soon;
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            aria-label={soon ? `${label} (coming soon)` : label}
            data-testid={`product-tab-${label.toLowerCase()}`}
            className={cn(
              "group/tab relative flex items-center rounded-lg outline-none focus-visible:shadow-[var(--focus-ring)]",
              mobile ? "flex-1 flex-col gap-1 pt-1 pb-2.5" : "gap-2 px-1",
              current ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="relative shrink-0">
              <Icon
                className={cn(
                  "transition-transform duration-300 ease-standard motion-reduce:transition-none",
                  mobile ? "size-9" : "size-10 min-[1128px]:size-12",
                  // Hover: a small lift and tilt, standing in for the reference's animated icons.
                  "group-hover/tab:-translate-y-0.5 group-hover/tab:scale-110 group-hover/tab:-rotate-3 group-active/tab:scale-95",
                )}
              />
              {soon && (
                <span className="absolute -top-1 -right-3 rounded-full bg-[#1f2b47] px-1.5 py-[3px] text-[9px] leading-none font-bold tracking-wide text-white uppercase shadow-elev-1">
                  Soon
                </span>
              )}
            </span>
            <span className={cn("font-medium whitespace-nowrap", mobile ? "text-xs" : "text-base", current && "font-semibold")}>{label}</span>
            {/* Underline: 3px, full tab width, under the current tab only. */}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-foreground transition-[opacity,transform] duration-300 ease-standard",
                mobile && "inset-x-3",
                current ? "scale-x-100 opacity-100" : "scale-x-50 opacity-0",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}

// Original illustrations, drawn on a 48×48 grid. Solid fills only: the tabs render twice (phone and desktop) and a
// gradient defined inside the hidden copy would leave the visible copy unpainted.

export function AllIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path d="M6 13l11-5 14 5 11-5v27l-11 5-14-5-11 5z" fill="#9fdcc9" />
      <path d="M17 8v27M31 13v27" stroke="#5aa894" strokeWidth="1.5" />
      <path d="M9 30c5-2 7 3 12 1s6-6 11-4 6 3 8 2" fill="none" stroke="#f4f1e8" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 3.5" />
      <path d="M24 5c-4.4 0-8 3.4-8 7.7 0 5.6 8 13.3 8 13.3s8-7.7 8-13.3C32 8.4 28.4 5 24 5z" fill="#e8554e" />
      <circle cx="24" cy="12.6" r="3.2" fill="#fff" />
    </svg>
  );
}

export function HomesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <ellipse cx="24" cy="42" rx="18" ry="3" fill="#9fd39b" />
      <path d="M10 23h28v19H10z" fill="#f7e6c8" />
      <path d="M5 25L24 8l19 17" fill="none" stroke="#2f6f63" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M31 11h5v8l-5-4.5z" fill="#2f6f63" />
      <path d="M20 31h8v11h-8z" fill="#c8664a" />
      <circle cx="26" cy="37" r="0.9" fill="#f6d28b" />
      <path d="M13 28h5v5h-5zM30 28h5v5h-5z" fill="#8ccbe6" />
    </svg>
  );
}

export function ExperiencesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path d="M24 3l14 14-14 17-14-17z" fill="#ff9a4d" />
      <path d="M24 3v31M10 17h28" stroke="#fff3e0" strokeWidth="1.6" />
      <path d="M24 34c-2 4 3 5 1 9" fill="none" stroke="#6b7a8f" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M22 37l-3 1.5 3 1.5zM27 41l3-1.5-3-1.5z" fill="#5fb7a3" />
      <path d="M21 43l-3 1.5 3 1.5z" fill="#e8554e" />
    </svg>
  );
}

export function ServicesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path d="M14 27c-5 0-8-3.6-8-7.6S9.6 12 14 12.6C15 7.8 19 5 24 5s9 2.8 10 7.6c4.4-.6 8 2.8 8 6.8s-3 7.6-8 7.6z" fill="#eef1f6" stroke="#8e9aab" strokeWidth="1.2" />
      <path d="M14 27h20v10a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3z" fill="#eef1f6" stroke="#8e9aab" strokeWidth="1.2" />
      <path d="M14 33h20" stroke="#e8554e" strokeWidth="3" />
      <path d="M19 27v-4M24 27v-5M29 27v-4" stroke="#8e9aab" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
