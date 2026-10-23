"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { Check, ChevronLeft, Heart, Loader2 } from "lucide-react";
import { createWishlist, listMyWishlists, saveToWishlist, type WishlistSummary } from "@/app/actions/wishlist";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { rawImage } from "@/lib/photos";

const NAME_MAX = 50;

/**
 * Reference "Save to wishlist" dialog: pick one of your lists (cover photo, name, count), or create a new one
 * (50-character name). Reports `auth` back to the caller when the visitor turns out to be logged out.
 */
export function SaveToWishlistDialog({
  open,
  onOpenChange,
  listingId,
  onSaved,
  onAuthRequired,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  onSaved: (listName: string) => void;
  onAuthRequired: () => void;
}) {
  const [lists, setLists] = useState<WishlistSummary[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listMyWishlists(listingId)
      .then((r) => {
        if (cancelled) return;
        if (!r.ok) return onAuthRequired();
        setLists(r.lists);
        setCreating(r.lists.length === 0);
      })
      .catch(() => !cancelled && setError("Couldn't load your wishlists. Try again."));
    return () => {
      cancelled = true;
    };
    // onAuthRequired is a fresh closure each render; loading depends only on opening for this listing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, listingId]);

  function reset(next: boolean) {
    if (!next) {
      setLists(null);
      setCreating(false);
      setName("");
      setError(null);
    }
    onOpenChange(next);
  }

  function handle(result: Awaited<ReturnType<typeof saveToWishlist>>) {
    if (result.ok) {
      onSaved(result.name ?? "your wishlist");
      reset(false);
    } else if (result.reason === "auth") onAuthRequired();
    else setError(result.error ?? "This listing is no longer available.");
  }

  function save(list: WishlistSummary) {
    setBusyId(list.id);
    setError(null);
    start(async () => {
      handle(
        await saveToWishlist(listingId, list.id).catch(() => ({
          ok: false as const,
          reason: "invalid" as const,
          error: "Couldn't save. Try again.",
        })),
      );
      setBusyId(null);
    });
  }

  function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      handle(
        await createWishlist(name, listingId).catch(() => ({
          ok: false as const,
          reason: "invalid" as const,
          error: "Couldn't create the wishlist. Try again.",
        })),
      );
    });
  }

  const hasLists = !!lists && lists.length > 0;

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-[568px] gap-0 overflow-hidden rounded-[32px] p-0 shadow-elev-3 ring-0 sm:max-w-[568px] data-open:animate-[kip-dialog-in_400ms_var(--ease-enter)]">
        <DialogHeader className="relative border-b border-grey-300 px-6 py-5">
          {creating && hasLists && (
            <button
              type="button"
              onClick={() => setCreating(false)}
              aria-label="Back to your wishlists"
              className="absolute top-1/2 left-4 grid size-8 -translate-y-1/2 place-items-center rounded-full transition-colors hover:bg-grey-100 focus-ring"
            >
              <ChevronLeft className="size-4" />
            </button>
          )}
          <DialogTitle className="text-center text-base font-semibold">{creating ? "Create wishlist" : "Save to wishlist"}</DialogTitle>
          <DialogDescription className="sr-only">
            {creating ? "Name a new wishlist; this stay is saved to it." : "Choose a wishlist for this stay."}
          </DialogDescription>
        </DialogHeader>

        {lists === null && !error ? (
          <div className="grid grid-cols-2 gap-4 p-6" aria-label="Loading wishlists" role="status">
            {[0, 1].map((i) => (
              <div key={i}>
                <div className="kip-shimmer aspect-square rounded-xl" style={{ "--shimmer-index": i } as React.CSSProperties} />
                <div className="kip-shimmer mt-2 h-4 w-2/3 rounded" />
              </div>
            ))}
          </div>
        ) : creating ? (
          <form onSubmit={create} className="kip-fade-in">
            <div className="p-6">
              <Label htmlFor="wishlist-name" className="sr-only">
                Name
              </Label>
              <Input
                id="wishlist-name"
                autoFocus
                value={name}
                maxLength={NAME_MAX}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                aria-describedby="wishlist-name-count"
                aria-invalid={!!error}
                className="h-14 rounded-lg border-grey-600 text-base"
              />
              <p id="wishlist-name-count" className="mt-2 text-xs font-semibold text-muted-foreground">
                {name.length}/{NAME_MAX} characters
              </p>
              {error && (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-grey-300 px-6 py-4">
              <Button
                type="button"
                variant="link"
                className="px-0 font-semibold text-foreground underline"
                onClick={() => setName("")}
                disabled={!name}
              >
                Clear
              </Button>
              <Button type="submit" variant="dark" size="lg" className="h-12 rounded-lg px-6" disabled={!name.trim() || pending}>
                {pending && <Loader2 className="animate-spin" />} Create
              </Button>
            </div>
          </form>
        ) : (
          <div className="kip-fade-in">
            <ul className="grid max-h-[60dvh] grid-cols-2 gap-x-4 gap-y-6 overflow-y-auto p-6" aria-label="Your wishlists">
              {lists?.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => save(l)}
                    className="group w-full rounded-xl text-left focus-ring disabled:cursor-wait"
                    aria-label={`Save to ${l.name}${l.hasListing ? " (already saved here)" : ""}`}
                  >
                    <span className="relative block aspect-square overflow-hidden rounded-xl bg-grey-200 shadow-elev-1 transition-transform duration-250 ease-standard group-hover:scale-[1.02] group-active:scale-[0.98]">
                      {l.cover ? (
                        <Image src={l.cover} alt="" fill unoptimized={rawImage(l.cover)} className="object-cover" sizes="240px" />
                      ) : (
                        <Heart className="absolute inset-0 m-auto size-8 text-grey-600" aria-hidden />
                      )}
                      {(busyId === l.id || l.hasListing) && (
                        <span className="absolute inset-0 grid place-items-center bg-black/30 text-white">
                          {busyId === l.id ? <Loader2 className="size-6 animate-spin" /> : <Check className="size-7" />}
                        </span>
                      )}
                    </span>
                    <span className="mt-2 block truncate text-sm font-semibold">{l.name}</span>
                    <span className="block text-xs text-muted-foreground">{l.count} saved</span>
                  </button>
                </li>
              ))}
            </ul>
            {error && (
              <p role="alert" className="px-6 pb-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="border-t border-grey-300 p-4">
              <Button type="button" variant="dark" size="lg" className={cn("h-12 w-full rounded-lg")} onClick={() => setCreating(true)}>
                Create new wishlist
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
