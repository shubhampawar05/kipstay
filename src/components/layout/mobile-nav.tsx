"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, Luggage, Search, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

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
export function MobileNav({ signedIn, isHost }: { signedIn: boolean; isHost: boolean }) {
  const pathname = usePathname();
  const scrolledAway = useHideOnScroll();
  // Listing pages have their own fixed reserve bar in this spot.
  const hidden = scrolledAway || pathname.startsWith("/rooms/");
  const items = [
    { href: "/", label: "Explore", icon: Search, match: (p: string) => p === "/" || p.startsWith("/s") },
    { href: "/wishlists", label: "Wishlists", icon: Heart, match: (p: string) => p.startsWith("/wishlists") },
    ...(signedIn
      ? [
          { href: "/trips", label: "Trips", icon: Luggage, match: (p: string) => p.startsWith("/trips") },
          { href: "/host", label: isHost ? "Hosting" : "Host", icon: Home, match: (p: string) => p.startsWith("/host") },
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
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
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
                <Icon className="size-6" strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
