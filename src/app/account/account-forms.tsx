"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { changePasswordAction, updateProfileAction } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  ) : null;
}

export function ProfileForm({ name, bio }: { name: string; bio: string }) {
  const [state, action, pending] = useActionState(updateProfileAction, undefined);
  const e = state?.errors ?? {};
  useEffect(() => {
    if (state?.ok) toast("Profile saved");
  }, [state]);

  return (
    <form action={action} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={state?.values?.name ?? name} autoComplete="name" className="h-12 rounded-lg" aria-invalid={!!e.name} aria-describedby={e.name ? "name-error" : undefined} />
        <FieldError id="name-error" message={e.name} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bio">About you</Label>
        <Textarea id="bio" name="bio" rows={4} maxLength={500} defaultValue={state?.values?.bio ?? bio} className="rounded-lg" aria-invalid={!!e.bio} aria-describedby={e.bio ? "bio-error" : "bio-hint"} />
        <p id="bio-hint" className="text-xs text-muted-foreground">
          Shown on your public host profile if you list a place.
        </p>
        <FieldError id="bio-error" message={e.bio} />
      </div>
      {e.form && (
        <p role="alert" className="text-sm text-destructive">
          {e.form}
        </p>
      )}
      <Button type="submit" variant="dark" size="xl" className="rounded-lg" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Save profile
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const e = state?.errors ?? {};
  useEffect(() => {
    if (state?.ok) {
      toast("Password updated. Other devices have been signed out.");
      formRef.current?.reset();
    }
  }, [state]);

  const field = (name: "currentPassword" | "newPassword" | "confirmPassword", label: string, autoComplete: string, hint?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="password"
        autoComplete={autoComplete}
        className="h-12 rounded-lg"
        aria-invalid={!!e[name]}
        aria-describedby={e[name] ? `${name}-error` : hint ? `${name}-hint` : undefined}
      />
      {hint && !e[name] && (
        <p id={`${name}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <FieldError id={`${name}-error`} message={e[name]} />
    </div>
  );

  return (
    <form ref={formRef} action={action} className="space-y-5" noValidate>
      {field("currentPassword", "Current password", "current-password")}
      {field("newPassword", "New password", "new-password", "At least 10 characters, including a letter and a number.")}
      {field("confirmPassword", "Confirm new password", "new-password")}
      {e.form && (
        <p role="alert" className="text-sm text-destructive">
          {e.form}
        </p>
      )}
      <Button type="submit" variant="dark" size="xl" className="rounded-lg" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Update password
      </Button>
    </form>
  );
}
