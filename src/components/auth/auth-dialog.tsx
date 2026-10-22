"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AuthForm } from "./auth-form";

/**
 * Reference pattern: actions that need an account (saving to a wishlist) open "Log in or sign up" in a modal
 * over the current page instead of navigating away. `onAuthenticated` runs once the session cookie is set.
 */
export function AuthDialog({
  open,
  onOpenChange,
  onAuthenticated,
  reason,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthenticated: () => void;
  reason?: string;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const pathname = usePathname();
  const params = useSearchParams();
  const here = `${pathname}${params.size ? `?${params}` : ""}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-[568px] gap-0 overflow-y-auto rounded-[32px] p-0 shadow-elev-3 ring-0 sm:max-w-[568px] data-open:animate-[kip-dialog-in_400ms_var(--ease-enter)]">
        <DialogHeader className="border-b border-grey-300 px-6 py-5">
          <DialogTitle className="text-center text-base font-semibold">Log in or sign up</DialogTitle>
        </DialogHeader>
        <div className="p-6">
          <p className="text-[22px] leading-[26px] font-semibold">{mode === "login" ? "Welcome back" : "Create your account"}</p>
          <DialogDescription className="mt-1 mb-6 text-base text-muted-foreground">
            {reason ?? "Log in to book stays, manage trips and save favourites."}
          </DialogDescription>
          <AuthForm
            key={mode}
            mode={mode}
            next={here}
            onSuccess={onAuthenticated}
            onSwitchMode={() => setMode((m) => (m === "login" ? "signup" : "login"))}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
