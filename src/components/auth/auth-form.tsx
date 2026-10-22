"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { login, signup, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Field({
  name,
  label,
  type = "text",
  autoComplete,
  error,
  defaultValue,
  hint,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete: string;
  error?: string;
  defaultValue?: string;
  hint?: string;
}) {
  // Unique ids: the form can also appear in a dialog on top of another page.
  const id = `${useId()}-${name}`;
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className="h-14 rounded-lg border-grey-600 text-base"
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function AuthForm({
  mode,
  next,
  onSuccess,
  onSwitchMode,
}: {
  mode: "login" | "signup";
  next: string;
  /** In-place use (dialog): the server skips its redirect and this runs instead. */
  onSuccess?: () => void;
  /** In-place use: switch between log in and sign up without leaving the page. */
  onSwitchMode?: () => void;
}) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? login : signup, undefined);
  const e = state?.errors ?? {};
  const nextQuery = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";
  const switchClass = "font-semibold text-foreground underline rounded-sm focus-ring";

  // Fire once per successful submission, even if the parent passes a new callback on every render.
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });
  useEffect(() => {
    if (state?.ok) onSuccessRef.current?.();
  }, [state]);

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />
      {onSuccess && <input type="hidden" name="inline" value="1" />}
      {mode === "signup" && <Field name="name" label="Full name" autoComplete="name" error={e.name} defaultValue={state?.values?.name} />}
      <Field name="email" label="Email" type="email" autoComplete="email" error={e.email} defaultValue={state?.values?.email} />
      <Field
        name="password"
        label="Password"
        type="password"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        error={e.password}
        hint={mode === "signup" ? "At least 10 characters, including a letter and a number." : undefined}
      />
      {e.form && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {e.form}
        </p>
      )}
      <Button type="submit" variant="brand" size="xl" className="w-full rounded-lg" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        {mode === "login" ? "Log in" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            New to Kipstay?{" "}
            {onSwitchMode ? (
              <button type="button" onClick={onSwitchMode} className={switchClass}>
                Sign up
              </button>
            ) : (
              <Link href={`/signup${nextQuery}`} className={switchClass}>
                Sign up
              </Link>
            )}
          </>
        ) : (
          <>
            Already have an account?{" "}
            {onSwitchMode ? (
              <button type="button" onClick={onSwitchMode} className={switchClass}>
                Log in
              </button>
            ) : (
              <Link href={`/login${nextQuery}`} className={switchClass}>
                Log in
              </Link>
            )}
          </>
        )}
      </p>
    </form>
  );
}
