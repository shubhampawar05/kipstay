"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { List, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { emitListingHover, type MapListing } from "./results-map";

const ResultsMap = dynamic(() => import("./results-map").then((m) => m.ResultsMap), {
  ssr: false,
  loading: () => <div className="kip-shimmer h-full w-full" />,
});

/** Reports card hover to the map so the matching price pin highlights. */
export function HoverTarget({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div onMouseEnter={() => emitListingHover(id)} onMouseLeave={() => emitListingHover(null)} onFocus={() => emitListingHover(id)}>
      {children}
    </div>
  );
}

/**
 * Reference results layout: card list beside a sticky, rounded map (≥1128px). Below that the map is a
 * full-screen view toggled by a floating dark "Show map / Show list" pill.
 */
export function ResultsLayout({ list, mapListings }: { list: React.ReactNode; mapListings: MapListing[] }) {
  const [mapOpen, setMapOpen] = useState(false);
  const wide = useMediaQuery("(min-width: 1128px)");

  return (
    <div className="min-[1128px]:grid min-[1128px]:grid-cols-[minmax(0,1fr)_minmax(0,46%)] min-[1128px]:gap-12">
      <div className={cn(mapOpen && "hidden min-[1128px]:block")}>{list}</div>
      <div
        className={cn(
          "min-[1128px]:sticky min-[1128px]:top-[calc(80px+24px)] min-[1128px]:block min-[1128px]:h-[calc(100dvh-80px-48px)] min-[1440px]:top-[calc(96px+24px)] min-[1440px]:h-[calc(100dvh-96px-48px)]",
          mapOpen ? "fixed inset-x-0 top-[84px] bottom-0 z-20 md:top-20" : "hidden",
        )}
      >
        <div className="h-full overflow-hidden min-[1128px]:rounded-2xl min-[1128px]:shadow-[0_0_0_1px_rgba(0,0,0,0.05)]">
          {(mapOpen || wide) && <ResultsMap listings={mapListings} />}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setMapOpen((o) => !o)}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-5 py-3.5 text-sm font-semibold text-background shadow-elev-2 transition-transform duration-200 ease-standard hover:scale-[1.04] active:scale-[0.96] focus-ring md:bottom-8 min-[1128px]:hidden"
      >
        {mapOpen ? (
          <>
            Show list <List className="size-4" />
          </>
        ) : (
          <>
            Show map <MapIcon className="size-4" />
          </>
        )}
      </button>
    </div>
  );
}
