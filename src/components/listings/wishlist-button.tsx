"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { removeFromWishlists } from "@/app/actions/wishlist";
import { cn } from "@/lib/utils";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { circleButton } from "./share-button";
import { SaveToWishlistDialog } from "./save-to-wishlist-dialog";

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
  const [saveOpen, setSaveOpen] = useState(false);

  // Reference behaviour: an empty heart opens "Save to wishlist"; a filled one removes the stay from every list.
  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    if (!optimistic) {
      setSaveOpen(true);
      return;
    }
    startTransition(async () => {
      setOptimistic(false);
      const result = await removeFromWishlists(listingId).catch(() => null);
      if (!result?.ok) {
        if (result?.reason === "auth") setAuthOpen(true);
        else toast.error("Couldn't update your wishlists. Try again.");
        return;
      }
      toast(`Removed ${title} from your wishlists`);
      router.refresh();
    });
  }

  function onSaved(listName: string) {
    startTransition(() => {
      setOptimistic(true);
      router.refresh();
    });
    toast(`Saved to ${listName}`, { action: { label: "Change", onClick: () => setSaveOpen(true) } });
  }

  function onAuthenticated() {
    setAuthOpen(false);
    router.refresh();
    // Logged in now: continue straight into choosing a list.
    setSaveOpen(true);
  }

  const dialog = (
    <>
      <SaveToWishlistDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        listingId={listingId}
        onSaved={onSaved}
        onAuthRequired={() => {
          setSaveOpen(false);
          setAuthOpen(true);
        }}
      />
      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onAuthenticated={onAuthenticated}
        reason="Log in or sign up to save places to your wishlist."
      />
    </>
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
