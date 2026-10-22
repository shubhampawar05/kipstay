"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import "leaflet/dist/leaflet.css";
import type * as L from "leaflet";
import { Loader2, Maximize2, Minimize2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type MapListing = { id: string; title: string; lat: number; lng: number; price: string; image: string; href: string; subtitle: string };

const HOVER_EVENT = "kip:hover-listing";
const SEARCH_DELAY_MS = 450;

/** Cards announce hover so the matching map pin can highlight (reference behaviour). */
export function emitListingHover(id: string | null) {
  window.dispatchEvent(new CustomEvent(HOVER_EVENT, { detail: id }));
}

// OpenStreetMap tiles need no API key; set NEXT_PUBLIC_MAP_TILE_URL to use your own tile provider in production.
const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function pill(price: string, active: boolean) {
  return `<span class="kip-pin${active ? " kip-pin-active" : ""}">${escapeHtml(price)}</span>`;
}

const round = (n: number) => Math.round(n * 10000) / 10000;

/**
 * Results map: price pins that highlight with card hover, popups, and the reference's map search: moving the map
 * re-runs the search for the visible area (`bbox` in the URL), or offers "Search this area" when auto-search is off.
 * The Leaflet map is created once; markers update in place, and the view only re-fits for a new (non-map) search.
 */
export function ResultsMap({
  listings,
  mapArea,
  expanded,
  onToggleExpanded,
}: {
  listings: MapListing[];
  /** The current results came from a map search, so keep the user's view instead of fitting to the pins. */
  mapArea: boolean;
  expanded?: boolean;
  onToggleExpanded?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef(new Map<string, { marker: L.Marker; listing: MapListing }>());
  // Set by real input (drag, wheel, double-click, zoom buttons, keys); fitting, resizing and popups don't search.
  const userMoving = useRef(false);
  const [ready, setReady] = useState(false);
  const [autoSearch, setAutoSearch] = useState(true);
  const [moved, setMoved] = useState(false);
  const [searching, setSearching] = useState(false);
  const latest = useRef({ autoSearch, params, pathname });
  useEffect(() => {
    latest.current = { autoSearch, params, pathname };
  });

  function searchArea() {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    const next = new URLSearchParams(latest.current.params);
    next.set("bbox", [b.getSouth(), Math.max(-180, b.getWest()), b.getNorth(), Math.min(180, b.getEast())].map(round).join(","));
    next.delete("location");
    next.delete("page");
    setMoved(false);
    setSearching(true);
    // The first map search is a new history entry (Back returns to the text search); later pans replace it.
    const href = `${latest.current.pathname}?${next}`;
    if (latest.current.params.has("bbox")) router.replace(href, { scroll: false });
    else router.push(href, { scroll: false });
  }
  const searchAreaRef = useRef(searchArea);
  useEffect(() => {
    searchAreaRef.current = searchArea;
  });

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let resize: ResizeObserver | undefined;
    (async () => {
      const Leaflet = (await import("leaflet")).default;
      if (cancelled || !el.current) return;
      leafletRef.current = Leaflet;
      const map = Leaflet.map(el.current, { zoomControl: false, scrollWheelZoom: true, attributionControl: true });
      mapRef.current = map;
      Leaflet.control.zoom({ position: "topright" }).addTo(map);
      Leaflet.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 18 }).addTo(map);
      layerRef.current = Leaflet.layerGroup().addTo(map);
      map.setView([20, 0], 2);
      const intent = () => {
        userMoving.current = true;
      };
      map.on("dragstart", intent);
      el.current.addEventListener("wheel", intent, { passive: true });
      el.current.addEventListener("dblclick", intent);
      el.current.addEventListener("keydown", intent);
      el.current.querySelector(".leaflet-control-zoom")?.addEventListener("click", intent);
      map.on("moveend", () => {
        if (!userMoving.current) return;
        userMoving.current = false;
        clearTimeout(timer);
        if (latest.current.autoSearch) timer = setTimeout(() => searchAreaRef.current(), SEARCH_DELAY_MS);
        else setMoved(true);
      });
      map.on("movestart", () => clearTimeout(timer));
      // The container changes size when the map is expanded or the window resizes.
      resize = new ResizeObserver(() => map.invalidateSize());
      resize.observe(el.current);
      setReady(true);
    })();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      resize?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync markers with the current results.
  useEffect(() => {
    const Leaflet = leafletRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!ready || !Leaflet || !map || !layer) return;
    layer.clearLayers();
    markersRef.current.clear();
    const icon = (l: MapListing, active: boolean) =>
      Leaflet.divIcon({ className: "kip-pin-wrap", html: pill(l.price, active), iconSize: null as unknown as L.PointExpression });
    for (const l of listings) {
      const marker = Leaflet.marker([l.lat, l.lng], {
        icon: icon(l, false),
        title: `${l.title}, ${l.price}`,
        keyboard: true,
        riseOnHover: true,
      }).bindPopup(
        `<a class="kip-pop" href="${escapeHtml(l.href)}"><img src="${escapeHtml(l.image)}" alt="" /><span class="kip-pop-body"><strong>${escapeHtml(
          l.subtitle,
        )}</strong><span>${escapeHtml(l.title)}</span><span class="kip-pop-price">${escapeHtml(l.price)}</span></span></a>`,
        { closeButton: true, className: "kip-popup", offset: [0, -8], minWidth: 260, maxWidth: 260 },
      );
      marker.addTo(layer);
      markersRef.current.set(l.id, { marker, listing: l });
    }
    const timer = setTimeout(() => setSearching(false), 0);

    const bbox = params.get("bbox")?.split(",").map(Number);
    if (mapArea && bbox?.length === 4) {
      // Map search: only move the map if this view didn't produce it (e.g. a shared link or back navigation).
      const target = Leaflet.latLngBounds([bbox[0], bbox[1]], [bbox[2], bbox[3]]);
      if (!map.getBounds().contains(target.getCenter()) || map.getZoom() < 3) map.fitBounds(target);
    } else if (listings.length) {
      map.invalidateSize();
      map.fitBounds(Leaflet.latLngBounds(listings.map((l) => [l.lat, l.lng] as [number, number])), { padding: [48, 48], maxZoom: 13 });
    }

    const onHover = (e: Event) => {
      const id = (e as CustomEvent<string | null>).detail;
      for (const [key, { marker, listing }] of markersRef.current) {
        marker.setIcon(icon(listing, key === id));
        marker.setZIndexOffset(key === id ? 1000 : 0);
      }
    };
    window.addEventListener(HOVER_EVENT, onHover);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(HOVER_EVENT, onHover);
    };
    // Re-run for new results only; params are read for the current bbox at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, listings, mapArea]);

  const control =
    "pointer-events-auto rounded-full bg-background shadow-elev-2 transition-[transform,box-shadow] duration-200 ease-standard hover:shadow-elev-3 active:scale-[0.97] focus-ring";

  return (
    <div className="relative h-full w-full">
      <div ref={el} className="h-full w-full" role="region" aria-label="Map of search results" data-testid="results-map" />
      <div className="pointer-events-none absolute inset-x-0 top-4 z-[1000] flex justify-center px-16">
        {moved && !autoSearch ? (
          <button
            type="button"
            onClick={searchArea}
            className={cn(control, "kip-fade-in flex items-center gap-2 bg-foreground px-4 py-2.5 text-sm font-semibold text-background")}
          >
            <Search className="size-4" strokeWidth={2.5} /> Search this area
          </button>
        ) : (
          <label className={cn(control, "flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm font-semibold")}>
            {searching ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <input type="checkbox" className="size-4 accent-foreground" checked={autoSearch} onChange={(e) => setAutoSearch(e.target.checked)} />
            )}
            {searching ? "Searching…" : "Search as I move the map"}
          </label>
        )}
      </div>
      {onToggleExpanded && (
        <button
          type="button"
          onClick={onToggleExpanded}
          aria-pressed={!!expanded}
          aria-label={expanded ? "Show list" : "Expand map"}
          className={cn(control, "absolute top-4 left-4 z-[1000] hidden size-10 place-items-center min-[1128px]:grid")}
        >
          {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </button>
      )}
    </div>
  );
}
