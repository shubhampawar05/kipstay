"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { reviewAction } from "@/app/actions/bookings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState(reviewAction, undefined);
  if (state?.ok) return <p className="mt-3 text-emerald-700">Thanks! Your review is live.</p>;
  const e = state?.errors ?? {};
  // React resets the form after an action; the server echoes what was sent so a failed submit keeps it.
  const rating = Number(state?.values?.rating) || 5;

  return (
    <form action={action} className="mt-4 space-y-4" key={state ? JSON.stringify(state.values) : "new"}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <fieldset aria-describedby={e.rating ? "rating-error" : undefined}>
        <legend className="mb-2 text-sm font-medium">Rating</legend>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={n}
                defaultChecked={n === rating}
                className="peer sr-only"
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
              />
              <span className="grid size-10 place-items-center rounded-full border text-sm transition-colors duration-150 peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:shadow-[var(--focus-ring)]">
                {n}★
              </span>
            </label>
          ))}
        </div>
        {e.rating && (
          <p id="rating-error" className="mt-1.5 text-sm text-destructive">
            {e.rating}
          </p>
        )}
      </fieldset>
      <div className="space-y-1.5">
        <Label htmlFor="comment">Your review</Label>
        <Textarea
          id="comment"
          name="comment"
          rows={4}
          maxLength={1000}
          required
          defaultValue={state?.values?.comment ?? ""}
          aria-invalid={!!e.comment}
          aria-describedby={e.comment ? "comment-error" : undefined}
        />
        {e.comment && (
          <p id="comment-error" className="text-sm text-destructive">
            {e.comment}
          </p>
        )}
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Post review
      </Button>
    </form>
  );
}
