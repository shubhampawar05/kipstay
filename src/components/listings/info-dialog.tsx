"use client";

import { ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** "Show more" link that opens the full text in a dialog (reference "Things to know" / description pattern). */
export function InfoDialog({
  title,
  trigger = "Show more",
  children,
  className,
  variant = "link",
}: {
  title: string;
  trigger?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  variant?: "link" | "button";
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className={cn(
              variant === "link"
                ? "flex items-center gap-1 rounded-md text-base font-semibold underline underline-offset-2 focus-ring"
                : "rounded-lg bg-grey-200 px-6 py-3 text-base font-semibold transition-[background-color,transform] hover:bg-grey-300 active:scale-[0.98] focus-ring",
              className,
            )}
          />
        }
      >
        {trigger}
        {variant === "link" && <ChevronRight className="size-4" aria-hidden />}
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-[32px] p-8 shadow-elev-3 ring-0 sm:max-w-2xl data-open:animate-[kip-dialog-in_400ms_var(--ease-enter)]">
        <DialogHeader>
          <DialogTitle className="text-[26px] leading-[30px] font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 text-base leading-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
