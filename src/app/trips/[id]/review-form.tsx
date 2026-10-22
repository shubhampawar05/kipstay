"use client";

import { useActionState } from "react";
import { reviewAction } from "@/app/actions/bookings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState(reviewAction, undefined);
  if (state?.ok) return <p className="mt-3 text-emerald-700">Thanks! Your review is live.</p>;

  return (
    <form action={action} className="mt-4 space-y-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Rating</legend>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input type="radio" name="rating" value={n} defaultChecked={n === 5} className="peer sr-only" />
              <span className="grid size-10 place-items-center rounded-full border text-sm peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50">
                {n}★
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="space-y-1.5">
        <Label htmlFor="comment">Your review</Label>
        <Textarea id="comment" name="comment" rows={4} maxLength={1000} required aria-invalid={!!state?.errors?.comment} />
        {state?.errors?.comment && <p className="text-sm text-destructive">{state.errors.comment}</p>}
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        Post review
      </Button>
    </form>
  );
}
