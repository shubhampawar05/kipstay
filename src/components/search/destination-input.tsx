"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MapPin, Navigation, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Destination = { city: string; country: string; count: number };

// Tile tints for the suggestion icons (the reference uses a coloured 48px tile per destination).
const TINTS = ["bg-teal-50 text-teal-700", "bg-amber-50 text-amber-700", "bg-sky-50 text-sky-700", "bg-rose-50 text-rose-700", "bg-violet-50 text-violet-700", "bg-emerald-50 text-emerald-700"];

/** Accessible combobox: popular destinations on focus, database-backed suggestions while typing. */
export function DestinationInput({
  value,
  onChange,
  onSelect,
  onClose,
  className,
  inputClassName,
  panelClassName,
  autoFocus,
  inline,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  onClose?: () => void;
  className?: string;
  inputClassName?: string;
  panelClassName?: string;
  autoFocus?: boolean;
  /** Render suggestions in the document flow (phone search sheet) instead of a floating panel. */
  inline?: boolean;
}) {
  const listId = useId();
  const [open, setOpenState] = useState(false);
  const [options, setOptions] = useState<Destination[]>([]);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  function setOpen(next: boolean) {
    setOpenState(next);
    if (!next) onClose?.();
  }

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/destinations?q=${encodeURIComponent(value)}`, { signal: controller.signal });
        if (res.ok) {
          setOptions((await res.json()).destinations);
          setActive(-1);
        }
      } catch {
        // Aborted or offline: keep the previous suggestions.
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, open]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (open && !wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  });

  function choose(d: Destination) {
    const label = `${d.city}, ${d.country}`;
    onChange(label);
    setOpenState(false);
    onSelect?.(label);
  }

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <div className="flex items-center">
        <input
          type="search"
          name="location"
          role="combobox"
          aria-expanded={open && options.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-label="Where"
          placeholder="Search destinations"
          autoComplete="off"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpenState(true);
          }}
          onFocus={() => setOpenState(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpenState(true);
              setActive((a) => Math.min(options.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(-1, a - 1));
            } else if (e.key === "Enter" && open && active >= 0 && options[active]) {
              e.preventDefault();
              choose(options[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className={cn(
            "w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden",
            inputClassName,
          )}
        />
        {value && (
          <button
            type="button"
            aria-label="Clear destination"
            className="grid size-6 shrink-0 place-items-center rounded-full bg-grey-200 text-foreground hover:bg-grey-300"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setOpenState(true);
            }}
          >
            <X className="size-3" strokeWidth={3} />
          </button>
        )}
      </div>
      {open && options.length > 0 && (
        <div
          className={cn(
            inline
              ? "kip-fade-in -mx-4 mt-3 border-t border-grey-300 pt-3"
              : "kip-panel absolute top-full left-0 z-50 mt-4 max-h-[min(540px,70vh)] w-[min(425px,calc(100vw-2rem))] overflow-y-auto rounded-[32px] bg-popover py-6 shadow-elev-4",
            panelClassName,
          )}
        >
          <p className={cn("pb-2 text-xs font-medium text-foreground", inline ? "px-4" : "px-8")}>{value ? "Matching destinations" : "Suggested destinations"}</p>
          <ul id={listId} role="listbox" aria-label="Destination suggestions">
            {options.map((d, i) => (
              <li
                key={`${d.city}-${d.country}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(d)}
                className={cn("flex cursor-pointer items-center gap-4 py-2 transition-colors", inline ? "px-4" : "px-8", i === active ? "bg-grey-100" : "hover:bg-grey-100")}
              >
                <span className={cn("grid size-12 shrink-0 place-items-center rounded-xl", TINTS[i % TINTS.length])}>
                  {i === 0 && !value ? <Navigation className="size-5" /> : <MapPin className="size-5" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {d.city}, {d.country}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {i === 0 && !value ? "Most stays on Kipstay" : `${d.count} stay${d.count === 1 ? "" : "s"}`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
