"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { canGoBackInApp } from "@/components/layout/history-tracker";
import { circleButton } from "./share-button";

/** Goes back when the previous page was on this site (keeping search state), otherwise to search results. */
export function BackButton({ className, fallback = "/s" }: { className?: string; fallback?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Back"
      className={cn(circleButton, className)}
      onClick={() => {
        if (canGoBackInApp()) router.back();
        else router.push(fallback);
      }}
    >
      <ChevronLeft className="size-4" strokeWidth={2.5} />
    </button>
  );
}
