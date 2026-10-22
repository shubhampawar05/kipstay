"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type InspirationTab = { label: string; links: { label: string; sublabel: string; href: string }[] };

/** "Inspiration for future getaways" tab set (reference footer pattern), fed with real destinations. */
export function InspirationTabs({ tabs }: { tabs: InspirationTab[] }) {
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const base = useId();
  const tab = tabs[active];
  if (!tab) return null;
  const visible = expanded ? tab.links : tab.links.slice(0, 17);

  return (
    <section aria-labelledby={`${base}-h`} className="page-gutter pt-12">
      <h2 id={`${base}-h`} className="text-[22px] leading-[26px] font-semibold">
        Inspiration for future getaways
      </h2>
      <div role="tablist" aria-label="Inspiration" className="scrollbar-none mt-2 flex gap-8 overflow-x-auto border-b border-grey-400">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            role="tab"
            id={`${base}-t${i}`}
            aria-selected={i === active}
            aria-controls={`${base}-p`}
            onClick={() => {
              setActive(i);
              setExpanded(false);
            }}
            className={cn(
              "-mb-px shrink-0 border-b-2 py-3 text-sm font-medium transition-colors duration-200",
              i === active ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ul id={`${base}-p`} role="tabpanel" aria-labelledby={`${base}-t${active}`} className="kip-fade-in grid grid-cols-2 gap-x-6 gap-y-5 py-8 md:grid-cols-3 lg:grid-cols-6">
        {visible.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="block rounded-md text-sm focus-ring">
              <span className="block font-medium">{l.label}</span>
              <span className="block text-muted-foreground">{l.sublabel}</span>
            </Link>
          </li>
        ))}
        {!expanded && tab.links.length > visible.length && (
          <li>
            <button type="button" onClick={() => setExpanded(true)} className="text-sm font-medium underline focus-ring">
              Show more
            </button>
          </li>
        )}
      </ul>
    </section>
  );
}
