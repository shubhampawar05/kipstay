"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** "Where you'll be": approximate area only (exact address is shared after booking, as on the reference). */
export function LocationMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current) return;
      map = L.map(el.current, { scrollWheelZoom: false, zoomControl: true }).setView([lat, lng], 13);
      L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 16 }).addTo(map);
      L.circle([lat, lng], { radius: 700, color: "#0f766e", weight: 1, fillColor: "#0f766e", fillOpacity: 0.15 }).addTo(map);
      L.marker([lat, lng], {
        icon: L.divIcon({
          className: "kip-pin-wrap",
          html: '<span class="kip-home-pin" aria-hidden="true"></span>',
          iconSize: [48, 48],
          iconAnchor: [24, 24],
        }),
        title: label,
        keyboard: false,
      }).addTo(map);
    })();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng, label]);

  return <div ref={el} className="h-[480px] w-full overflow-hidden rounded-2xl" role="region" aria-label={`Map showing the approximate area of ${label}`} />;
}
