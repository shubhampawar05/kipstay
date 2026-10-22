"use client";

import { useActionState } from "react";
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
  const describedBy = [error && `${name}-error`, hint && `${name}-hint`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className="h-11"
      />
      {hint && !error && (
        <p id={`${name}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? login : signup, undefined);
  const e = state?.errors ?? {};
  const nextQuery = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />
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
      <Button type="submit" size="lg" className="h-12 w-full rounded-xl text-base" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        {mode === "login" ? "Log in" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            New to Kipstay?{" "}
            <Link href={`/signup${nextQuery}`} className="font-semibold text-foreground underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href={`/login${nextQuery}`} className="font-semibold text-foreground underline">
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
