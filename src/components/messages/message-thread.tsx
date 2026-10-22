"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Loader2 } from "lucide-react";
import { sendMessageAction } from "@/app/actions/messages";
import { cn } from "@/lib/utils";

type Item = { id: string; body: string; mine: boolean; at: string; pending?: boolean };

const POLL_MS = 8000;

/**
 * Message bubbles plus composer. Sends optimistically, keeps the newest message in view, and refreshes from the server
 * every few seconds while the tab is visible so replies show up without reloading.
 */
export function MessageThread({
  conversationId,
  messages,
  otherName,
  maxLength,
}: {
  conversationId: string;
  messages: Item[];
  otherName: string;
  maxLength: number;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  // Server messages win once they arrive; pending bubbles only fill the gap.
  const shown = [...messages, ...sending.filter((p) => !messages.some((m) => m.mine && m.body === p.body && m.at >= p.at))];

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end", behavior: shown.length > 20 ? "auto" : "smooth" });
  }, [shown.length]);

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [router]);

  function send() {
    const text = draft.trim();
    if (!text || pending) return;
    setError(null);
    const temp: Item = { id: `pending-${Date.now()}`, body: text, mine: true, at: new Date().toISOString(), pending: true };
    setSending((s) => [...s, temp]);
    setDraft("");
    start(async () => {
      const result = await sendMessageAction(conversationId, text).catch(() => ({
        ok: false as const,
        error: "Couldn't send. Check your connection.",
      }));
      if (!result.ok) {
        setError(result.error);
        setDraft(text);
        setSending((s) => s.filter((m) => m.id !== temp.id));
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <ol
        className="flex-1 space-y-3 overflow-y-auto px-4 py-6"
        aria-label={`Conversation with ${otherName}`}
        aria-live="polite"
        data-testid="thread"
      >
        {shown.map((m) => (
          <li key={m.id} className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "kip-fade-in max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-5 whitespace-pre-wrap",
                m.mine ? "rounded-br-md bg-foreground text-background" : "rounded-bl-md bg-grey-200 text-foreground",
                m.pending && "opacity-60",
              )}
            >
              <span className="sr-only">{m.mine ? "You" : otherName}: </span>
              {m.body}
              <time dateTime={m.at} className={cn("mt-1 block text-[11px]", m.mine ? "text-background/70" : "text-muted-foreground")}>
                {m.pending
                  ? "Sending…"
                  : new Date(m.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </time>
            </div>
          </li>
        ))}
        <div ref={end} />
      </ol>
      <form
        className="border-t border-grey-300 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        {error && (
          <p role="alert" className="mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex items-end gap-2 rounded-3xl border border-grey-600 px-4 py-2 transition-shadow focus-within:border-foreground focus-within:shadow-[inset_0_0_0_1px_#222]">
          <label htmlFor="composer" className="sr-only">
            Message {otherName}
          </label>
          <textarea
            id="composer"
            value={draft}
            maxLength={maxLength}
            rows={1}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Write a message"
            className="max-h-40 min-h-6 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none [field-sizing:content]"
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!draft.trim() || pending}
            className="bg-brand-gradient grid size-9 shrink-0 place-items-center rounded-full text-white press focus-ring disabled:opacity-40"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" strokeWidth={2.5} />}
          </button>
        </div>
        <p className="mt-1 px-2 text-[11px] text-muted-foreground">Enter to send · Shift + Enter for a new line</p>
      </form>
    </>
  );
}
