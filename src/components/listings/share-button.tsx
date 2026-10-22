"use client";

import { Share } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/** Shares the current listing URL via the Web Share API, or copies it to the clipboard. */
export function ShareButton({ title, className }: { title: string; className?: string }) {
  async function share() {
    const url = window.location.href.split("#")[0];
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy the link. Copy it from the address bar instead.");
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className={cn("flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium underline underline-offset-2 transition-colors hover:bg-grey-100 focus-ring", className)}
    >
      <Share className="size-4" /> Share
    </button>
  );
}
