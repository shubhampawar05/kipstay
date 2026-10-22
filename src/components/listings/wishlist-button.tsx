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
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium underline-offset-2 hover:bg-muted hover:underline"
      >
        <Heart className={cn("size-4", optimistic && "fill-rose-500 text-rose-500")} />
        {optimistic ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={optimistic}
      aria-label={label}
      data-testid="wishlist-button"
      className="grid size-9 place-items-center rounded-full transition-transform hover:scale-110 focus-visible:ring-3 focus-visible:ring-white/70 outline-none"
    >
      <Heart
        className={cn(
          "size-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]",
          optimistic ? "fill-rose-500 text-white" : "fill-black/40 text-white",
        )}
        strokeWidth={2}
      />
    </button>
  );
}
