"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type * as L from "leaflet";

export type MapListing = { id: string; title: string; lat: number; lng: number; price: string; image: string; href: string; subtitle: string };

const HOVER_EVENT = "kip:hover-listing";

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

export function ResultsMap({ listings }: { listings: MapListing[] }) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    let cancelled = false;
    const markers = new Map<string, L.Marker>();
    let onHover: ((e: Event) => void) | null = null;

    (async () => {
      const Leaflet = (await import("leaflet")).default;
      if (cancelled || !el.current) return;
      const map = Leaflet.map(el.current, { zoomControl: false, scrollWheelZoom: true, attributionControl: true });
      mapRef.current = map;
      Leaflet.control.zoom({ position: "topright" }).addTo(map);
      Leaflet.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 18 }).addTo(map);

      const icon = (l: MapListing, active: boolean) =>
        Leaflet.divIcon({ className: "kip-pin-wrap", html: pill(l.price, active), iconSize: null as unknown as L.PointExpression });

      for (const l of listings) {
        const marker = Leaflet.marker([l.lat, l.lng], { icon: icon(l, false), title: `${l.title}, ${l.price}`, keyboard: true, riseOnHover: true })
          .addTo(map)
          .bindPopup(
            `<a class="kip-pop" href="${escapeHtml(l.href)}"><img src="${escapeHtml(l.image)}" alt="" /><span class="kip-pop-body"><strong>${escapeHtml(
              l.subtitle,
            )}</strong><span>${escapeHtml(l.title)}</span><span class="kip-pop-price">${escapeHtml(l.price)}</span></span></a>`,
            { closeButton: true, className: "kip-popup", offset: [0, -8], minWidth: 260, maxWidth: 260 },
          );
        markers.set(l.id, marker);
      }

      if (listings.length) {
        const bounds = Leaflet.latLngBounds(listings.map((l) => [l.lat, l.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13 });
      } else {
        map.setView([20, 0], 2);
      }

      onHover = (e: Event) => {
        const id = (e as CustomEvent<string | null>).detail;
        for (const [key, marker] of markers) {
          const l = listings.find((x) => x.id === key)!;
          marker.setIcon(icon(l, key === id));
          marker.setZIndexOffset(key === id ? 1000 : 0);
        }
      };
      window.addEventListener(HOVER_EVENT, onHover);
    })();

    return () => {
      cancelled = true;
      if (onHover) window.removeEventListener(HOVER_EVENT, onHover);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [listings]);

  return <div ref={el} className="h-full w-full" role="region" aria-label="Map of search results" />;
}
