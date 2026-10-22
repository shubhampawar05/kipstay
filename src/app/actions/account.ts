"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { clearAttempts, getCurrentUser, hashPassword, isRateLimited, recordFailedAttempt, rotateSessions, verifyCredentials } from "@/lib/auth";
import { fieldErrors, passwordChangeSchema, profileSchema } from "@/lib/validation";

export type AccountState = { ok?: boolean; errors?: Record<string, string>; values?: Record<string, string> } | undefined;

export async function updateProfileAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: "Your session expired. Log in again." } };
  const values = { name: String(formData.get("name") ?? ""), bio: String(formData.get("bio") ?? "") };
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  await prisma.user.update({ where: { id: user.id }, data: { name: parsed.data.name, bio: parsed.data.bio || null } });
  revalidatePath("/", "layout");
  return { ok: true, values: { name: parsed.data.name, bio: parsed.data.bio } };
}

export async function changePasswordAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: "Your session expired. Log in again." } };
  const parsed = passwordChangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const key = `password-change|${user.id}`;
  if (isRateLimited(key)) return { errors: { form: "Too many attempts. Please wait 15 minutes and try again." } };
  const verified = await verifyCredentials(user.email, parsed.data.currentPassword);
  if (!verified) {
    recordFailedAttempt(key);
    return { errors: { currentPassword: "That isn't your current password." } };
  }
  clearAttempts(key);

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.newPassword) } });
  await rotateSessions(user.id);
  return { ok: true };
}
