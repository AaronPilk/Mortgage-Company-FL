import { z } from "zod";

/**
 * Site-assistant request.
 *
 * A short conversation the visitor is having with the on-site helper. It is
 * general education and navigation — never an application — so the schema caps
 * the turn count and the length of each message hard, and carries no identity
 * fields. The server treats the content as untrusted free text.
 */
export const AssistantMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(1500)
});

export const AssistantRequestSchema = z.object({
  messages: z.array(AssistantMessageSchema).min(1).max(20)
});

export type AssistantMessageInput = z.infer<typeof AssistantMessageSchema>;
export type AssistantRequestInput = z.infer<typeof AssistantRequestSchema>;
