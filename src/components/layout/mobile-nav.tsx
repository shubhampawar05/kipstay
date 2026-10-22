"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, Luggage, Search, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

/** Bottom tab bar for phones (hidden from md up, where the header menu takes over). */
export function MobileNav({ signedIn, isHost }: { signedIn: boolean; isHost: boolean }) {
  const pathname = usePathname();
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
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-md justify-around">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 text-[11px] font-medium",
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
