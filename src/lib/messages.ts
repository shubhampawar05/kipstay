import "server-only";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

/**
 * Messaging between a guest and a listing's host. One conversation per (listing, guest).
 * Read state: each side has a `…ReadAt`; sending stamps the sender's read time with the same instant as
 * `lastMessageAt`, so a conversation is unread for you exactly when `lastMessageAt` is later than your read time.
 */

export const MESSAGE_MAX = 2000;

const participantOf = (userId: string): Prisma.ConversationWhereInput => ({ OR: [{ guestId: userId }, { hostId: userId }] });

function unreadFor(userId: string): Prisma.ConversationWhereInput {
  return {
    OR: [
      { guestId: userId, messages: { some: {} }, OR: [{ guestReadAt: null }, { lastMessageAt: { gt: prisma.conversation.fields.guestReadAt } }] },
      { hostId: userId, messages: { some: {} }, OR: [{ hostReadAt: null }, { lastMessageAt: { gt: prisma.conversation.fields.hostReadAt } }] },
    ],
  };
}

/** Conversations with messages this user hasn't seen. Deduplicated per request (header and tab bar both show it). */
export const unreadConversationCount = cache(async (userId: string) => prisma.conversation.count({ where: unreadFor(userId) }));

export type InboxItem = {
  id: string;
  otherName: string;
  role: "guest" | "host";
  listingTitle: string;
  listingImage: string | null;
  lastMessage: string;
  lastMessageAt: Date;
  unread: boolean;
};

export async function listInbox(userId: string): Promise<InboxItem[]> {
  const [rows, unread] = await Promise.all([
    prisma.conversation.findMany({
      where: { ...participantOf(userId), messages: { some: {} } },
      orderBy: { lastMessageAt: "desc" },
      take: 100,
      select: {
        id: true,
        guestId: true,
        lastMessageAt: true,
        guest: { select: { name: true } },
        host: { select: { name: true } },
        listing: { select: { title: true, images: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true } },
      },
    }),
    prisma.conversation.findMany({ where: unreadFor(userId), select: { id: true } }),
  ]);
  const unreadIds = new Set(unread.map((c) => c.id));
  return rows.map((c) => {
    const asGuest = c.guestId === userId;
    return {
      id: c.id,
      otherName: asGuest ? c.host.name : c.guest.name,
      role: asGuest ? "guest" : "host",
      listingTitle: c.listing.title,
      listingImage: c.listing.images[0] ?? null,
      lastMessage: c.messages[0]?.body ?? "",
      lastMessageAt: c.lastMessageAt,
      unread: unreadIds.has(c.id),
    };
  });
}

/** A conversation the user takes part in (or null), with its messages, marked read for them. */
export async function openConversation(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, ...participantOf(userId) },
    select: {
      id: true,
      guestId: true,
      hostId: true,
      guest: { select: { id: true, name: true } },
      host: { select: { id: true, name: true } },
      listing: { select: { id: true, title: true, city: true, country: true, images: true, isPublished: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 500, select: { id: true, body: true, createdAt: true, senderId: true } },
    },
  });
  if (!conversation) return null;
  const now = new Date();
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: conversation.guestId === userId ? { guestReadAt: now } : { hostReadAt: now },
  });
  return conversation;
}

/** Appends a message as `senderId`, who must be one of the two participants. */
export async function appendMessage(conversationId: string, senderId: string, body: string) {
  return prisma.$transaction(async (tx) => {
    const conversation = await tx.conversation.findFirst({
      where: { id: conversationId, ...participantOf(senderId) },
      select: { id: true, guestId: true },
    });
    if (!conversation) return null;
    const now = new Date();
    const message = await tx.message.create({ data: { conversationId, senderId, body, createdAt: now } });
    await tx.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: now, ...(conversation.guestId === senderId ? { guestReadAt: now } : { hostReadAt: now }) },
    });
    return message;
  });
}
