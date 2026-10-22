"use client";

import { useActionState } from "react";
import { FlaskConical, Loader2 } from "lucide-react";
import { reserveAction } from "@/app/actions/bookings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/pricing";

const FIELDS = ["listingId", "checkin", "checkout", "adults", "children", "infants", "pets"] as const;

export function ReserveForm({ request, total }: { request: Record<string, string>; total: number }) {
  const [state, action, pending] = useActionState(reserveAction, undefined);

  return (
    <form action={action} className="space-y-6">
      {FIELDS.map((f) => (
        <input key={f} type="hidden" name={f} value={request[f] ?? "0"} />
      ))}

      <section aria-labelledby="pay-heading" className="space-y-4">
        <h2 id="pay-heading" className="text-xl font-semibold">
          Payment
        </h2>
        <Alert role="note">
          <FlaskConical />
          <AlertTitle>Development mock payment</AlertTitle>
          <AlertDescription>
            No payment provider is connected. Kipstay will not ask for card details and nothing will be charged. Confirming creates a real
            reservation in the database with a <code>mock_</code> payment reference.
          </AlertDescription>
        </Alert>
        <label className="flex items-start gap-3 rounded-xl border p-4 text-sm">
          <input type="checkbox" name="confirmMock" className="mt-0.5 size-4 accent-primary" required />
          <span>I understand this is a simulated payment of {formatMoney(total, { cents: true })} and no money will move.</span>
        </label>
      </section>

      <p className="text-xs text-muted-foreground">
        By selecting the button below, you agree to the host&apos;s house rules and the listing&apos;s cancellation policy.
      </p>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" variant="brand" size="xl" className="w-full rounded-lg sm:w-auto sm:px-8" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Confirm and pay (mock)
      </Button>
    </form>
  );
}
