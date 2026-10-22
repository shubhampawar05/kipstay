"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleWishlist } from "@/app/actions/wishlist";
import { cn } from "@/lib/utils";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { circleButton } from "./share-button";

export function WishlistButton({
  listingId,
  title,
  saved,
  variant = "overlay",
}: {
  listingId: string;
  title: string;
  saved: boolean;
  variant?: "overlay" | "inline" | "circle";
}) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useOptimistic(saved);
  const [pending, startTransition] = useTransition();
  const [authOpen, setAuthOpen] = useState(false);

  function toggle() {
    startTransition(async () => {
      setOptimistic(!optimistic);
      const result = await toggleWishlist(listingId);
      if (!result.ok) {
        // Logged out: log in over the page, then finish the save (see onAuthenticated).
        if (result.reason === "auth") setAuthOpen(true);
        else toast.error("This listing is no longer available.");
        return;
      }
      toast(result.saved ? `Saved ${title}` : `Removed ${title} from your wishlist`);
      router.refresh();
    });
  }

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!pending) toggle();
  }

  function onAuthenticated() {
    setAuthOpen(false);
    // The button was showing "not saved" for a logged-out visitor, so this toggle saves.
    toggle();
  }

  const dialog = (
    <AuthDialog
      open={authOpen}
      onOpenChange={setAuthOpen}
      onAuthenticated={onAuthenticated}
      reason="Log in or sign up to save places to your wishlist."
    />
  );

  const label = `${optimistic ? "Remove from" : "Add to"} wishlist: ${title}`;

  if (variant === "circle") {
    return (
      <>
        <button type="button" onClick={onClick} aria-pressed={optimistic} aria-busy={pending} aria-label={label} className={circleButton}>
          <Heart
            key={String(optimistic)}
            className={cn("size-4", optimistic && "fill-brand text-brand motion-safe:animate-[kip-heart-pop_300ms_var(--ease-enter)]")}
          />
        </button>
        {dialog}
      </>
    );
  }

  if (variant === "inline") {
    return (
      <>
        <button
          type="button"
          onClick={onClick}
          disabled={pending}
          aria-pressed={optimistic}
          aria-label={label}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium underline underline-offset-2 transition-colors hover:bg-grey-100 focus-ring"
        >
          <Heart
            key={String(optimistic)}
            className={cn("size-4", optimistic && "fill-brand text-brand motion-safe:animate-[kip-heart-pop_300ms_var(--ease-enter)]")}
          />
          {optimistic ? "Saved" : "Save"}
        </button>
        {dialog}
      </>
    );
  }

  return (
    <>
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
      {dialog}
    </>
  );
}
