"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { MobileSearch, SearchBar, type SearchInitial } from "@/components/search/search-bar";

const HIDDEN_ON = ["/login", "/signup", "/host", "/book"];

function readInitial(params: URLSearchParams, pathname: string): SearchInitial {
  // Detail pages carry stay dates as check_in/check_out-style params too.
  const num = (k: string) => Number(params.get(k)) || 0;
  return {
    location: pathname === "/s" ? (params.get("location") ?? "") : "",
    checkin: params.get("checkin") ?? undefined,
    checkout: params.get("checkout") ?? undefined,
    adults: num("adults"),
    children: num("children"),
    infants: num("infants"),
    pets: num("pets"),
  };
}

export function HeaderSearch({ variant }: { variant: "desktop" | "mobile" }) {
  const pathname = usePathname();
  const params = useSearchParams();
  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;
  const initial = readInitial(params, pathname);
  // Re-mount when the URL changes so the fields reflect the current search.
  const key = `${pathname}?${params.toString()}`;
  return variant === "desktop" ? <SearchBar key={key} initial={initial} /> : <MobileSearch key={key} initial={initial} />;
}
