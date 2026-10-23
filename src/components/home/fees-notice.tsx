"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const SEEN_KEY = "kip:fees-notice-seen";
const PILL_MS = 6000;

function readSeen() {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    // Storage blocked (private mode, previews): treat as seen rather than nagging on every visit.
    return true;
  }
}

function markSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {}
}

/** A price tag with a check mark (original artwork). */
function TagIllustration() {
  return (
    <svg viewBox="0 0 96 96" className="size-24" aria-hidden>
      <circle cx="48" cy="48" r="44" className="fill-brand/10" />
      <path d="M26 30a4 4 0 0 1 4-4h20.3a4 4 0 0 1 2.8 1.2l17.7 17.7a4 4 0 0 1 0 5.7L50.6 70.8a4 4 0 0 1-5.7 0L27.2 53.1a4 4 0 0 1-1.2-2.8z" className="fill-brand" />
      <circle cx="37" cy="37" r="4" className="fill-white" />
      <path d="m41 50 6 6 11-12" fill="none" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * First-visit announcement that card prices are all-in, then a short-lived "Prices include all fees" pill
 * (both observed on the reference home page: a "Got it" dialog, then a floating pill near the bottom).
 */
export function FeesNotice() {
  const [open, setOpen] = useState(false);
  const [pill, setPill] = useState(false);

  useEffect(() => {
    if (readSeen()) return;
    // After first paint, so the notice never competes with the page's largest image.
    const t = window.setTimeout(() => setOpen(true), 700);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!pill) return;
    const t = window.setTimeout(() => setPill(false), PILL_MS);
    return () => window.clearTimeout(t);
  }, [pill]);

  function dismiss() {
    markSeen();
    setOpen(false);
    setPill(true);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
        <DialogContent
          showCloseButton={false}
          className="w-[calc(100%-2rem)] max-w-[400px] justify-items-center gap-0 rounded-[32px] p-8 pt-10 text-center shadow-elev-3 ring-0 sm:max-w-[400px] data-open:animate-[kip-dialog-in_400ms_var(--ease-enter)]"
        >
          <TagIllustration />
          <DialogTitle className="mt-5 text-[22px] leading-[26px] font-semibold">One price for your whole stay, fees included</DialogTitle>
          <DialogDescription className="mt-3 text-base leading-6 text-muted-foreground">
            Prices on Kipstay already include cleaning, the service fee and taxes, so the total you see is the total you pay.
          </DialogDescription>
          <Button onClick={dismiss} className="mt-7 h-12 w-full rounded-lg bg-foreground text-base font-semibold text-background hover:bg-foreground/90">
            Got it
          </Button>
        </DialogContent>
      </Dialog>

      <div
        role="status"
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-[88px] z-40 flex justify-center transition-[opacity,transform] duration-300 ease-standard md:bottom-8 motion-reduce:transition-none",
          pill ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        )}
      >
        {pill && (
          <span className="flex items-center gap-2.5 rounded-xl border border-grey-300 bg-background px-4 py-3 text-[15px] font-medium shadow-elev-2">
            <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
              <path d="M3 6a2 2 0 0 1 2-2h7.2a2 2 0 0 1 1.4.6l7.3 7.3a2 2 0 0 1 0 2.8l-6.2 6.2a2 2 0 0 1-2.8 0L4.6 13.6A2 2 0 0 1 4 12.2z" className="fill-brand" />
              <circle cx="8.5" cy="8.5" r="1.6" className="fill-white" />
            </svg>
            Prices include all fees
          </span>
        )}
      </div>
    </>
  );
}
