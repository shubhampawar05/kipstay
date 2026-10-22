import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function pageHref(params: Record<string, string | string[]>, page: number) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (k === "page") continue;
    for (const item of Array.isArray(v) ? v : [v]) sp.append(k, item);
  }
  if (page > 1) sp.set("page", String(page));
  return `/s?${sp.toString()}`;
}

export function Pagination({ page, pageCount, params }: { page: number; pageCount: number; params: Record<string, string | string[]> }) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter((p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1);
  const item = "grid size-9 place-items-center rounded-full text-sm";

  return (
    <nav aria-label="Search results pages" className="flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={pageHref(params, page - 1)} className={cn(item, "hover:bg-muted")} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span className={cn(item, "opacity-30")} aria-hidden>
          <ChevronLeft className="size-4" />
        </span>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-muted-foreground">…</span>}
          {p === page ? (
            <span aria-current="page" className={cn(item, "bg-foreground font-semibold text-background")}>
              {p}
            </span>
          ) : (
            <Link href={pageHref(params, p)} className={cn(item, "hover:bg-muted")} aria-label={`Page ${p} of ${pageCount}`}>
              {p}
            </Link>
          )}
        </span>
      ))}
      {page < pageCount ? (
        <Link href={pageHref(params, page + 1)} className={cn(item, "hover:bg-muted")} aria-label="Next page">
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={cn(item, "opacity-30")} aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
