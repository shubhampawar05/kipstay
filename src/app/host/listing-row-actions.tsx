"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteListingAction, setPublishedAction } from "@/app/actions/listings";
import { Button, buttonVariants } from "@/components/ui/button";

export function ListingRowActions({ id, isPublished }: { id: string; isPublished: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok?: boolean; error?: string }>, success: string) =>
    start(async () => {
      try {
        const result = await fn();
        if (result.error) toast.error(result.error);
        else {
          toast(success);
          router.refresh();
        }
      } catch {
        toast.error("Something went wrong. Check your connection and try again.");
      }
    });

  return (
    <div className="flex flex-wrap gap-2">
      {isPublished && (
        <Link href={`/rooms/${id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          View
        </Link>
      )}
      <Link href={`/host/listings/${id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
        Edit
      </Link>
      <Link href={`/host/listings/${id}/calendar`} className={buttonVariants({ variant: "outline", size: "sm" })}>
        Calendar
      </Link>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => run(() => setPublishedAction(id, !isPublished), isPublished ? "Listing unpublished" : "Listing published")}
      >
        {isPublished ? "Unpublish" : "Publish"}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (confirm("Delete this listing permanently? Listings with reservations can only be unpublished.")) run(() => deleteListingAction(id), "Listing deleted");
        }}
      >
        Delete
      </Button>
    </div>
  );
}
