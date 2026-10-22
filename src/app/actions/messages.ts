"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { appendMessage, MESSAGE_MAX } from "@/lib/messages";

export type MessageState = { error?: string; body?: string } | undefined;

const id = z.string().min(1).max(40);
const body = z.string().trim().min(1, "Write a message first").max(MESSAGE_MAX, `Messages are limited to ${MESSAGE_MAX} characters`);

/**
 * First message about a listing. Guests write to the listing's host; a host may write to a guest who has a reservation
 * on that listing (`guestId`). Re-uses the existing conversation for the pair.
 */
export async function startConversationAction(_prev: MessageState, formData: FormData): Promise<MessageState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Log in again to send messages." };
  const parsed = z
    .object({ listingId: id, guestId: id.optional().or(z.literal("")), body })
    .safeParse({ listingId: formData.get("listingId"), guestId: formData.get("guestId") ?? "", body: formData.get("body") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, body: String(formData.get("body") ?? "") };
  const { listingId, body: text } = parsed.data;

  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true, hostId: true, isPublished: true } });
  if (!listing) return { error: "This listing no longer exists.", body: text };

  let guestId: string;
  if (parsed.data.guestId) {
    // Host → guest: only the listing's host, and only someone who has booked it.
    if (listing.hostId !== user.id) return { error: "You can only message guests of your own listings.", body: text };
    const booked = await prisma.booking.findFirst({ where: { listingId, guestId: parsed.data.guestId }, select: { id: true } });
    if (!booked) return { error: "You can message guests once they've booked this listing.", body: text };
    guestId = parsed.data.guestId;
  } else {
    if (listing.hostId === user.id) return { error: "This is your own listing.", body: text };
    if (!listing.isPublished) return { error: "This listing isn't available any more.", body: text };
    guestId = user.id;
  }

  const conversation = await prisma.conversation.upsert({
    where: { listingId_guestId: { listingId, guestId } },
    create: { listingId, guestId, hostId: listing.hostId },
    update: {},
    select: { id: true },
  });
  await appendMessage(conversation.id, user.id, text);
  revalidatePath("/messages");
  redirect(`/messages/${conversation.id}`);
}

export async function sendMessageAction(conversationId: string, rawBody: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in again to send messages." };
  const parsed = body.safeParse(rawBody);
  if (!parsed.success || !id.safeParse(conversationId).success)
    return { ok: false, error: parsed.error?.issues[0]?.message ?? "Conversation not found." };
  const message = await appendMessage(conversationId, user.id, parsed.data);
  if (!message) return { ok: false, error: "Conversation not found." };
  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);
  return { ok: true };
}
