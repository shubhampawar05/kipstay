"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { deleteWishlist, renameWishlist } from "@/app/actions/wishlist";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** "…" menu on a wishlist page: rename (50 characters, as on the reference) or delete the list. */
export function WishlistActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"rename" | "delete" | null>(null);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function rename(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const result = await renameWishlist(id, draft).catch(() => null);
      if (!result?.ok) return setError(result && !result.ok && result.error ? result.error : "Couldn't rename. Try again.");
      toast("Wishlist renamed");
      setDialog(null);
      router.refresh();
    });
  }

  function remove() {
    start(async () => {
      const result = await deleteWishlist(id).catch(() => null);
      if (!result?.ok) return void toast.error("Couldn't delete this wishlist. Try again.");
      toast(`Deleted ${name}`);
      router.push("/wishlists");
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Wishlist settings"
          className="grid size-9 place-items-center rounded-full transition-colors hover:bg-grey-100 focus-ring"
        >
          <MoreHorizontal className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 rounded-xl py-2 shadow-elev-3 ring-0 data-open:animate-[kip-panel-in_200ms_var(--ease-standard)]"
        >
          <DropdownMenuItem
            className="px-4 py-2.5"
            onClick={() => {
              setDraft(name);
              setError(null);
              setDialog("rename");
            }}
          >
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem className="px-4 py-2.5 text-destructive" onClick={() => setDialog("delete")}>
            Delete wishlist
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialog === "rename"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="rounded-[24px] p-6 sm:max-w-md">
          <form onSubmit={rename} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Rename wishlist</DialogTitle>
              <DialogDescription>Up to 50 characters.</DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="rename-wishlist">Name</Label>
              <Input id="rename-wishlist" value={draft} maxLength={50} onChange={(e) => setDraft(e.target.value)} aria-invalid={!!error} autoFocus />
              <p className="text-xs text-muted-foreground">{draft.length}/50 characters</p>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
              <Button type="submit" variant="dark" disabled={!draft.trim() || pending}>
                {pending && <Loader2 className="animate-spin" />} Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "delete"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="rounded-[24px] p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this wishlist?</DialogTitle>
            <DialogDescription>&ldquo;{name}&rdquo; will be permanently deleted. The stays themselves aren&apos;t affected.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" disabled={pending} onClick={remove}>
              {pending && <Loader2 className="animate-spin" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
