"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import type { SearchPanel } from "@/components/search/search-bar";
import { cn } from "@/lib/utils";
import { HeaderBigSearch, HeaderCompactSearch, HeaderMobileSearch } from "./header-search";
import { UserMenu, type MenuUser } from "./user-menu";

const NO_SEARCH = ["/login", "/signup", "/host", "/book", "/account"];
const COLLAPSE_AT = 40;

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > COLLAPSE_AT);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

/**
 * Header behaviour measured on the reference:
 * - 80px tall (96px from 1440px), inline padding 24 / 32 (≥950) / 48 (≥1440), sticky.
 * - Home: a white→#F8F8F8 band with the big search; scrolling collapses it to a compact pill.
 * - Other pages: compact pill; clicking a segment expands the full search over a dimmed page.
 */
export function HeaderShell({ user }: { user: MenuUser }) {
  const pathname = usePathname();
  const scrolled = useScrolled();
  const [forced, setForced] = useState<{ panel: SearchPanel; path: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const showSearch = !NO_SEARCH.some((p) => pathname.startsWith(p));
  const isHome = pathname === "/";
  // A forced expansion belongs to the page it was opened on, so navigating closes it.
  const forcedPanel = forced && forced.path === pathname ? forced.panel : null;
  // Keep the band open while a search panel is in use, even if the page scrolls underneath it.
  const bandOpen = showSearch && isHome && (!scrolled || editing) && !forcedPanel;
  const overlayOpen = showSearch && forcedPanel !== null;

  useEffect(() => {
    if (!overlayOpen) return;
    const close = () => setForced(null);
    const startY = window.scrollY;
    // Focusing a field can nudge the page, so only a deliberate scroll collapses the search again.
    const onScroll = () => Math.abs(window.scrollY - startY) > 60 && close();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [overlayOpen]);

  const rowPadding = "px-6 min-[950px]:px-8 min-[1440px]:px-12";

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b border-grey-300 transition-[background-color] duration-300 ease-standard",
          bandOpen ? "bg-gradient-to-b from-white to-[#f8f8f8]" : "bg-background",
        )}
      >
        {/* Phones: just the search pill, as on the reference. */}
        <div className={cn("flex items-center gap-3 py-3.5 md:hidden", rowPadding, !showSearch && "py-3")}>
          {showSearch ? (
            <Suspense fallback={<div className="kip-shimmer h-14 w-full rounded-full" />}>
              <HeaderMobileSearch pathname={pathname} />
            </Suspense>
          ) : (
            <Logo />
          )}
        </div>

        <div className={cn("relative mx-auto hidden h-20 max-w-[1920px] items-center justify-between gap-4 md:flex min-[1440px]:h-24", rowPadding)}>
          <div className="flex flex-1 items-center">
            <Logo />
          </div>
          <div className="flex min-w-0 shrink justify-center">
            {showSearch && !bandOpen && !overlayOpen && (
              <Suspense>
                <HeaderCompactSearch pathname={pathname} onOpen={(panel) => setForced({ panel, path: pathname })} />
              </Suspense>
            )}
            {overlayOpen && <span className="text-base font-medium">Search stays</span>}
          </div>
          <nav aria-label="Account" className="flex flex-1 items-center justify-end gap-2">
            <Link
              href="/host"
              className="hidden rounded-full px-3 py-[11px] text-sm leading-[18px] font-medium transition-colors duration-200 hover:bg-grey-200 focus-ring min-[1128px]:block"
            >
              {user?.isHost ? "Switch to hosting" : "Become a host"}
            </Link>
            <UserMenu user={user} />
          </nav>
        </div>

        {/* Big search: in the home band, or as an overlay panel when expanded from the compact pill. */}
        {showSearch && (bandOpen || overlayOpen) && (
          <div
            className={cn(
              "hidden justify-center md:flex",
              rowPadding,
              overlayOpen ? "kip-fade-in absolute inset-x-0 top-full border-b border-grey-300 bg-gradient-to-b from-white to-[#f8f8f8] pt-2 pb-8" : "pb-8",
            )}
          >
            <Suspense fallback={<div className="kip-shimmer h-[66px] w-full max-w-[850px] rounded-[32px]" />}>
              <HeaderBigSearch pathname={pathname} initialPanel={forcedPanel ?? undefined} onSubmitted={() => setForced(null)} onActiveChange={setEditing} />
            </Suspense>
          </div>
        )}
      </header>
      {overlayOpen && (
        <div aria-hidden className="kip-fade-in fixed inset-0 z-30 hidden bg-black/25 md:block" onClick={() => setForced(null)} />
      )}
    </>
  );
}
