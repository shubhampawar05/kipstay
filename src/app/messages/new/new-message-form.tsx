"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { startConversationAction } from "@/app/actions/messages";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function NewMessageForm({
  listingId,
  guestId,
  recipient,
  maxLength,
}: {
  listingId: string;
  guestId?: string;
  recipient: string;
  maxLength: number;
}) {
  const [state, action, pending] = useActionState(startConversationAction, undefined);
  const [body, setBody] = useState("");
  // After a failed send React resets the form, so the textarea is controlled and refilled from the echoed body.
  const [echoed, setEchoed] = useState<typeof state>(undefined);
  if (state !== echoed) {
    setEchoed(state);
    if (state?.body !== undefined) setBody(state.body);
  }

  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="listingId" value={listingId} />
      {guestId && <input type="hidden" name="guestId" value={guestId} />}
      <div className="space-y-1.5">
        <Label htmlFor="first-message" className="text-[22px] leading-[26px] font-semibold">
          Message {recipient}
        </Label>
        <Textarea
          id="first-message"
          name="body"
          rows={6}
          maxLength={maxLength}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-invalid={!!state?.error}
          aria-describedby={state?.error ? "first-message-error" : "first-message-count"}
          placeholder={`Hi ${recipient}, …`}
          className="rounded-xl border-grey-600 text-base"
        />
        <p id="first-message-count" className="text-xs text-muted-foreground">
          {body.length}/{maxLength}
        </p>
        {state?.error && (
          <p id="first-message-error" role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
      </div>
      <Button type="submit" variant="brand" size="xl" className="rounded-lg px-8" disabled={pending || !body.trim()}>
        {pending && <Loader2 className="animate-spin" />} Send message
      </Button>
    </form>
  );
}
