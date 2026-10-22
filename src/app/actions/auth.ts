"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  clearAttempts,
  createSession,
  destroySession,
  hashPassword,
  isRateLimited,
  recordFailedAttempt,
  verifyCredentials,
} from "@/lib/auth";
import { fieldErrors, loginSchema, safeNextPath, signupSchema } from "@/lib/validation";

/** `ok` is only returned for in-place forms (the login dialog), which refresh the page themselves instead of redirecting. */
export type AuthState = { ok?: true; errors?: Record<string, string>; values?: { name?: string; email?: string } } | undefined;

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = { name: formData.get("name"), email: formData.get("email"), password: formData.get("password") };
  const parsed = signupSchema.safeParse(raw);
  const values = { name: String(raw.name ?? ""), email: String(raw.email ?? "") };
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  let userId: string;
  try {
    const user = await prisma.user.create({
      data: { name: parsed.data.name, email: parsed.data.email, passwordHash: await hashPassword(parsed.data.password) },
    });
    userId = user.id;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { errors: { email: "An account with this email already exists. Try logging in." }, values };
    }
    throw e;
  }

  await createSession(userId);
  if (formData.get("inline") === "1") return { ok: true };
  redirect(safeNextPath(formData.get("next")));
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = { email: formData.get("email"), password: formData.get("password") };
  const parsed = loginSchema.safeParse(raw);
  const values = { email: String(raw.email ?? "") };
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  // Two buckets: per email+IP, and per email alone (generous), since x-forwarded-for can be rotated by a client
  // unless a trusted proxy overwrites it.
  const key = `${parsed.data.email}|${ip}`;
  const emailKey = `email:${parsed.data.email}`;
  if (isRateLimited(key) || isRateLimited(emailKey, 3)) {
    return { errors: { form: "Too many attempts. Please wait 15 minutes and try again." }, values };
  }

  const user = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    recordFailedAttempt(key);
    recordFailedAttempt(emailKey);
    return { errors: { form: "That email and password don't match an account." }, values };
  }

  clearAttempts(key);
  clearAttempts(emailKey);
  await createSession(user.id);
  if (formData.get("inline") === "1") return { ok: true };
  redirect(safeNextPath(formData.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
