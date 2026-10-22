"use client";

import { useActionState, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { reviewAction } from "@/app/actions/bookings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { REVIEW_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Native radio group drawn as five stars (arrow keys move between them; hover previews the fill). */
function StarRating({ name, label, initial, error }: { name: string; label: string; initial: number; error?: string }) {
  const [value, setValue] = useState(initial);
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined} onMouseLeave={() => setHover(0)}>
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer rounded-sm has-[:focus-visible]:shadow-[var(--focus-ring)]" onMouseEnter={() => setHover(n)}>
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => setValue(n)}
              className="sr-only"
              aria-label={`${label}: ${n} star${n === 1 ? "" : "s"}`}
            />
            <Star
              aria-hidden
              className={cn(
                "size-7 transition-[color,transform] duration-150 ease-standard active:scale-90",
                n <= shown ? "fill-foreground text-foreground" : "text-grey-500",
              )}
            />
          </label>
        ))}
      </div>
      {error && (
        <p id={`${name}-error`} className="mt-1 text-sm text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState(reviewAction, undefined);
  if (state?.ok) return <p className="mt-3 text-emerald-700">Thanks! Your review is live.</p>;
  const e = state?.errors ?? {};
  // React resets the form after an action; the server echoes what was sent so a failed submit keeps it.
  const sent = (k: string) => Number(state?.values?.[k]) || 0;

  return (
    <form action={action} className="mt-4 space-y-6" key={state ? JSON.stringify(state.values) : "new"}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <StarRating name="rating" label="Overall" initial={sent("rating") || 5} error={e.rating} />
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {REVIEW_CATEGORIES.map((c) => (
          <StarRating key={c.key} name={c.key} label={c.label} initial={sent(c.key)} error={e[c.key]} />
        ))}
      </div>
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
