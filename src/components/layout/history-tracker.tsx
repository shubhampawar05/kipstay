"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// document.referrer doesn't change on client-side navigations, so count route changes in this tab instead.
let lastPath: string | null = null;
let routeChanges = 0;

/** True when the previous history entry is a page of this app (so router.back() stays on the site). */
export function canGoBackInApp() {
  return routeChanges > 0 || document.referrer.startsWith(window.location.origin);
}

/** Mounted once in the root layout. */
export function HistoryTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (lastPath !== null && lastPath !== pathname) routeChanges++;
    lastPath = pathname;
  }, [pathname]);
  return null;
}
