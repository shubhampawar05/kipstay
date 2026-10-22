"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Destination = { city: string; country: string; count: number };

/** Accessible combobox: popular destinations on focus, database-backed suggestions while typing. */
export function DestinationInput({
  value,
  onChange,
  onSelect,
  className,
  inputClassName,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Destination[]>([]);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

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
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function choose(d: Destination) {
    const label = `${d.city}, ${d.country}`;
    onChange(label);
    setOpen(false);
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
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
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
            className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            onClick={() => {
              onChange("");
              setOpen(true);
            }}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      {open && options.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-4 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border bg-popover p-2 shadow-xl">
          <p className="px-3 pt-2 pb-1 text-xs font-medium text-muted-foreground">
            {value ? "Matching destinations" : "Popular destinations"}
          </p>
          <ul id={listId} role="listbox" aria-label="Destination suggestions">
            {options.map((d, i) => (
              <li
                key={`${d.city}-${d.country}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(d)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5",
                  i === active ? "bg-muted" : "hover:bg-muted",
                )}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary">
                  <MapPin className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {d.city}, {d.country}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {d.count} stay{d.count === 1 ? "" : "s"}
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
