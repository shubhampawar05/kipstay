"use client";

import { useSearchParams } from "next/navigation";
import { CompactSearch, MobileSearch, SearchBar, type SearchInitial, type SearchPanel } from "@/components/search/search-bar";

export function useSearchInitial(pathname: string): { initial: SearchInitial; key: string } {
  const params = useSearchParams();
  const num = (k: string) => Number(params.get(k)) || 0;
  return {
    initial: {
      location: pathname === "/s" ? (params.get("location") ?? "") : "",
      checkin: params.get("checkin") ?? undefined,
      checkout: params.get("checkout") ?? undefined,
      adults: num("adults"),
      children: num("children"),
      infants: num("infants"),
      pets: num("pets"),
    },
    // Re-mount when the URL changes so the fields reflect the current search.
    key: `${pathname}?${params.toString()}`,
  };
}

export function HeaderBigSearch({
  pathname,
  initialPanel,
  onSubmitted,
  onActiveChange,
}: {
  pathname: string;
  initialPanel?: SearchPanel;
  onSubmitted?: () => void;
  onActiveChange?: (active: boolean) => void;
}) {
  const { initial, key } = useSearchInitial(pathname);
  return <SearchBar key={key + (initialPanel ?? "")} initial={initial} initialPanel={initialPanel} onSubmitted={onSubmitted} onActiveChange={onActiveChange} />;
}

export function HeaderCompactSearch({ pathname, onOpen }: { pathname: string; onOpen: (panel: SearchPanel) => void }) {
  const { initial } = useSearchInitial(pathname);
  return <CompactSearch initial={initial} onOpen={onOpen} />;
}

export function HeaderMobileSearch({ pathname }: { pathname: string }) {
  const { initial, key } = useSearchInitial(pathname);
  return <MobileSearch key={key} initial={initial} />;
}
