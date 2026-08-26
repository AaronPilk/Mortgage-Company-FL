"use client";

import { useRef, useState } from "react";
import type { AssistantLink, AssistantMessage, AssistantReply } from "@/lib/assistant-types";

/**
 * Site assistant widget.
 *
 * A floating helper that educates and routes — it never quotes a rate or makes a
 * decision (the server enforces that). Renders nothing unless the feature is on,
 * so it stays dark until enabled. Conversation lives only in this component's
 * state; nothing is stored.
 */

type ChatEntry = {
  role: "user" | "assistant";
  content: string;
  links?: AssistantLink[];
  offerConnect?: boolean;
};

const GREETING: ChatEntry = {
  role: "assistant",
  content:
    "Hi! I can help you find a Florida home, size up a payment or what you can afford, look at refinancing, check your home's value, or connect you with a licensed officer. What's on your mind?",
  offerConnect: false
};

export function AssistantWidget({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ChatEntry[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  if (!enabled) return null;

  function scrollToEnd(): void {
    requestAnimationFrame(() => {
      if (listRef.current !== null) listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  }

  async function send(): Promise<void> {
    const text = input.trim();
    if (text === "" || sending) return;
    setFailed(false);
    const next: ChatEntry[] = [...entries, { role: "user", content: text }];
    setEntries(next);
    setInput("");
    setSending(true);
    scrollToEnd();

    // Send only the roles/content the API expects, capped to the recent turns.
    const payload: AssistantMessage[] = next
      .slice(-12)
      .map((entry) => ({ role: entry.role, content: entry.content }));

    try {
      const response = await fetch("/api/v1/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload })
      });
      const json = (await response.json()) as { ok: boolean; data?: AssistantReply };
      const data = json.data;
      if (!response.ok || json.ok !== true || data === undefined) {
        setFailed(true);
      } else {
        setEntries((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply,
            links: data.links,
            offerConnect: data.offerConnect
          }
        ]);
      }
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
      scrollToEnd();
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open the TRACT assistant"
        className="fixed bottom-4 right-4 z-40 flex min-h-[52px] items-center gap-2 rounded-full px-5 text-sm font-semibold text-white shadow-lg"
        style={{
          background: "var(--purple)",
          // Clear the iOS home indicator on notched phones, mirroring the bottom CTA bar.
          bottom: "calc(1rem + env(safe-area-inset-bottom))"
        }}
      >
        <span aria-hidden>💬</span> Ask a question
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-40 flex max-h-[min(70vh,560px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border shadow-2xl"
      style={{
        borderColor: "var(--border)",
        background: "var(--bg)",
        bottom: "calc(1rem + env(safe-area-inset-bottom))"
      }}
      role="dialog"
      aria-label="TRACT assistant"
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: "var(--purple)" }}
      >
        <p className="text-sm font-semibold text-white">TRACT assistant</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close the assistant"
          className="text-white/90 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {entries.map((entry, index) => (
          <div key={index} className={entry.role === "user" ? "text-right" : "text-left"}>
            <div
              className="inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm"
              style={
                entry.role === "user"
                  ? { background: "var(--purple)", color: "#fff" }
                  : { background: "var(--surface-2)", color: "var(--text)" }
              }
            >
              {entry.content}
            </div>
            {entry.role === "assistant" &&
              ((entry.links !== undefined && entry.links.length > 0) ||
                entry.offerConnect === true) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {(entry.links ?? []).map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="rounded-full border px-3 py-1 text-xs font-semibold"
                      style={{ borderColor: "var(--purple)", color: "var(--purple)" }}
                    >
                      {link.label}
                    </a>
                  ))}
                  {entry.offerConnect === true &&
                    !(entry.links ?? []).some((link) => link.href === "/talk") && (
                      <a
                        href="/talk"
                        className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                        style={{ background: "var(--purple)" }}
                      >
                        Talk to a licensed officer
                      </a>
                    )}
                </div>
              )}
          </div>
        ))}
        {sending && (
          <p className="text-left text-xs" style={{ color: "var(--text-muted)" }}>
            Thinking…
          </p>
        )}
        {failed && (
          <p className="text-left text-xs" style={{ color: "var(--color-warning)" }}>
            Something went wrong — try again, or{" "}
            <a href="/talk" className="underline">
              talk to a licensed officer
            </a>
            .
          </p>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
        className="flex items-center gap-2 border-t p-3"
        style={{ borderColor: "var(--border)" }}
      >
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about homes, payments, refinancing…"
          aria-label="Your question"
          maxLength={1500}
          className="min-h-[44px] flex-1 rounded-lg border bg-transparent px-3 text-sm outline-none focus:border-[var(--purple)]"
          style={{ borderColor: "var(--border)" }}
        />
        <button
          type="submit"
          disabled={sending || input.trim() === ""}
          className="min-h-[44px] rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--purple)" }}
        >
          Send
        </button>
      </form>
      <p className="px-3 pb-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
        General information, not a quote, an approval, or advice. A licensed officer handles your
        specifics.
      </p>
    </div>
  );
}
