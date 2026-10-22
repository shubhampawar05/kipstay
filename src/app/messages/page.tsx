import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listInbox } from "@/lib/messages";
import { InboxList } from "@/components/messages/inbox-list";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const user = await requireUser("/messages");
  const inbox = await listInbox(user.id);

  return (
    <div className="page-gutter py-8">
      <h1 className="text-[32px] leading-9 font-semibold">Messages</h1>
      {inbox.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="You don't have any messages"
          action={
            <Link href="/s" className={buttonVariants()}>
              Explore stays
            </Link>
          }
        >
          When you contact a host or send a reservation request, you&apos;ll see your messages here.
        </EmptyState>
      ) : (
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[380px_minmax(0,1fr)]">
          <InboxList items={inbox} />
          <div className="hidden place-items-center rounded-2xl border border-dashed border-grey-400 text-muted-foreground lg:grid">
            Select a conversation
          </div>
        </div>
      )}
    </div>
  );
}
