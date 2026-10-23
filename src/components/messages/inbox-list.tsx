import Image from "next/image";
import Link from "next/link";
import type { InboxItem } from "@/lib/messages";
import { cn } from "@/lib/utils";
import { rawImage } from "@/lib/photos";

function when(date: Date) {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days < 1) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (days < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Conversation list (reference "Messages" column): listing photo, other person, last message, unread dot. */
export function InboxList({ items, activeId }: { items: InboxItem[]; activeId?: string }) {
  return (
    <ul aria-label="Conversations" className="divide-y divide-grey-300" data-testid="inbox">
      {items.map((c) => (
        <li key={c.id}>
          <Link
            href={`/messages/${c.id}`}
            aria-current={c.id === activeId ? "page" : undefined}
            className={cn(
              "flex gap-3 rounded-xl px-3 py-4 transition-colors duration-200 hover:bg-grey-100 focus-ring",
              c.id === activeId && "bg-grey-200 hover:bg-grey-200",
            )}
          >
            <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-grey-200">
              {c.listingImage && <Image src={c.listingImage} alt="" fill unoptimized={rawImage(c.listingImage)} className="object-cover" sizes="48px" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className={cn("truncate text-sm", c.unread ? "font-semibold" : "font-medium")}>{c.otherName}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{when(c.lastMessageAt)}</span>
              </span>
              <span className={cn("block truncate text-sm", c.unread ? "text-foreground" : "text-muted-foreground")}>{c.lastMessage}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {c.role === "host" ? "Guest · " : ""}
                {c.listingTitle}
              </span>
            </span>
            {c.unread && <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-brand" role="img" aria-label="Unread" data-testid="unread-dot" />}
          </Link>
        </li>
      ))}
    </ul>
  );
}
