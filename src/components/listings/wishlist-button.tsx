"use client";

import { useOptimistic, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleWishlist } from "@/app/actions/wishlist";
import { cn } from "@/lib/utils";

export function WishlistButton({
  listingId,
  title,
  saved,
  variant = "overlay",
}: {
  listingId: string;
  title: string;
  saved: boolean;
  variant?: "overlay" | "inline";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [optimistic, setOptimistic] = useOptimistic(saved);
  const [pending, startTransition] = useTransition();

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    startTransition(async () => {
      setOptimistic(!optimistic);
      const result = await toggleWishlist(listingId);
      if (!result.ok) {
        if (result.reason === "auth") {
          const here = `${pathname}${params.size ? `?${params}` : ""}`;
          toast("Log in to save places to your wishlist");
          router.push(`/login?next=${encodeURIComponent(here)}`);
        } else {
          toast.error("This listing is no longer available.");
        }
        return;
      }
      toast(result.saved ? `Saved ${title}` : `Removed ${title} from your wishlist`);
      router.refresh();
    });
  }

  const label = `${optimistic ? "Remove from" : "Add to"} wishlist: ${title}`;

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={optimistic}
        aria-label={label}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium underline underline-offset-2 transition-colors hover:bg-grey-100 focus-ring"
      >
        <Heart className={cn("size-4", optimistic && "fill-brand text-brand")} />
        {optimistic ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={optimistic}
      aria-busy={pending}
      aria-label={label}
      data-testid="wishlist-button"
      className="grid size-8 place-items-center rounded-full outline-none transition-transform duration-250 ease-standard hover:scale-[1.08] active:scale-[0.92] focus-visible:shadow-[var(--focus-ring)]"
    >
      <Heart
        key={String(optimistic)}
        className={cn(
          "size-6 drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]",
          optimistic ? "fill-brand text-white motion-safe:animate-[kip-heart-pop_300ms_var(--ease-enter)]" : "fill-black/50 text-white",
        )}
        strokeWidth={2}
      />
    </button>
  );
}
