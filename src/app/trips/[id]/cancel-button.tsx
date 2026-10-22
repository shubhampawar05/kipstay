"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cancelAction } from "@/app/actions/bookings";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function CancelButton({ bookingId, label = "Cancel reservation" }: { bookingId: string; label?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" />}>{label}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this reservation?</DialogTitle>
          <DialogDescription>The dates will be released for other guests. Mock payments have nothing to refund.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Keep reservation</DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            aria-busy={pending}
            onClick={() =>
              start(async () => {
                try {
                  const result = await cancelAction(bookingId);
                  if (result?.error) toast.error(result.error);
                  else {
                    toast("Reservation cancelled");
                    setOpen(false);
                    router.refresh();
                  }
                } catch {
                  toast.error("Couldn't cancel right now. Check your connection and try again.");
                }
              })
            }
          >
            Yes, cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
