import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listInbox, MESSAGE_MAX, openConversation } from "@/lib/messages";
import { InboxList } from "@/components/messages/inbox-list";
import { MessageThread } from "@/components/messages/message-thread";

export const metadata: Metadata = { title: "Messages" };

export default async function ConversationPage({ params }: PageProps<"/messages/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/messages/${id}`);
  // Participants only: anyone else gets a 404. Opening it marks it read for this user.
  const conversation = await openConversation(id, user.id);
  if (!conversation) notFound();
  const inbox = await listInbox(user.id);
  const other = conversation.guestId === user.id ? conversation.host : conversation.guest;
  const { listing } = conversation;

  return (
    <div className="page-gutter py-6">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <h1 className="mb-4 text-[26px] leading-[30px] font-semibold">Messages</h1>
          <InboxList items={inbox} activeId={conversation.id} />
        </div>
        <section aria-labelledby="thread-heading" className="flex min-h-[70dvh] flex-col rounded-2xl border border-grey-400">
          <header className="flex items-center gap-3 border-b border-grey-300 px-4 py-3">
            <Link
              href="/messages"
              aria-label="All messages"
              className="grid size-9 place-items-center rounded-full transition-colors hover:bg-grey-100 focus-ring lg:hidden"
            >
              <ChevronLeft className="size-5" />
            </Link>
            <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-grey-200">
              {listing.images[0] && <Image src={listing.images[0]} alt="" fill unoptimized className="object-cover" sizes="40px" />}
            </span>
            <div className="min-w-0">
              <h2 id="thread-heading" className="truncate font-semibold">
                {other.name}
              </h2>
              <p className="truncate text-sm text-muted-foreground">
                {listing.isPublished ? (
                  <Link href={`/rooms/${listing.id}`} className="rounded-sm underline-offset-2 hover:underline focus-ring">
                    {listing.title}
                  </Link>
                ) : (
                  listing.title
                )}{" "}
                · {listing.city}, {listing.country}
              </p>
            </div>
          </header>
          <MessageThread
            conversationId={conversation.id}
            otherName={other.name}
            maxLength={MESSAGE_MAX}
            messages={conversation.messages.map((m) => ({ id: m.id, body: m.body, mine: m.senderId === user.id, at: m.createdAt.toISOString() }))}
          />
        </section>
      </div>
    </div>
  );
}
