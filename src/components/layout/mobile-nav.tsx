"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Luggage, MessageSquare, Search, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCT_TAB_PATHS } from "./product-tabs";

/**
 * Reference phone behaviour: the tab bar slides away while scrolling down and returns on any upward scroll or near
 * the top of the page. Reads scrollY at most once per frame.
 */
function useHideOnScroll() {
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);
  const frame = useRef(0);
  useEffect(() => {
    last.current = window.scrollY;
    const onScroll = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        const y = window.scrollY;
        const delta = y - last.current;
        if (Math.abs(delta) < 8) return;
        setHidden(delta > 0 && y > 120);
        last.current = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame.current);
    };
  }, []);
  return hidden;
}

/** Bottom tab bar for phones (hidden from md up, where the header menu takes over). */
export function MobileNav({ signedIn, unread }: { signedIn: boolean; unread: number }) {
  const pathname = usePathname();
  const scrolledAway = useHideOnScroll();
  // Listing pages have their own fixed reserve bar in this spot.
  const hidden = scrolledAway || pathname.startsWith("/rooms/");
  const items = [
    { href: "/", label: "Explore", icon: Search, match: (p: string) => PRODUCT_TAB_PATHS.includes(p) || p.startsWith("/s") },
    { href: "/wishlists", label: "Wishlists", icon: Heart, match: (p: string) => p.startsWith("/wishlists") },
    ...(signedIn
      ? [
          { href: "/trips", label: "Trips", icon: Luggage, match: (p: string) => p.startsWith("/trips") },
          // Reference guest tabs: Explore, Wishlists, Trips, Messages, Profile (hosting is reached from Profile).
          { href: "/messages", label: "Messages", icon: MessageSquare, match: (p: string) => p.startsWith("/messages"), badge: unread },
          { href: "/account", label: "Profile", icon: UserRound, match: (p: string) => p.startsWith("/account") },
        ]
      : [{ href: "/login", label: "Log in", icon: UserRound, match: (p: string) => p.startsWith("/login") }]),
  ];

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-standard md:hidden",
        hidden && "translate-y-full",
      )}
    >
      <ul className="mx-auto flex max-w-md justify-around">
        {items.map(({ href, label, icon: Icon, match, ...item }) => {
          const active = match(pathname);
          const badge = "badge" in item ? item.badge : 0;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                tabIndex={hidden ? -1 : undefined}
                className={cn(
                  "flex min-h-12 min-w-12 flex-col items-center gap-1 px-3 py-2 text-[11px] font-medium transition-colors duration-200 focus-ring",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="size-6" strokeWidth={active ? 2.4 : 1.8} />
                  {!!badge && <span aria-hidden className="absolute -top-0.5 -right-1 size-2.5 rounded-full border-2 border-background bg-brand" />}
                </span>
                {label}
                {!!badge && <span className="sr-only">, {badge} unread</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
