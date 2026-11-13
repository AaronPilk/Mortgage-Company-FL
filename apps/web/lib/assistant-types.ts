/**
 * Client-safe shapes for the site assistant.
 *
 * A types-only module so the chat widget and the server orchestration share
 * shapes without the client pulling in any `server-only` code.
 */

export type AssistantMessage = { role: "user" | "assistant"; content: string };

export type AssistantLink = { label: string; href: string };

export type AssistantReply = {
  reply: string;
  /** Resolved, whitelisted site links the assistant surfaced (never free URLs). */
  links: AssistantLink[];
  /** True when the assistant is offering to connect the visitor with a licensed officer. */
  offerConnect: boolean;
};
