"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import type { SearchPanel } from "@/components/search/search-bar";
import { cn } from "@/lib/utils";
import { HeaderBigSearch, HeaderCompactSearch, HeaderMobileSearch } from "./header-search";
import { UserMenu, type MenuUser } from "./user-menu";

const NO_SEARCH = ["/login", "/signup", "/host", "/book", "/account"];

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

/**
 * True once `target` has scrolled up under the sticky header bar. Observed rather than derived from scrollY, and the
 * band never changes height, so the switch can't feed back into the scroll position (the old height collapse made
 * Chrome's scroll anchoring bounce the page and the header flicker between states).
 */
function useHiddenUnderHeader(target: React.RefObject<HTMLElement | null>, enabled: boolean) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const el = target.current;
    if (!enabled || !el) return;
    const io = new IntersectionObserver(([entry]) => setHidden(!entry.isIntersecting), { rootMargin: "-96px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [target, enabled]);
  return enabled && hidden;
}

/**
 * Header behaviour measured on the reference:
 * - 80px tall (96px from 1440px), inline padding 24 / 32 (≥950) / 48 (≥1440), sticky. The bar's height never changes.
 * - Home: a white→#F8F8F8 band with the big search sits in the page flow below the bar and scrolls away under it;
 *   once the big pill is under the bar, the compact pill fades in.
 * - Other pages: compact pill; clicking a segment expands the full search over a dimmed page.
 */
export function HeaderShell({ user }: { user: MenuUser }) {
  const pathname = usePathname();
  const scrolled = useScrolled();
  const [forced, setForced] = useState<{ panel: SearchPanel; path: string } | null>(null);
  const showSearch = !NO_SEARCH.some((p) => pathname.startsWith(p));
  const isHome = pathname === "/";
  const hosting = pathname.startsWith("/host");
  const isListing = pathname.startsWith("/rooms/");
  const hasBand = showSearch && isHome;
  const bigPill = useRef<HTMLDivElement>(null);
  const bandHidden = useHiddenUnderHeader(bigPill, hasBand);
  // A forced expansion belongs to the page (and, on home, the scrolled state) it was opened in.
  const forcedPanel = forced && forced.path === pathname && (!hasBand || bandHidden) ? forced.panel : null;
  const overlayOpen = showSearch && forcedPanel !== null;
  const compactVisible = showSearch && !overlayOpen && (!hasBand || bandHidden);
  const elevated = hasBand ? bandHidden : scrolled;

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
          "sticky top-0 z-40 border-b bg-background transition-[border-color,box-shadow] duration-300 ease-standard",
          // On home the bar blends into the band below it until the band has scrolled away.
          hasBand && !bandHidden ? "border-grey-300 md:border-transparent" : "border-grey-300",
          isListing && "max-md:border-b-0",
          // Shadow only (no size change), so the sticky header never shifts layout.
          elevated && !overlayOpen && "shadow-[0_1px_12px_rgba(0,0,0,0.08)]",
        )}
      >
        {/* Phones: just the search pill, as on the reference. Listing pages go edge to edge with their own back bar. */}
        <div className={cn("flex items-center gap-3 py-3.5 md:hidden", rowPadding, !showSearch && "py-3", isListing && "hidden")}>
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
          <div className="relative flex min-w-0 shrink justify-center">
            {showSearch && (
              // Always mounted on search pages, so showing it is a crossfade rather than a mount that pops in.
              <div
                inert={!compactVisible}
                aria-hidden={!compactVisible}
                className={cn(
                  "transition-[opacity,transform] duration-250 ease-standard",
                  compactVisible ? "opacity-100" : "pointer-events-none translate-y-2 scale-95 opacity-0",
                )}
              >
                <Suspense>
                  <HeaderCompactSearch pathname={pathname} onOpen={(panel) => setForced({ panel, path: pathname })} />
                </Suspense>
              </div>
            )}
            {overlayOpen && (
              <span className="kip-fade-in absolute inset-0 grid place-items-center text-base font-medium whitespace-nowrap">Search stays</span>
            )}
          </div>
          <nav aria-label="Account" className="flex flex-1 items-center justify-end gap-2">
            <Link
              href={hosting ? "/" : "/host"}
              className="hidden rounded-full px-3 py-[11px] text-sm leading-[18px] font-medium transition-colors duration-200 hover:bg-grey-200 focus-ring min-[1128px]:block"
            >
              {hosting ? "Switch to travelling" : user?.isHost ? "Switch to hosting" : "Become a host"}
            </Link>
            <UserMenu user={user} />
          </nav>
        </div>

        {/* Big search expanded from the compact pill: an overlay panel under the bar. */}
        {overlayOpen && (
          <div
            className={cn(
              "kip-fade-in absolute inset-x-0 top-full hidden justify-center border-b border-grey-300 bg-gradient-to-b from-white to-[#f8f8f8] pt-2 pb-8 md:flex",
              rowPadding,
            )}
          >
            <Suspense fallback={<div className="kip-shimmer h-[66px] w-full max-w-[850px] rounded-[32px]" />}>
              <HeaderBigSearch pathname={pathname} initialPanel={forcedPanel ?? undefined} onSubmitted={() => setForced(null)} />
            </Suspense>
          </div>
        )}
      </header>

      {/* Home band: normal page flow under the sticky bar, so scrolling it away never changes the page height. */}
      {hasBand && (
        <div className={cn("hidden justify-center border-b border-grey-300 bg-gradient-to-b from-white to-[#f8f8f8] pb-8 md:flex", rowPadding)}>
          {/* Inert while under the bar: an off-screen copy of the search shouldn't take focus or duplicate the
              compact pill's expanded search for assistive tech. */}
          <div ref={bigPill} inert={bandHidden} aria-hidden={bandHidden} className="flex w-full max-w-[850px] justify-center">
            <Suspense fallback={<div className="kip-shimmer h-[66px] w-full max-w-[850px] rounded-[32px]" />}>
              <HeaderBigSearch pathname={pathname} collapsed={bandHidden} />
            </Suspense>
          </div>
        </div>
      )}

      {overlayOpen && <div aria-hidden className="kip-fade-in fixed inset-0 z-30 hidden bg-black/25 md:block" onClick={() => setForced(null)} />}
    </>
  );
}
